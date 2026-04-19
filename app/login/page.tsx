"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        if (data.user && firstName) {
          await supabase
            .from("profiles")
            .update({ first_name: firstName })
            .eq("id", data.user.id);
        }
        setMessage("Check your email to confirm your account.");
      }
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black font-sans">
      <div className="w-full max-w-sm flex flex-col gap-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
        <h1 className="text-xl font-bold">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>

        <div className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          )}
          <input
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <input
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading || !email || !password || (mode === "signup" && !firstName)}
          >
            {loading ? "..." : mode === "login" ? "Sign in" : "Sign up"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {message && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        )}

        <button
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-left"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setMessage(null); }}
        >
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
