"use client";
import { useState } from "react";

interface NewsResult {
  company: string;
  news: string;
}

export default function NewsPage() {
  const [companiesInput, setCompaniesInput] = useState("");
  const [results, setResults] = useState<NewsResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    const companies = companiesInput
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    if (companies.length === 0) return;

    setLoading(true);
    setResults([]);
    setError(null);

    const res = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companies }),
    });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setResults(data.results);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-32 px-16 bg-white dark:bg-black">
        <div>
          <h1 className="text-2xl font-bold">Funding News</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Enter one company per line to search for recent funding news.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <textarea
            className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm resize-none h-36"
            placeholder={"Stripe\nOpenAI\nAnthropic"}
            value={companiesInput}
            onChange={(e) => setCompaniesInput(e.target.value)}
          />
          <button
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
            onClick={handleSearch}
            disabled={loading || !companiesInput.trim()}
          >
            {loading ? "Searching..." : "Search News"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            {results.map(({ company, news }) => (
              <div
                key={company}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4"
              >
                <h2 className="text-sm font-semibold mb-2">{company}</h2>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {news}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
