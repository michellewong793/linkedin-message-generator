"use client";
import { useMemo, useRef, useState } from "react";

// Titles that make a Hot Hobby contact worth reaching out to.
const TITLE_KEYWORDS = [
  "Head of",
  "Director of",
  "Vice President",
  "Platform",
  "Infrastructure",
  "VP of",  "Head of", "CTO", "Staff", "Founding", "Co", "Principal", "Software" 
];
// "AI" is matched as a whole word so we don't catch "maintenance", "retail", etc.
const AI_WORD = /\bAI\b/i;

const REASON = "Hot Hobby signup with a senior title — likely evaluating for a team.";

type Channel = "linkedin" | "email";
type Group = "great" | "enrich";

interface Enrichment {
  enrichedTitle: string | null;
  seniorityTier: string;
  worthReaching: boolean;
  confidence: string;
  reasoning: string;
  linkedinUrl: string | null;
  query: string;
  sources: { title: string; url: string }[];
}

interface Contact {
  id: number;
  group: Group;
  firstName: string;
  email: string;
  title: string;
  company: string;
  website: string;
  employees: string;
  country: string;
  territory: string;
  status: string;
  // outreach state
  channel: Channel;
  loading: boolean;
  message: string | null;
  error: string | null;
  copied: boolean;
  saved: boolean;
  // enrichment state
  enriching: boolean;
  enrichment: Enrichment | null;
  enrichError: string | null;
  showSources: boolean;
}

// Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes ("")
// and commas / newlines inside quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

function matchesTitle(title: string): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  if (TITLE_KEYWORDS.some((k) => lower.includes(k.toLowerCase()))) return true;
  return AI_WORD.test(title);
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._+-]/)[0] ?? "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "there";
}

const TIER_LABEL: Record<string, string> = {
  executive: "Executive",
  leader: "Leader",
  senior: "Senior IC",
  mid: "Individual contributor",
  junior: "Junior",
  intern: "Intern / student",
  unknown: "Unknown",
};

export default function HotHobbiesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  const great = useMemo(() => contacts.filter((c) => c.group === "great"), [contacts]);
  const enrich = useMemo(() => contacts.filter((c) => c.group === "enrich"), [contacts]);
  const generatedCount = useMemo(() => contacts.filter((c) => c.message).length, [contacts]);

  function handleFile(file: File) {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result));
        if (rows.length < 2) {
          setParseError("That CSV didn't have any data rows.");
          return;
        }
        const header = rows[0].map((h) => h.trim());
        const idx = (name: string) =>
          header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
        const iFirst = idx("First Name");
        const iEmail = idx("Email");
        const iTitle = idx("Title");
        const iAccount = idx("Account Name");
        const iStatus = idx("Account Status");
        const iWebsite = idx("Website");
        const iCountry = idx("Billing Country");
        const iEmployees = idx("Clearbit Employees");
        const iTerritory = idx("Territory");

        if (iTitle === -1 || iEmail === -1) {
          setParseError(
            "Couldn't find the expected columns (need at least Title and Email)."
          );
          return;
        }

        const dataRows = rows.slice(1);
        const parsed: Contact[] = [];
        for (const r of dataRows) {
          const title = (r[iTitle] ?? "").trim();
          const matched = matchesTitle(title);
          const missing = title === "";
          // Keep keyword matches (great) and blank titles (enrich); skip the rest.
          if (!matched && !missing) continue;
          const email = (r[iEmail] ?? "").trim();
          const first = (iFirst !== -1 ? r[iFirst] : "")?.trim() || "";
          parsed.push({
            id: idRef.current++,
            group: matched ? "great" : "enrich",
            firstName: first || (email ? nameFromEmail(email) : "there"),
            email,
            title,
            company: (iAccount !== -1 ? r[iAccount] : "")?.trim() || "",
            website: (iWebsite !== -1 ? r[iWebsite] : "")?.trim() || "",
            employees: (iEmployees !== -1 ? r[iEmployees] : "")?.trim() || "",
            country: (iCountry !== -1 ? r[iCountry] : "")?.trim() || "",
            territory: (iTerritory !== -1 ? r[iTerritory] : "")?.trim() || "",
            status: (iStatus !== -1 ? r[iStatus] : "")?.trim() || "",
            channel: "linkedin",
            loading: false,
            message: null,
            error: null,
            copied: false,
            saved: false,
            enriching: false,
            enrichment: null,
            enrichError: null,
            showSources: false,
          });
        }

        setTotalRows(dataRows.length);
        setContacts(parsed);
      } catch (err) {
        setParseError(String(err));
      }
    };
    reader.onerror = () => setParseError("Failed to read the file.");
    reader.readAsText(file);
  }

  function update(id: number, patch: Partial<Contact>) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function effectiveTitle(c: Contact): string {
    return c.enrichment?.enrichedTitle || c.title || "their role";
  }

  async function enrichOne(c: Contact) {
    update(c.id, { enriching: true, enrichError: null });
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.firstName,
          email: c.email,
          company: c.company,
          website: c.website,
        }),
      });
      const data = await res.json();
      if (data.error) update(c.id, { enrichError: data.error, enriching: false });
      else update(c.id, { enrichment: data as Enrichment, enriching: false });
    } catch (err) {
      update(c.id, { enrichError: String(err), enriching: false });
    }
  }

  async function enrichAll() {
    setEnrichingAll(true);
    // Sequential to stay gentle on the search endpoint.
    for (const c of contacts.filter((x) => x.group === "enrich" && !x.enrichment)) {
      await enrichOne(c);
    }
    setEnrichingAll(false);
  }

  async function generate(c: Contact) {
    update(c.id, { loading: true, error: null, copied: false });
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.firstName,
          company: c.company,
          title: effectiveTitle(c),
          website: c.website,
          reason: REASON,
          channel: c.channel,
        }),
      });
      const data = await res.json();
      if (data.error) update(c.id, { error: data.error, loading: false });
      else update(c.id, { message: data.text, loading: false, saved: false });
    } catch (err) {
      update(c.id, { error: String(err), loading: false });
    }
  }

  async function copy(c: Contact) {
    if (!c.message) return;
    await navigator.clipboard.writeText(c.message);
    update(c.id, { copied: true });
    setTimeout(() => update(c.id, { copied: false }), 1500);
  }

  async function saveOne(c: Contact) {
    if (!c.message) return;
    await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: c.channel === "email" ? "email" : "linkedin_message",
        company: c.company,
        contact_name: c.firstName,
        contact_title: effectiveTitle(c),
        notes: { message: c.message, reason: REASON, email: c.email, channel: c.channel },
      }),
    });
    update(c.id, { saved: true });
  }

  async function saveAll() {
    const ready = contacts.filter((c) => c.message && !c.saved);
    if (ready.length === 0) return;
    setSavingAll(true);
    await Promise.all(ready.map((c) => saveOne(c)));
    setSavingAll(false);
  }

  function outreachControls(c: Contact) {
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-zinc-300 dark:border-zinc-700 p-0.5 text-xs">
            {(["linkedin", "email"] as Channel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => update(c.id, { channel: ch })}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  c.channel === ch
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {ch === "linkedin" ? "LinkedIn" : "Email"}
              </button>
            ))}
          </div>
        </div>

        {c.message && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap rounded-md bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 p-3">
            {c.message}
          </p>
        )}
        {c.error && <p className="text-xs text-red-600 dark:text-red-400">{c.error}</p>}

        <div className="flex items-center gap-2">
          <button
            onClick={() => generate(c)}
            disabled={c.loading}
            className="flex h-9 items-center justify-center gap-2 rounded-full ginkgo-btn px-4 text-sm font-medium"
          >
            {c.loading ? (
              <>
                <span className="bar-pop flex items-end gap-[3px]">
                  <span /><span /><span /><span />
                </span>
                Generating
              </>
            ) : c.message ? (
              "Regenerate"
            ) : (
              `Generate ${c.channel === "email" ? "Email" : "Message"}`
            )}
          </button>
          {c.message && (
            <>
              <button
                onClick={() => copy(c)}
                className="h-9 rounded-full border border-zinc-300 dark:border-zinc-700 px-4 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {c.copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => saveOne(c)}
                disabled={c.saved}
                className="h-9 rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-60
                  bg-green-200 text-green-800 hover:bg-green-100/70
                  dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/20"
              >
                {c.saved ? "✓ Saved" : "Save"}
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  function meta(c: Contact) {
    return [
      c.employees ? `${c.employees} employees` : "",
      c.status,
      c.territory,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  function greatCard(c: Contact) {
    return (
      <div
        key={c.id}
        className="ginkgo-card rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col gap-3"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {c.firstName} · {c.company || "—"}
          </p>
          <p className="text-xs text-zinc-500 truncate">{c.title}</p>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">
            {c.email}
            {meta(c) ? ` · ${meta(c)}` : ""}
          </p>
        </div>
        {outreachControls(c)}
      </div>
    );
  }

  function enrichCard(c: Contact) {
    const e = c.enrichment;
    return (
      <div
        key={c.id}
        className="ginkgo-card rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col gap-3"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {c.firstName} · {c.company || "—"}
          </p>
          <p className="text-xs text-zinc-400 italic truncate">Title missing in Salesforce</p>
          <p className="text-xs text-zinc-400 mt-0.5 truncate">
            {c.email}
            {meta(c) ? ` · ${meta(c)}` : ""}
          </p>
        </div>

        {!e && !c.enriching && !c.enrichError && (
          <button
            onClick={() => enrichOne(c)}
            className="self-start h-9 rounded-full border border-zinc-300 dark:border-zinc-700 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            🔍 Look up real title
          </button>
        )}

        {c.enriching && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="bar-pop flex items-end gap-[3px]">
              <span /><span /><span /><span />
            </span>
            Researching the web &amp; LinkedIn…
          </div>
        )}

        {c.enrichError && (
          <div className="flex items-center gap-3">
            <p className="text-xs text-red-600 dark:text-red-400">{c.enrichError}</p>
            <button
              onClick={() => enrichOne(c)}
              className="text-xs underline text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Retry
            </button>
          </div>
        )}

        {e && (
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black/40 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-medium">
                ✓ Thoroughly researched
              </span>
              <span className="text-[11px] text-zinc-400">
                {e.sources.length} source{e.sources.length === 1 ? "" : "s"} checked · {e.confidence} confidence
              </span>
            </div>

            <p className="text-sm">
              <span className="text-zinc-400">Found title: </span>
              <span className="font-medium">
                {e.enrichedTitle || "No public title found"}
              </span>
              <span className="text-zinc-400"> · {TIER_LABEL[e.seniorityTier] ?? e.seniorityTier}</span>
            </p>

            <div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  e.worthReaching
                    ? "bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {e.worthReaching ? "Worth reaching out" : "Skip — not a fit"}
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{e.reasoning}</p>

            <button
              onClick={() => update(c.id, { showSources: !c.showSources })}
              className="self-start text-[11px] underline text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {c.showSources ? "Hide sources" : `Show sources checked (${e.sources.length})`}
            </button>
            {c.showSources && (
              <div className="flex flex-col gap-1 border-t border-zinc-200 dark:border-zinc-800 pt-2">
                <p className="text-[11px] text-zinc-400">Search: “{e.query}”</p>
                {e.linkedinUrl && (
                  <a
                    href={e.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline truncate"
                  >
                    ↗ Best-match LinkedIn profile
                  </a>
                )}
                {e.sources.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:underline truncate"
                    title={s.url}
                  >
                    [{i + 1}] {s.title || s.url}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {e && e.worthReaching && outreachControls(c)}
      </div>
    );
  }

  const pendingEnrich = enrich.filter((c) => !c.enrichment).length;

  return (
    <div className="flex flex-col flex-1 h-full font-sans bg-white dark:bg-black overflow-y-auto">
      <div className="px-12 py-10 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-medium">Hot Hobbies with Great Titles</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Upload a Salesforce Hot Hobby export. We surface contacts whose title
          contains{" "}
          {["Head of", "Director of", "Vice President", "Platform", "Infrastructure", "AI"].map(
            (k, i, arr) => (
              <span key={k}>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">“{k}”</span>
                {i < arr.length - 1 ? ", " : ""}
              </span>
            )
          )}
          . Contacts with a <span className="font-medium text-zinc-700 dark:text-zinc-300">missing title</span> go to
          Contact Title Enrichment, where we research their real role before you spend time on them.
        </p>

        <div className="mt-5 flex items-center gap-4 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFileName(f.name);
                handleFile(f);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 items-center justify-center rounded-full ginkgo-btn px-5 text-sm font-medium"
          >
            {fileName ? "Upload a different CSV" : "Upload Salesforce CSV"}
          </button>
          {fileName && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {fileName} · {great.length} great {great.length === 1 ? "title" : "titles"} · {enrich.length} to enrich · {totalRows} rows
            </span>
          )}
          {generatedCount > 0 && (
            <button
              onClick={saveAll}
              disabled={savingAll}
              className="ml-auto flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-50
                bg-green-200 text-green-800 hover:bg-green-100/70
                dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/20 whitespace-nowrap"
            >
              {savingAll ? "Saving..." : `Add generated (${generatedCount}) to Daily Task List`}
            </button>
          )}
        </div>

        {parseError && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
            {parseError}
          </div>
        )}
      </div>

      <div className="px-12 py-8 flex flex-col gap-10">
        {contacts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <p className="text-sm text-zinc-400">
              {fileName
                ? "No contacts matched those titles."
                : "Upload a CSV to surface your best Hot Hobby contacts."}
            </p>
          </div>
        ) : (
          <>
            {great.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                  Great titles <span className="text-zinc-400 font-normal">({great.length})</span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {great.map(greatCard)}
                </div>
              </section>
            )}

            {enrich.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Contact Title Enrichment{" "}
                    <span className="text-zinc-400 font-normal">({enrich.length})</span>
                  </h2>
                  {pendingEnrich > 0 && (
                    <button
                      onClick={enrichAll}
                      disabled={enrichingAll}
                      className="h-9 rounded-full border border-zinc-300 dark:border-zinc-700 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {enrichingAll ? "Researching…" : `Enrich all (${pendingEnrich})`}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {enrich.map(enrichCard)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
