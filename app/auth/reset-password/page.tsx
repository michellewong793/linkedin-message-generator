"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
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
        </div>
        <h1 className="text-base font-semibold text-center -mt-2">Set a new password</h1>

        {done ? (
          <p className="text-sm text-center text-green-700 dark:text-green-400">
            Password updated — taking you in...
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
              className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              className="flex h-10 items-center justify-center rounded-full ginkgo-btn px-5 text-sm font-medium"
              onClick={handleSubmit}
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? "..." : "Update password"}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
