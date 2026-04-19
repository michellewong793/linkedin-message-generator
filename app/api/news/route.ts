import { generateText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { stepCountIs } from 'ai';
import { z } from 'zod';

const scrapeUrl = tool({
    description: 'Fetch and extract text content from a URL',
    inputSchema: z.object({
        url: z.string().describe('The URL to scrape'),
    }),
    execute: async ({ url }) => {
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' },
                signal: AbortSignal.timeout(8000),
            });
            const html = await response.text();
            const text = html
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 5000);
            return { url, content: text };
        } catch (err) {
            return { url, content: '', error: String(err) };
        }
    },
});

export async function POST(request: Request) {
    try {
        const { companies } = await request.json();
        if (!Array.isArray(companies) || companies.length === 0) {
            return Response.json({ error: 'Provide at least one company name.' }, { status: 400 });
        }

        const results = await Promise.all(
            companies.map(async (company: string) => {
                const searchUrl = `https://techcrunch.com/search/?q=${encodeURIComponent(company + ' funding')}`;
                const { text } = await generateText({
                    model: anthropic('claude-haiku-4-5-20251001'),
                    tools: { scrapeUrl },
                    stopWhen: stepCountIs(2),
                    system: 'You are a funding news researcher. Use the scrapeUrl tool to fetch news, then summarize any funding rounds, investments, or fundraising activity you find. If nothing is found, say so clearly. Be concise (under 200 words).',
                    prompt: `Search for recent funding news about "${company}". Scrape this URL: ${searchUrl}`,
                });
                return { company, news: text };
            })
        );

        return Response.json({ results });
    } catch (err) {
        console.error(err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}
