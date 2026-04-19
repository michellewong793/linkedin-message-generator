"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md px-3 py-2 text-sm text-left opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
    >
      Sign out
    </button>
  );
}
