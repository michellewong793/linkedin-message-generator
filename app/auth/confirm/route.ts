import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

// Handles Magic Link, password recovery, and invite emails — including ones
// sent directly from the Supabase dashboard, which are never initiated by the
// recipient's browser and so can't rely on a locally-stored PKCE code
// verifier. verifyOtp with a token_hash works regardless of who sent it.
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') ?? '/';

    if (tokenHash && type) {
        const supabase = await createClient();
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        if (!error) {
            const redirectPath = type === 'recovery' ? '/auth/reset-password' : next;
            return NextResponse.redirect(`${origin}${redirectPath}`);
        }
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('That link is invalid or has expired.')}`);
}
