"use client";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setMessage(null);
    setError(null);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, title }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      setMessage(data.text);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-32 px-16 bg-white dark:bg-black">
        
        <h1 className="text-2xl font-bold">Generate personalized LinkedIn message</h1>

        <div className="flex flex-col gap-4">
          <input
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
            onClick={handleGenerate}
            disabled={loading || !name || !company || !title}
          >
            {loading ? "Generating..." : "Generate Message"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-sm leading-relaxed">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}
