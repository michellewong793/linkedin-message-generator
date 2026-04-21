import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { type, company, contact_name, contact_title, notes } = body;

        const { data, error } = await supabase.from('daily_prep_items').insert({
            user_id: user.id,
            type,
            company,
            contact_name: contact_name ?? null,
            contact_title: contact_title ?? null,
            notes,
        }).select().single();

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ item: data });
    } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
    }
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('daily_prep_items')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ items: data });
    } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await request.json();
        const { error } = await supabase
            .from('daily_prep_items')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
    }
}
