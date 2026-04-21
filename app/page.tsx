"use client";
import { useState } from "react";

const REASONS = [
  "New funding round",
  "Hiring spike / expansion",
  "New executive hire",
  "Product launch",
  "AI investment signals",
  "General outreach",
  "Custom reason",
];

export default function Home() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setMessage(null);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, title, reason: reason === "Custom reason" && customReason.trim() ? customReason.trim() : reason }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      setMessage(data.text);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!message) return;
    setSaving(true);
    await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "linkedin_message",
        company,
        contact_name: name,
        contact_title: title,
        notes: { message, reason },
      }),
    });
    setSaved(true);
    setSaving(false);
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
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500 dark:text-zinc-400 px-1">Reason for outreach</label>
            <select
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setCustomReason(""); }}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {reason === "Custom reason" && (
              <input
                className="mt-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
                placeholder="Describe your reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
          </div>
          <button
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
            onClick={handleGenerate}
            disabled={loading || !name || !company || !title}
          >
            {loading ? (
              <>
                <span className="bar-pop flex items-end gap-[3px]">
                  <span /><span /><span /><span />
                </span>
                Generating
              </>
            ) : "Generate Message"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-sm leading-relaxed">
              {message}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex h-10 w-fit items-center justify-center rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-60
                bg-green-200 text-green-800 hover:bg-green-100/70
                dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/20"
            >
              {saved ? "✓ Added to Today's Action Items" : saving ? "Saving..." : "Add to Daily Task List"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
