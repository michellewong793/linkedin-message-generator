import { createAdminClient } from '@/lib/supabase/admin';

interface WebhookPayload {
    id: string;
    source: { type: string; id: number; name: string };
    payload: {
        fullName?: string;
        title?: string;
        organization?: { name?: string; domain?: string };
        primaryEmail?: string;
        professionalEmail?: string;
        phoneNumbers?: string[];
        linkedIn?: string;
        commonRoomContactLink?: string;
        segments?: { id: number; name: string }[];
    };
}

function extractMemberId(crLink: string | undefined): string | null {
    if (!crLink) return null;
    const match = crLink.match(/\/member\/(\d+)/);
    return match ? `c_${match[1]}` : null;
}

async function fetchRecentPages(email: string): Promise<{ url: string; numVisits: number }[]> {
    try {
        const res = await fetch(
            `https://api.commonroom.io/community/v1/members?email=${encodeURIComponent(email)}`,
            { headers: { Authorization: `Bearer ${process.env.COMMONROOM_API_KEY}` } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        const member = Array.isArray(data) ? data[0] : null;
        if (!member) return [];

        // The v1 API doesn't return recentWebPages but includes last seen web visit URLs
        // Return what we can from the API
        const pages: { url: string; numVisits: number }[] = [];
        if (member.last_seen_web_visit_url) {
            pages.push({ url: member.last_seen_web_visit_url, numVisits: 1 });
        }
        if (member.first_seen_web_visit_url && member.first_seen_web_visit_url !== member.last_seen_web_visit_url) {
            pages.push({ url: member.first_seen_web_visit_url, numVisits: 1 });
        }
        return pages;
    } catch {
        return [];
    }
}

export async function POST(request: Request) {
    try {
        // Verify webhook secret if configured
        const webhookSecret = process.env.COMMONROOM_WEBHOOK_SECRET;
        if (webhookSecret) {
            const incomingSecret = request.headers.get('x-commonroom-webhook-secret');
            if (incomingSecret !== webhookSecret) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body: WebhookPayload = await request.json();
        const { payload } = body;

        const email = payload.primaryEmail ?? payload.professionalEmail ?? null;
        const crLink = payload.commonRoomContactLink;
        const id = extractMemberId(crLink) ?? `webhook_${body.id}`;
        const linkedin = payload.linkedIn ?? null;
        const phone = payload.phoneNumbers?.[0] ?? null;

        const recentPages = email ? await fetchRecentPages(email) : [];

        const supabase = createAdminClient();
        const { error } = await supabase.from('signals').upsert({
            id,
            name: payload.fullName ?? null,
            title: payload.title ?? null,
            company: payload.organization?.name ?? null,
            email,
            phone,
            linkedin_url: linkedin,
            spark_summary: null,
            recent_pages: recentPages,
            cr_profile_url: crLink ?? null,
            status: 'new',
            synced_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        if (error) {
            console.error('Supabase upsert error:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ success: true, id });
    } catch (err) {
        console.error('Webhook error:', err);
        return Response.json({ error: String(err) }, { status: 500 });
    }
}
