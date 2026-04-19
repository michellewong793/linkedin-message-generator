"use client";
import { useState } from "react";

interface CallPrep {
  context: string;
  painPoints: string[];
  discoveryQuestions: string[];
}

export default function CallPrepPage() {
  const [company, setCompany] = useState("");
  const [prep, setPrep] = useState<CallPrep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!company.trim()) return;
    setLoading(true);
    setPrep(null);
    setError(null);

    const res = await fetch("/api/call-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: company.trim() }),
    });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setPrep(data);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-32 px-16 bg-white dark:bg-black">
        <div>
          <h1 className="text-2xl font-bold">Call Prep</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Enter a company name to get context, pain points, and discovery questions.
          </p>
        </div>

        <div className="flex gap-3">
          <input
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 whitespace-nowrap"
            onClick={handleSearch}
            disabled={loading || !company.trim()}
          >
            {loading ? "Researching..." : "Prep Call"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {prep && (
          <div className="flex flex-col gap-6">
            <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                Company Context
              </h2>
              <p className="text-sm leading-relaxed">{prep.context}</p>
            </section>

            <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
                Likely Pain Points
              </h2>
              <ul className="flex flex-col gap-2">
                {prep.painPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-zinc-400 shrink-0">—</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-3">
                Discovery Questions
              </h2>
              <ol className="flex flex-col gap-3">
                {prep.discoveryQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-zinc-400 shrink-0 font-medium">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
