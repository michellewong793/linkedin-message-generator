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
    <div className="flex min-h-screen items-center justify-center bg-[#f9faf8] dark:bg-black font-sans">
      <div className="w-full max-w-sm flex flex-col gap-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 pb-2">
          <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="50" y1="100" x2="50" y2="62" stroke="#4ade80" strokeWidth="6" strokeLinecap="round"/>
            <path d="M50 62 C50 62 18 58 10 30 C4 10 28 2 40 16 C46 23 50 38 50 62Z" fill="#4ade80" opacity="0.85"/>
            <path d="M50 62 C50 62 82 58 90 30 C96 10 72 2 60 16 C54 23 50 38 50 62Z" fill="#4ade80"/>
          </svg>
          <span className="font-semibold text-xl tracking-tight">Ginkgo</span>
          <p className="text-xs text-zinc-400 text-center">Your AI-powered sales sidekick</p>
        </div>
        <h1 className="text-base font-semibold text-center -mt-2">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        <div className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          )}
          <input
            className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <input
            className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            className="flex h-10 items-center justify-center rounded-full ginkgo-btn px-5 text-sm font-medium"
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
