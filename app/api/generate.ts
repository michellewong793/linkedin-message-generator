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

export async function POST(request: Request) {
    try {
        const { name, company, title, reason } = await request.json();
        const companyUrl = `https://www.${company.toLowerCase().replace(/\s+/g, '')}.com`;
        const { text } = await generateText({
            model: gateway('anthropic/claude-sonnet-4-5'),
            tools: { scrapeCompanyWebsite },
            stopWhen: stepCountIs(3),
            system: 'You are a Vercel sales assistant. When given a task, execute it immediately using the available tools. Never ask for clarification — all required information is provided. Return only the final output with no preamble.',
            prompt: `Scrape ${companyUrl} using the scrapeCompanyWebsite tool and look for signals that ${company} is investing in AI (job postings, blog posts, product features, partnerships). Then write a LinkedIn outreach message to ${name} (${title} at ${company}). The reason for reaching out is: "${reason}". Reference that reason and any relevant AI signals found, and explain how Vercel can help. Under 300 characters, no explanations.`,
        });
        return Response.json({ text });
    } catch (err) {
        console.error(err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}
