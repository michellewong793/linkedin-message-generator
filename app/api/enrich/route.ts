import { generateObject } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import { z } from 'zod';

const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
});

interface SearchResult {
    title: string;
    snippet: string;
    url: string;
}

function decodeEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x2F;/g, '/');
}

function stripTags(s: string): string {
    return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

// DuckDuckGo wraps every result URL in a redirect: //duckduckgo.com/l/?uddg=<encoded>
function unwrapUrl(href: string): string {
    const m = href.match(/uddg=([^&]+)/);
    if (m) {
        try {
            return decodeURIComponent(m[1]);
        } catch {
            return href;
        }
    }
    return href.startsWith('//') ? `https:${href}` : href;
}

async function webSearch(query: string): Promise<SearchResult[]> {
    const res = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000),
        }
    );
    const html = await res.text();

    const results: SearchResult[] = [];
    // Each result block has a result__a anchor (title) followed by a result__snippet.
    const blockRe =
        /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:class="result__snippet"[^>]*>([\s\S]*?)<\/a>)?/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(html)) !== null && results.length < 8) {
        const url = unwrapUrl(m[1]);
        const title = stripTags(m[2] ?? '');
        const snippet = stripTags(m[3] ?? '');
        if (title) results.push({ url, title, snippet });
    }
    return results;
}

const enrichmentSchema = z.object({
    enrichedTitle: z
        .string()
        .nullable()
        .describe("The person's most likely current job title, or null if it cannot be determined from the sources."),
    seniorityTier: z
        .enum(['executive', 'leader', 'senior', 'mid', 'junior', 'intern', 'unknown'])
        .describe('executive = C-level/founder/VP; leader = Head/Director/senior manager; senior = staff/principal/lead IC; mid = individual contributor; junior = early career; intern = intern/student; unknown = could not determine.'),
    worthReaching: z
        .boolean()
        .describe('True if this person is a decision-maker or influencer worth a Vercel sales outreach (founder, exec, eng/platform/infra/AI leader, senior IC). False for interns, students, entry-level, administrative, or clearly unrelated roles.'),
    confidence: z
        .enum(['high', 'medium', 'low'])
        .describe('How confident you are in the enriched title given the quality and specificity of the sources.'),
    reasoning: z
        .string()
        .describe('One or two sentences explaining the title finding and the worth-reaching verdict, citing what the sources showed.'),
    linkedinUrl: z
        .string()
        .nullable()
        .describe('The URL of the LinkedIn profile that best matches this person, or null if none found.'),
});

export async function POST(request: Request) {
    try {
        const { name, email, company, website } = await request.json();

        // Build the best search query we can from whatever the CSV gave us.
        const person = (name && name.trim()) || (email ? email.split('@')[0].replace(/[._+-]/g, ' ') : '');
        const queryParts = [person, company, 'LinkedIn'].filter(Boolean);
        const query = queryParts.join(' ');

        const primary = await webSearch(query);
        // Second pass keyed on the email domain often disambiguates common names.
        let secondary: SearchResult[] = [];
        if (email && email.includes('@')) {
            secondary = await webSearch(`"${person}" ${email.split('@')[1]}`);
        }

        const seen = new Set<string>();
        const sources = [...primary, ...secondary]
            .filter((r) => {
                if (seen.has(r.url)) return false;
                seen.add(r.url);
                return true;
            })
            .slice(0, 8);

        const context = sources
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\n${r.url}`)
            .join('\n\n');

        const { object } = await generateObject({
            model: gateway('anthropic/claude-sonnet-4-5'),
            schema: enrichmentSchema,
            system:
                'You are a Vercel sales research assistant. You determine a prospect\'s real job title from public web/LinkedIn search results and judge whether they are worth reaching out to. Be conservative: only mark worthReaching=true when the evidence points to a decision-maker or influential technical/senior role. If the sources are ambiguous or clearly about a different person, say so and set confidence to low.',
            prompt: `Research this Salesforce contact whose title was blank.\n\nName: ${name || '(unknown)'}\nEmail: ${email || '(unknown)'}\nCompany: ${company || '(unknown)'}\nCompany website: ${website || '(unknown)'}\n\nSearch query used: "${query}"\n\nWeb / LinkedIn search results:\n${context || '(no results returned)'}\n\nUsing only these results, determine the person's actual current title and whether they are worth a Vercel outreach. Match the person to the right company (${company || 'unknown'}) — ignore results that are clearly a different individual.`,
        });

        return Response.json({
            ...object,
            query,
            sources: sources.map((s) => ({ title: s.title, url: s.url })),
        });
    } catch (err) {
        console.error(err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}
