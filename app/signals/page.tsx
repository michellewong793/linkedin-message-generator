"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface RecentPage {
    url: string;
    numVisits: number;
}

interface Signal {
    id: string;
    name: string | null;
    title: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    linkedin_url: string | null;
    spark_summary: string | null;
    recent_pages: RecentPage[];
    cr_profile_url: string | null;
    sf_account_url: string | null;
    status: string;
    synced_at: string;
}

function pageLabel(url: string): string {
    try {
        const u = new URL(url);
        const path = u.pathname.replace(/\/$/, "") || "/";
        return path === "/" ? "Homepage" : path.split("/").filter(Boolean).join(" / ");
    } catch {
        return url;
    }
}

const STATUS_OPTIONS = ["new", "contacted", "dismissed"] as const;

const STATUS_STYLES: Record<string, string> = {
    new: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    contacted: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-800",
    dismissed: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
};

export default function SignalsPage() {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<"all" | "new" | "contacted" | "dismissed">("new");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    async function loadSignals(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        const r = await fetch("/api/signals");
        const d = await r.json();
        if (d.items) setSignals(d.items);
        setLoading(false);
        setRefreshing(false);
    }

    useEffect(() => { loadSignals(); }, []);

    async function updateStatus(id: string, status: string) {
        setSignals((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
        await fetch("/api/signals", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
    }

    function toggleExpanded(id: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const lastSynced = signals.length > 0
        ? signals.reduce((latest, s) => s.synced_at > latest ? s.synced_at : latest, signals[0].synced_at)
        : null;

    function formatSynced(iso: string): string {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    const filtered = filter === "all" ? signals : signals.filter((s) => s.status === filter);
    const counts = {
        all: signals.length,
        new: signals.filter((s) => s.status === "new").length,
        contacted: signals.filter((s) => s.status === "contacted").length,
        dismissed: signals.filter((s) => s.status === "dismissed").length,
    };

    return (
        <div className="flex flex-col flex-1 bg-white dark:bg-black font-sans min-h-screen">
            <main className="flex flex-1 flex-col w-full max-w-4xl gap-6 py-16 px-12">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-medium">Signals</h1>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            ICP contacts who visited high-value Vercel pages in the last 7 days.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        {lastSynced && !loading && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                Synced {formatSynced(lastSynced)}
                            </span>
                        )}
                        <button
                            onClick={() => loadSignals(true)}
                            disabled={refreshing || loading}
                            className="flex h-8 items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                        >
                            {refreshing ? (
                                <>
                                    <span className="inline-block w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                    Refreshing
                                </>
                            ) : "↻ Refresh"}
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
                    {(["new", "contacted", "dismissed", "all"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                                filter === tab
                                    ? "border-foreground text-foreground"
                                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                        >
                            {tab}
                            <span className="ml-1.5 text-xs text-zinc-400">({counts[tab]})</span>
                        </button>
                    ))}
                </div>

                {loading && (
                    <p className="text-sm text-zinc-400">Loading signals...</p>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <p className="text-sm text-zinc-400">No signals here yet.</p>
                        {filter !== "all" && (
                            <button
                                onClick={() => setFilter("all")}
                                className="mt-2 text-xs text-zinc-500 underline underline-offset-2"
                            >
                                View all
                            </button>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {filtered.map((signal) => {
                        const isExpanded = expanded.has(signal.id);
                        const topPages = (signal.recent_pages || []).slice(0, 3);
                        const messageUrl = `/?name=${encodeURIComponent(signal.name || "")}&company=${encodeURIComponent(signal.company || "")}&title=${encodeURIComponent(signal.title || "")}&reason=${encodeURIComponent("AI investment signals")}`;

                        return (
                            <div
                                key={signal.id}
                                className={`rounded-xl border bg-zinc-50 dark:bg-zinc-900/60 p-5 flex flex-col gap-3 transition-colors ${
                                    signal.status === "dismissed" ? "opacity-50" : ""
                                } ${STATUS_STYLES[signal.status] || "border-zinc-200 dark:border-zinc-800"}`}
                            >
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-base font-semibold">{signal.name}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLES[signal.status] || ""}`}>
                                                {signal.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            {[signal.title, signal.company].filter(Boolean).join(" · ")}
                                        </p>
                                        <div className="flex gap-3 mt-1 flex-wrap">
                                            {signal.email && (
                                                <a href={`mailto:${signal.email}`} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                                    {signal.email}
                                                </a>
                                            )}
                                            {signal.phone && (
                                                <span className="text-xs text-zinc-400">{signal.phone}</span>
                                            )}
                                            {signal.linkedin_url && (
                                                <a
                                                    href={`https://linkedin.com/${signal.linkedin_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400"
                                                >
                                                    LinkedIn ↗
                                                </a>
                                            )}
                                            {signal.cr_profile_url && (
                                                <a
                                                    href={signal.cr_profile_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-zinc-400 hover:text-zinc-600"
                                                >
                                                    Common Room ↗
                                                </a>
                                            )}
                                            {signal.sf_account_url && (
                                                <a
                                                    href={signal.sf_account_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                                                >
                                                    Salesforce ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status selector */}
                                    <select
                                        value={signal.status}
                                        onChange={(e) => updateStatus(signal.id, e.target.value)}
                                        className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 outline-none shrink-0"
                                    >
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Page visits */}
                                {topPages.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                            Recent visits
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {topPages.map((page, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-0.5 text-zinc-600 dark:text-zinc-300"
                                                >
                                                    {pageLabel(page.url)}
                                                    {page.numVisits > 1 && (
                                                        <span className="ml-1 text-zinc-400">×{page.numVisits}</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Spark summary (collapsible) */}
                                {signal.spark_summary && (
                                    <div>
                                        <button
                                            onClick={() => toggleExpanded(signal.id)}
                                            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1"
                                        >
                                            <span>{isExpanded ? "▾" : "▸"}</span>
                                            <span>Context</span>
                                        </button>
                                        {isExpanded && (
                                            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {signal.spark_summary}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-1 flex-wrap">
                                    <Link
                                        href={messageUrl}
                                        className="flex h-8 items-center gap-1.5 rounded-full ginkgo-btn px-4 text-xs font-medium"
                                    >
                                        Generate LinkedIn Message
                                    </Link>
                                    <button
                                        onClick={() => updateStatus(signal.id, "contacted")}
                                        disabled={signal.status === "contacted"}
                                        className="flex h-8 items-center rounded-full px-4 text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                                    >
                                        Mark contacted
                                    </button>
                                    <button
                                        onClick={() => updateStatus(signal.id, "dismissed")}
                                        disabled={signal.status === "dismissed"}
                                        className="flex h-8 items-center rounded-full px-4 text-xs font-medium text-zinc-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
