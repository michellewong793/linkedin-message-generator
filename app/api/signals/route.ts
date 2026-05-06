import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('signals')
            .select('*')
            .order('synced_at', { ascending: false });

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ items: data });
    } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const contacts: Signal[] = Array.isArray(body) ? body : [body];

        const rows = contacts.map((c) => ({
            id: c.id,
            name: c.name ?? null,
            title: c.title ?? null,
            company: c.company ?? null,
            email: c.email ?? null,
            phone: c.phone ?? null,
            linkedin_url: c.linkedin_url ?? null,
            spark_summary: c.spark_summary ?? null,
            recent_pages: c.recent_pages ?? [],
            cr_profile_url: c.cr_profile_url ?? null,
            status: c.status ?? 'new',
        }));

        const { error } = await supabase
            .from('signals')
            .upsert(rows, { onConflict: 'id' });

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ success: true, count: rows.length });
    } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, status } = await request.json();
        const { error } = await supabase
            .from('signals')
            .update({ status })
            .eq('id', id);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
    }
}

interface Signal {
    id: string;
    name?: string | null;
    title?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
    spark_summary?: string | null;
    recent_pages?: { url: string; numVisits: number }[];
    cr_profile_url?: string | null;
    status?: string;
}
