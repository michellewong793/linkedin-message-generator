import { generateText, tool, stepCountIs } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import { z } from 'zod';

const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
});

const scrapeCompanyWebsite = tool({
    description: 'Scrape a company website to find signals that they are interested in or investing in AI (job postings, blog posts, product announcements, etc.)',
    inputSchema: z.object({
        url: z.string().describe('The URL of the company website to scrape'),
    }),
    execute: async ({ url }) => {
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkedInMessageBot/1.0)' },
                signal: AbortSignal.timeout(8000),
            });
            const html = await response.text();

            const text = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 6000);

            return { url, content: text };
        } catch (err) {
            return { url, content: '', error: String(err) };
        }
    },
});

const SYSTEM_PROMPT = `You are Miche Wong, a GTM rep at Vercel, writing your own outreach. Write like a real person texting a peer, not a sales AI drafting copy. Follow these rules exactly:

- Never use an em dash or en dash (—, –). Use a comma or period instead.
- Never explain generically what Vercel does, and never list more than one feature or benefit. Pick ONE specific angle relevant to this person and say it in a single short sentence.
- Vercel is the platform for building and shipping AI agents, and the infrastructure for building workflows and apps. Only lean on that framing when it's genuinely the most relevant angle for this person's role and company — say it in plain, casual language, not marketing copy (e.g. "we've been shipping a lot on the AI agent side that could be relevant for what you're building", not "Vercel provides a robust platform for agent orchestration").
- Never use: "synergies", "circle back", "touch base", "leverage", "I'd love to explore", "hoping to connect", "I'd love to schedule a demo".
- Never open with "I hope this message finds you well". Vary your opener — don't always start with "I noticed".
- Ask at most one question in the whole message.
- Keep it short: a LinkedIn message is 3-5 sentences. An email body is one to two short paragraphs.
- End with a low-key, casual call to action, like "Would love to chat if you're open to it" or "Open to a quick chat?".
- It's fine to be transparent that it's a pitch ("full disclosure this is a sales pitch haha") if it fits naturally, but don't force it.
- When given a task, execute it immediately using the available tools. Never ask for clarification — all required information is provided. Return only the final message text, no preamble, no explanation, no markdown formatting.`;

function stripEmDashes(text: string): string {
    return text
        .replace(/\s*[—–]\s*/g, ', ')
        .replace(/,\s*([.!?])/g, '$1')
        .replace(/,\s*,/g, ',');
}

export async function POST(request: Request) {
    try {
        const { name, company, title, reason, linkedinUrl, website, channel } = await request.json();
        const companyUrl = website
            ? (website.startsWith('http') ? website : `https://${website}`)
            : `https://www.${company.toLowerCase().replace(/\s+/g, '')}.com`;

        const isEmail = channel === 'email';
        const format = isEmail
            ? `Format it as a "Subject: ..." line, then a short one-to-two paragraph body, then sign off on its own line with "Best, Miche". Under 130 words total.`
            : `Format it as 3-5 sentences, casual and human. No sign-off.`;

        const { text } = await generateText({
            model: gateway('anthropic/claude-sonnet-4-5'),
            tools: { scrapeCompanyWebsite },
            stopWhen: stepCountIs(3),
            system: SYSTEM_PROMPT,
            prompt: `Scrape ${companyUrl} using the scrapeCompanyWebsite tool and look for signals about what ${company} actually builds or is investing in (product, AI initiatives, job postings, blog posts, partnerships).${linkedinUrl ? ` The prospect's LinkedIn profile is ${linkedinUrl} — use their background to personalize the message.` : ''}

Then write a${isEmail ? 'n' : ''} ${isEmail ? 'email' : 'LinkedIn message'} to ${name}, who is ${title} at ${company}. The reason for reaching out: "${reason}".

Tie the Vercel angle specifically to ${name}'s role as ${title} and to what you found ${company} actually does. If their role is on the engineering, platform, infrastructure, or AI side, connect it to Vercel being the platform for building and shipping AI agents and the infrastructure for building workflows and apps, phrased casually. If their role is more on the business, growth, or leadership side, pick a different specific angle that's actually relevant to them (e.g. what their team is building, a signal from their site, momentum, pricing) instead of the agents/infra framing. State the angle in one short sentence, don't stack multiple features, and don't explain what Vercel does generically.

${format}`,
        });
        return Response.json({ text: stripEmDashes(text) });
    } catch (err) {
        console.error(err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}
