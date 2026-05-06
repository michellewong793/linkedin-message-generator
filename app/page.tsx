"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const REASONS = [
  "New funding round",
  "Hiring spike / expansion",
  "New executive hire",
  "Product launch",
  "AI investment signals",
  "General outreach",
  "Custom reason",
];

interface GeneratedMessage {
  id: number;
  name: string;
  company: string;
  title: string;
  reason: string;
  text: string;
}

function HomeInner() {
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [reason, setReason] = useState(() => {
    const r = searchParams.get("reason");
    return r && REASONS.includes(r) ? r : REASONS[0];
  });
  const [customReason, setCustomReason] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [messages, setMessages] = useState<GeneratedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nextId, setNextId] = useState(0);

  const effectiveReason = reason === "Custom reason" && customReason.trim() ? customReason.trim() : reason;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, title, linkedinUrl, reason: effectiveReason }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: nextId, name, company, title, reason: effectiveReason, text: data.text },
      ]);
      setNextId((n) => n + 1);
      setName("");
      setCompany("");
      setTitle("");
      setLinkedinUrl("");
      setReason(REASONS[0]);
      setCustomReason("");
    }
    setLoading(false);
  }

  function removeMessage(id: number) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSaveAll() {
    if (messages.length === 0) return;
    setSaving(true);
    await Promise.all(
      messages.map((m) =>
        fetch("/api/action-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "linkedin_message",
            company: m.company,
            contact_name: m.name,
            contact_title: m.title,
            notes: { message: m.text, reason: m.reason },
          }),
        })
      )
    );
    setSaved(true);
    setSaving(false);
    setMessages([]);
  }

  return (
    <div className="flex flex-1 h-full font-sans bg-white dark:bg-black">
      {/* Left: form */}
      <div className="w-1/2 flex flex-col gap-6 px-12 py-16 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
        <h1 className="text-xl font-medium">Write an outreach message</h1>

        <div className="flex flex-col gap-4">
          <input
            className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
            placeholder="LinkedIn URL (optional)"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
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
                className="mt-1 ginkgo-input rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm"
                placeholder="Describe your reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
          </div>
          <button
            className="flex h-12 items-center justify-center gap-2 rounded-full ginkgo-btn px-5 text-sm font-medium"
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
      </div>

      {/* Right: generated messages */}
      <div className="w-1/2 flex flex-col px-12 py-16 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">
            Generated Messages
            {messages.length > 0 && (
              <span className="ml-2 text-sm font-normal text-zinc-400">({messages.length})</span>
            )}
          </h2>
          {messages.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={saving || saved}
              className="flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-60
                bg-green-200 text-green-800 hover:bg-green-100/70
                dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/20 whitespace-nowrap"
            >
              {saved ? "✓ Added to Today's Action Items" : saving ? "Saving..." : `Add All ${messages.length > 1 ? `(${messages.length}) ` : ""}to Daily Task List`}
            </button>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-400">Messages you generate will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className="ginkgo-card rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-zinc-500">{m.title} · {m.company}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Reason: {m.reason}</p>
                  </div>
                  <button
                    onClick={() => removeMessage(m.id)}
                    className="text-xs text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-sm leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
