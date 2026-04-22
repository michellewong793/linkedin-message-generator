"use client";
import { useState, useEffect, useRef } from "react";

interface ActionItem {
  id: string;
  type: "call_prep" | "linkedin_message";
  company: string;
  contact_name: string | null;
  contact_title: string | null;
  notes: Record<string, unknown>;
  created_at: string;
}

interface Potato {
  id: string;
  contact_name: string | null;
  company: string | null;
  done: boolean;
}

interface Sqo {
  id: string;
  company: string | null;
  done: boolean;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ActionItemsPage() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [potatoes, setPotatoes] = useState<Potato[]>([]);
  const [sqos, setSqos] = useState<Sqo[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPotatoModal, setShowPotatoModal] = useState(false);
  const [potatoName, setPotatoName] = useState("");
  const [potatoCompany, setPotatoCompany] = useState("");
  const [savingPotato, setSavingPotato] = useState(false);

  const [showSqoModal, setShowSqoModal] = useState(false);
  const [sqoCompany, setSqoCompany] = useState("");
  const [savingSqo, setSavingSqo] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/action-items").then((r) => r.json()),
      fetch("/api/potatoes").then((r) => r.json()),
      fetch("/api/sqos").then((r) => r.json()),
    ]).then(([actionData, potatoData, sqoData]) => {
      if (actionData.items) setItems(actionData.items);
      if (potatoData.items) setPotatoes(potatoData.items);
      if (sqoData.items) setSqos(sqoData.items);
      setLoading(false);
    });
  }, []);

  async function addPotato() {
    setSavingPotato(true);
    const res = await fetch("/api/potatoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_name: potatoName, company: potatoCompany }),
    });
    const data = await res.json();
    if (data.item) setPotatoes((prev) => [data.item, ...prev]);
    setPotatoName("");
    setPotatoCompany("");
    setSavingPotato(false);
    setShowPotatoModal(false);
  }

  async function togglePotato(id: string, done: boolean) {
    await fetch("/api/potatoes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, done }) });
    setPotatoes((prev) => prev.map((p) => p.id === id ? { ...p, done } : p));
  }

  async function deletePotato(id: string) {
    await fetch("/api/potatoes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setPotatoes((prev) => prev.filter((p) => p.id !== id));
  }

  async function addSqo() {
    setSavingSqo(true);
    const res = await fetch("/api/sqos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: sqoCompany }),
    });
    const data = await res.json();
    if (data.item) setSqos((prev) => [data.item, ...prev]);
    setSqoCompany("");
    setSavingSqo(false);
    setShowSqoModal(false);
  }

  async function toggleSqo(id: string, done: boolean) {
    await fetch("/api/sqos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, done }) });
    setSqos((prev) => prev.map((s) => s.id === id ? { ...s, done } : s));
  }

  async function deleteSqo(id: string) {
    await fetch("/api/sqos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setSqos((prev) => prev.filter((s) => s.id !== id));
  }

  async function deleteActionItem(id: string) {
    await fetch("/api/action-items", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const callPrepItems = items.filter((i) => i.type === "call_prep");
  const messageItems = items.filter((i) => i.type === "linkedin_message");

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-black font-sans min-h-screen">
      <main className="flex flex-1 w-full max-w-5xl flex-col gap-10 py-16 px-16">
        <div>
          <h1 className="text-2xl font-bold">Today's Action Items</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Potatoes + SQOs side by side */}
        <div className="grid grid-cols-2 gap-6">
          {/* Potatoes */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Potatoes</h2>
              <button
                onClick={() => setShowPotatoModal(true)}
                className="text-xs rounded-full px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                + Add New
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {loading && <p className="text-xs text-zinc-400">Loading...</p>}
              {!loading && potatoes.length === 0 && (
                <p className="text-xs text-zinc-400 py-2">No potatoes yet.</p>
              )}
              {potatoes.map((p) => (
                <div key={p.id} className="flex items-start gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors px-3 py-2">
                  <input
                    type="checkbox"
                    checked={p.done}
                    onChange={(e) => togglePotato(p.id, e.target.checked)}
                    className="mt-0.5 accent-zinc-600 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {p.contact_name && (
                      <p className={`text-sm font-medium truncate ${p.done ? "line-through text-zinc-400" : ""}`}>{p.contact_name}</p>
                    )}
                    {p.company && (
                      <p className={`text-xs text-zinc-500 truncate ${p.done ? "line-through" : ""}`}>{p.company}</p>
                    )}
                    {!p.contact_name && !p.company && (
                      <p className="text-xs text-zinc-400 italic">No details</p>
                    )}
                  </div>
                  <button onClick={() => deletePotato(p.id)} className="text-zinc-300 hover:text-red-400 transition-colors shrink-0 text-xs">×</button>
                </div>
              ))}
            </div>
          </section>

          {/* SQOs */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">SQOs for the Month</h2>
              <button
                onClick={() => setShowSqoModal(true)}
                className="text-xs rounded-full px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                + Add New
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {loading && <p className="text-xs text-zinc-400">Loading...</p>}
              {!loading && sqos.length === 0 && (
                <p className="text-xs text-zinc-400 py-2">No SQOs yet.</p>
              )}
              {sqos.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors px-3 py-2">
                  <p className="text-sm flex-1 truncate">
                    {s.company || <span className="italic text-zinc-400">No company</span>}
                  </p>
                  <button onClick={() => deleteSqo(s.id)} className="text-zinc-300 hover:text-red-400 transition-colors shrink-0 text-xs">×</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Saved action items */}
        {(callPrepItems.length > 0 || messageItems.length > 0) && (
          <div className="flex flex-col gap-6">
            {callPrepItems.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Call Prep</h2>
                {callPrepItems.map((item) => {
                  const notes = item.notes as { context?: string; painPoints?: string[]; discoveryQuestions?: string[] };
                  return (
                    <div key={item.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-sm">{item.company}</h3>
                        <button onClick={() => deleteActionItem(item.id)} className="text-xs text-zinc-400 hover:text-red-500 transition-colors shrink-0">Remove</button>
                      </div>
                      {notes.context && <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{notes.context}</p>}
                      {notes.painPoints && notes.painPoints.length > 0 && (
                        <ul className="flex flex-col gap-1">
                          {notes.painPoints.map((p, i) => (
                            <li key={i} className="text-sm flex gap-2"><span className="text-zinc-400 shrink-0">—</span><span>{p}</span></li>
                          ))}
                        </ul>
                      )}
                      {notes.discoveryQuestions && notes.discoveryQuestions.length > 0 && (
                        <ol className="flex flex-col gap-1">
                          {notes.discoveryQuestions.map((q, i) => (
                            <li key={i} className="text-sm flex gap-2"><span className="text-zinc-400 shrink-0">{i + 1}.</span><span>{q}</span></li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {messageItems.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">LinkedIn Messages</h2>
                {messageItems.map((item) => {
                  const notes = item.notes as { message?: string; reason?: string };
                  return (
                    <div key={item.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-sm">{item.contact_name}</h3>
                          <p className="text-xs text-zinc-500">{item.contact_title} · {item.company}</p>
                        </div>
                        <button onClick={() => deleteActionItem(item.id)} className="text-xs text-zinc-400 hover:text-red-500 transition-colors shrink-0">Remove</button>
                      </div>
                      {notes.reason && <p className="text-xs text-zinc-400">Reason: {notes.reason}</p>}
                      {notes.message && <p className="text-sm leading-relaxed">{notes.message}</p>}
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        )}
      </main>

      {/* Potato modal */}
      {showPotatoModal && (
        <Modal title="Add Potato" onClose={() => setShowPotatoModal(false)}>
          <div className="flex flex-col gap-3">
            <input
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
              placeholder="Contact name (optional)"
              value={potatoName}
              onChange={(e) => setPotatoName(e.target.value)}
            />
            <input
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
              placeholder="Company (optional)"
              value={potatoCompany}
              onChange={(e) => setPotatoCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPotato()}
            />
            <button
              onClick={addPotato}
              disabled={savingPotato}
              className="flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
            >
              {savingPotato ? "Adding..." : "Add"}
            </button>
          </div>
        </Modal>
      )}

      {/* SQO modal */}
      {showSqoModal && (
        <Modal title="Add SQO" onClose={() => setShowSqoModal(false)}>
          <div className="flex flex-col gap-3">
            <input
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground"
              placeholder="Company"
              value={sqoCompany}
              onChange={(e) => setSqoCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSqo()}
              autoFocus
            />
            <button
              onClick={addSqo}
              disabled={savingSqo}
              className="flex h-9 items-center justify-center rounded-full bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
            >
              {savingSqo ? "Adding..." : "Add"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
