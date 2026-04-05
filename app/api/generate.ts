import { generateText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';

const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { name, company, title } = await request.json();
        const { text } = await generateText({
            model: gateway('anthropic/claude-sonnet-4.6'),
            prompt: `Write a short, personalized LinkedIn message to ${name}, who is a ${title} at ${company}. Make it personalized to the company's industry and Vercel's customers that are in that industry. The message should ask them to set up a meeting to learn more about Vercel and how it could help their team. Keep it friendly, concise, and under 300 characters.`,
        });
        return Response.json({ text });
    } catch (err) {
        console.error(err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}
