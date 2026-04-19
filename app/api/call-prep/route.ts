import { generateText, tool, stepCountIs } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { cacheLife } from 'next/cache';
import { z } from 'zod';

async function getCallPrep(company: string) {
    'use cache';
    cacheLife('days');

    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

    const scrapeUrl = tool({
        description: 'Fetch and extract text content from a URL',
        inputSchema: z.object({
            url: z.string().describe('The URL to scrape'),
        }),
        execute: async ({ url }) => {
            try {
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CallPrepBot/1.0)' },
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

    const companyUrl = `https://www.${company.toLowerCase().replace(/\s+/g, '')}.com`;
    const { text } = await generateText({
        model: openrouter('anthropic/claude-haiku-4-5'),
        tools: { scrapeUrl },
        stopWhen: stepCountIs(2),
        system: 'You are a sales call prep assistant for a Vercel AE. Use the scrapeUrl tool to research the company, then return a JSON object with exactly these keys: "context" (3-4 sentence company overview relevant to a sales call), "painPoints" (array of 3 likely pain points related to web infrastructure, performance, or developer experience), "discoveryQuestions" (array of 5 sharp discovery questions an AE would ask). Return only valid JSON, no markdown.',
        prompt: `Research ${company} by scraping ${companyUrl}. Return the call prep JSON.`,
    });

    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        return JSON.parse(jsonMatch[0]);
    } catch {
        return { context: text, painPoints: [], discoveryQuestions: [] };
    }
}

export async function POST(request: Request) {
    try {
        const { company } = await request.json();
        if (!company?.trim()) {
            return Response.json({ error: 'Company name is required.' }, { status: 400 });
        }
        const prep = await getCallPrep(company.trim());
        return Response.json(prep);
    } catch (err) {
        console.error(err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}
