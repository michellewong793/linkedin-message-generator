import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import SoundLink from "./SoundLink";

export async function NavBar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("first_name").eq("id", user.id).single()
    : { data: null };

  if (!user) return null;

  return (
    <nav className="sticky top-0 h-screen w-48 shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-6">
      <div className="flex items-center gap-2 px-2 mb-5">
        <svg width="33" height="33" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* stem */}
          <line x1="50" y1="100" x2="50" y2="62" stroke="#4ade80" strokeWidth="6" strokeLinecap="round"/>
          {/* left lobe */}
          <path d="M50 62 C50 62 18 58 10 30 C4 10 28 2 40 16 C46 23 50 38 50 62Z" fill="#4ade80" opacity="0.85"/>
          {/* right lobe */}
          <path d="M50 62 C50 62 82 58 90 30 C96 10 72 2 60 16 C54 23 50 38 50 62Z" fill="#4ade80"/>
        </svg>
        <span className="font-semibold text-xl tracking-tight">Ginkgo</span>
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <SoundLink href="/action-items" className="rounded-full px-2 py-1 text-sm font-medium text-green-700/80 dark:text-green-500/70 bg-green-100/60 dark:bg-green-900/20 hover:bg-green-100/40 dark:hover:bg-green-900/10 transition-colors">
          Today's Action Items
        </SoundLink>
        <Link href="/" className="rounded-md px-3 py-2 text-sm opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
          Generate Message
        </Link>
<Link href="/call-prep" className="rounded-md px-3 py-2 text-sm opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
          Call Prep
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <p className="px-3 text-xs text-zinc-400 truncate">
          {profile?.first_name ?? user.email}
        </p>
        <SignOutButton />
      </div>
    </nav>
  );
}
