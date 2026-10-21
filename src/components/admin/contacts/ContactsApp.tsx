"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, CheckCheck, Download, Loader2, Megaphone, MessageCircle, MousePointerClick, Plus, Search, Tag, Users, X } from "lucide-react";
import { KINDS, KIND_LABELS, SUGGESTED_ATTRS, attrLabel, normTag, tagSegment, type ContactRow } from "@/lib/admin/contacts-core";

type Facets = { total: number; kinds: Record<string, number>; tags: { tag: string; n: number }[] };
type Page = { rows: ContactRow[]; total: number; facets: Facets | null };
type Detail = {
  contact: ContactRow;
  attributes: { name: string; value: string }[];
  messages: { at: string; channel: string; kind: string; status: string; delivery: string | null; read: boolean; clicks: number; error: string | null }[];
};
type Filter = { q: string; kind: string; tag: string };

const card = "rounded-2xl bg-white/[.04] ring-1 ring-white/10";
const input = "rounded-lg bg-white/[.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 placeholder:text-white/35 focus:outline-none focus:ring-brand/60";

async function call<T>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined);
  if (r.status === 401) {
    location.href = "/admin/login";
    throw new Error("Signed out");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j as T;
}

const qs = (f: Filter, extra: Record<string, string> = {}) => new URLSearchParams(Object.fromEntries(Object.entries({ ...f, ...extra }).filter(([, v]) => v))).toString();
const ago = (iso: string | null) => {
  if (!iso) return "–";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 60 ? `${d} days ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const phoneText = (p: string) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;

const KIND_TONE: Record<string, string> = {
  member: "bg-emerald-500/15 text-emerald-200",
  "ex-member": "bg-amber-400/15 text-amber-200",
  lead: "bg-sky-500/15 text-sky-200",
  customer: "bg-fuchsia-500/15 text-fuchsia-200",
  imported: "bg-white/10 text-white/70",
  chat: "bg-green-500/15 text-green-200",
  subscriber: "bg-indigo-500/15 text-indigo-200",
};

function Chips({ c }: { c: ContactRow }) {
  return (
    <span className="flex flex-wrap gap-1">
      {c.kinds.map((k) => (
        <span key={k} className={`rounded-full px-2 py-0.5 text-[11px] ${KIND_TONE[k]}`}>
          {KIND_LABELS[k]}
        </span>
      ))}
      {c.tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] text-white">
          <Tag className="h-2.5 w-2.5" /> {t}
        </span>
      ))}
    </span>
  );
}

/** What happened to a message, in WhatsApp's own ticks: ✓ sent, ✓✓ delivered, blue ✓✓ read. */
function Ticks({ m }: { m: Detail["messages"][number] }) {
  if (m.status === "pending") return <span className="text-white/45">waiting</span>;
  if (m.status !== "sent" || m.delivery === "failed" || m.delivery === "bounced") return <span className="text-red-300">failed{m.error ? `: ${m.error.slice(0, 60)}` : ""}</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {m.read ? <CheckCheck className="h-4 w-4 text-sky-400" aria-label="read" /> : m.delivery === "delivered" ? <CheckCheck className="h-4 w-4 text-white/60" aria-label="delivered" /> : <Check className="h-4 w-4 text-white/60" aria-label="sent" />}
      {m.clicks > 0 && <MousePointerClick className="h-3.5 w-3.5 text-emerald-300" aria-label="clicked" />}
    </span>
  );
}

function Panel({ k, onClose, onChange }: { k: string; onClose: () => void; onChange: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState("");
  const [tag, setTag] = useState("");
  const [attr, setAttr] = useState({ name: "", value: "" });
  const load = useCallback(() => {
    call<Detail>(`/api/admin/contacts?key=${encodeURIComponent(k)}`)
      .then((x) => (setD(x), setErr("")))
      .catch((e) => setErr(e.message));
  }, [k]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);
  async function run(body: unknown) {
    try {
      await call("/api/admin/contacts", body);
      load();
      onChange();
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  const c = d?.contact;
  const missing = SUGGESTED_ATTRS.filter((a) => !d?.attributes.some((x) => x.name === a));
  return (
    <aside className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-[#0d0d12] p-5 ring-1 ring-white/10" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Contact">
        <div className="flex items-start gap-2">
          <h2 className="flex-1 font-display text-xl">{c?.name || (c?.phone ? phoneText(c.phone) : c?.email) || "Contact"}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-white/60 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        {err && <p className="mt-2 rounded-lg bg-red-500/10 p-2 text-sm text-red-100">{err}</p>}
        {!d && !err && <Loader2 className="mt-6 h-6 w-6 animate-spin text-white/50" />}
        {c && d && (
          <div className="mt-3 space-y-5 text-sm">
            <div className="space-y-1 text-white/80">
              {c.phone && (
                <p>
                  📱 {phoneText(c.phone)} {c.waBlocked && <span className="ml-1 rounded bg-red-500/20 px-1.5 text-xs text-red-200">no WhatsApp promotions</span>}
                </p>
              )}
              {c.email && (
                <p className="break-all">
                  ✉️ {c.email} {c.emailUnsubscribed && <span className="ml-1 rounded bg-red-500/20 px-1.5 text-xs text-red-200">unsubscribed</span>}
                </p>
              )}
              {c.memberUntil && <p>🏋️ Membership {c.kinds.includes("member") ? "until" : "ended"} {new Date(`${c.memberUntil}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</p>}
              <p className="text-white/50">Last activity: {ago(c.lastAt)}</p>
            </div>
            <Chips c={c} />
            {c.phone && (
              <div className="flex flex-wrap gap-2">
                <a href={`/admin/chats?peer=91${c.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-emerald-100 ring-1 ring-emerald-400/40">
                  <MessageCircle className="h-4 w-4" /> Open chat
                </a>
                <a href={`tel:+91${c.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/15">
                  Call
                </a>
              </div>
            )}

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Tags & lists</h3>
              <div className="flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <button key={t} onClick={() => run({ action: "untag", tag: t, keys: [c.key] })} className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-2.5 py-1 text-xs hover:bg-red-500/30" title="Remove tag">
                    {t} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (normTag(tag)) run({ action: "tag", tag, keys: [c.key] }).then(() => setTag(""));
                }}
              >
                <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add a tag, e.g. vip, morning batch" className={`${input} min-w-0 flex-1`} aria-label="New tag" />
                <button className="rounded-lg bg-white/10 px-3 text-sm" disabled={!normTag(tag)}>
                  Add
                </button>
              </form>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Attributes</h3>
              <dl className="space-y-1.5">
                {d.attributes.map((a) => (
                  <div key={a.name} className="flex items-center gap-2">
                    <dt className="w-28 shrink-0 text-white/50">{attrLabel(a.name)}</dt>
                    <dd className="min-w-0 flex-1 break-words">{a.value}</dd>
                    <button onClick={() => run({ action: "attr", key: c.key, name: a.name, value: "" })} aria-label={`Remove ${attrLabel(a.name)}`} className="rounded p-1 text-white/40 hover:text-red-300">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </dl>
              <form
                className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (attr.name.trim() && attr.value.trim()) run({ action: "attr", key: c.key, ...attr }).then(() => setAttr({ name: "", value: "" }));
                }}
              >
                <input list="attr-names" value={attr.name} onChange={(e) => setAttr({ ...attr, name: e.target.value })} placeholder="Name (goal…)" className={`${input} min-w-0`} aria-label="Attribute name" />
                <input value={attr.value} onChange={(e) => setAttr({ ...attr, value: e.target.value })} placeholder="Value" className={`${input} min-w-0`} aria-label="Attribute value" />
                <button className="rounded-lg bg-white/10 px-3 text-sm" aria-label="Save attribute">
                  <Plus className="h-4 w-4" />
                </button>
                <datalist id="attr-names">
                  {missing.map((a) => (
                    <option key={a} value={a} label={attrLabel(a)} />
                  ))}
                </datalist>
              </form>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">Automatic messages</h3>
              {d.messages.length ? (
                <ul className="space-y-1.5">
                  {d.messages.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-lg bg-white/[.03] px-2.5 py-1.5">
                      <span className="w-16 shrink-0 text-xs text-white/45">{ago(m.at)}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {m.channel === "whatsapp" ? "📱" : "✉️"} {m.kind.replace(/-/g, " ")}
                      </span>
                      <Ticks m={m} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/50">None sent yet.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}

export function ContactsApp() {
  const [f, setF] = useState<Filter>({ q: "", kind: "", tag: "" });
  const [typed, setTyped] = useState("");
  const [page, setPage] = useState<Page | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [bulkTag, setBulkTag] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async (filter: Filter, offset = 0) => {
    setBusy(true);
    try {
      const p = await call<Page>(`/api/admin/contacts?${qs(filter, offset ? { offset: String(offset) } : {})}`);
      setPage(p);
      setRows((prev) => (offset ? [...prev, ...p.rows] : p.rows));
      if (p.facets) setFacets(p.facets);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(f), 0);
    return () => clearTimeout(t);
  }, [f, load]);

  // Search as you type, a moment after the last key.
  useEffect(() => {
    const t = setTimeout(() => setF((x) => (x.q === typed ? x : { ...x, q: typed })), 300);
    return () => clearTimeout(t);
  }, [typed]);

  const choose = (patch: Partial<Filter>) => {
    setSel(new Set());
    setAllMatching(false);
    setF((x) => ({ ...x, ...patch }));
  };

  async function bulk(action: "tag" | "untag") {
    const tag = normTag(bulkTag);
    if (!tag) return setNote("Type a tag first.");
    try {
      const r = await call<{ changed: number; selected: number }>("/api/admin/contacts", { action, tag, ...(allMatching ? { all: f } : { keys: [...sel] }) });
      setNote(action === "tag" ? `Tagged ${r.changed} of ${r.selected} people “${tag}”.` : `Removed “${tag}” from ${r.changed} people.`);
      setSel(new Set());
      setAllMatching(false);
      load(f);
    } catch (e) {
      setNote((e as Error).message);
    }
  }

  const total = page?.total ?? 0;
  const selectedN = allMatching ? total : sel.size;
  const allOnPage = rows.length > 0 && rows.every((r) => sel.has(r.key));

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
          <a href="/admin" aria-label="Back to Command Center" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <Users className="h-5 w-5 text-sky-300" />
          <span className="font-display text-lg">Contacts</span>
          {facets && <span className="text-sm text-white/45">{facets.total.toLocaleString("en-IN")} people</span>}
          <a href={`/api/admin/contacts?${qs(f, { export: "1" })}`} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export CSV</span>
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[230px_1fr]">
        <nav className="space-y-5 lg:sticky lg:top-20 lg:self-start" aria-label="Filters">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/45">Type</p>
            <div className="flex gap-1 overflow-x-auto lg:flex-col">
              {[["", "Everyone", facets?.total ?? 0] as const, ...KINDS.map((k) => [k, KIND_LABELS[k], facets?.kinds[k] ?? 0] as const)].map(([id, label, n]) => (
                <button key={id || "all"} onClick={() => choose({ kind: id })} className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${f.kind === id ? "bg-white/15 font-semibold" : "text-white/70 hover:bg-white/5"}`}>
                  {label} <span className="text-xs text-white/45">{n}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/45">Lists (tags)</p>
            {facets?.tags.length ? (
              <ul className="flex gap-1 overflow-x-auto lg:flex-col">
                {facets.tags.map((t) => (
                  <li key={t.tag} className="flex shrink-0 items-center gap-1">
                    <button onClick={() => choose({ tag: f.tag === t.tag ? "" : t.tag })} className={`flex flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${f.tag === t.tag ? "bg-brand/25 font-semibold" : "text-white/70 hover:bg-white/5"}`}>
                      <span className="truncate">{t.tag}</span> <span className="text-xs text-white/45">{t.n}</span>
                    </button>
                    <a href={`/admin/audience?segment=${encodeURIComponent(tagSegment(t.tag))}#composer`} title={`Send a campaign to “${t.tag}”`} aria-label={`Send a campaign to ${t.tag}`} className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white">
                      <Megaphone className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/45">Tick people and add a tag to make a list. Lists can be sent a campaign.</p>
            )}
          </div>
        </nav>

        <main className="min-w-0 space-y-4">
          <label className={`flex items-center gap-2 px-3 py-2.5 ${card}`}>
            <Search className="h-4 w-4 shrink-0 text-white/45" />
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Search name, mobile or email" aria-label="Search contacts" className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none" />
            {busy && <Loader2 className="h-4 w-4 animate-spin text-white/45" />}
          </label>

          {selectedN > 0 && (
            <div className={`flex flex-wrap items-center gap-2 p-3 ${card} ring-brand/40`}>
              <span className="text-sm font-semibold">{selectedN.toLocaleString("en-IN")} selected</span>
              {!allMatching && allOnPage && total > rows.length && (
                <button onClick={() => setAllMatching(true)} className="text-sm text-sky-300 underline">
                  Select all {total.toLocaleString("en-IN")} matching
                </button>
              )}
              <input value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} placeholder="tag" aria-label="Tag for selected" className={`${input} w-36`} />
              <button onClick={() => bulk("tag")} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold">
                Add tag
              </button>
              <button onClick={() => bulk("untag")} className="rounded-lg bg-white/10 px-3 py-2 text-sm">
                Remove tag
              </button>
              <button onClick={() => (setSel(new Set()), setAllMatching(false))} className="ml-auto text-sm text-white/50">
                Clear
              </button>
            </div>
          )}
          {note && <p className="rounded-lg bg-white/[.05] px-3 py-2 text-sm text-white/80">{note}</p>}
          {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}

          <div className={`overflow-x-auto ${card}`}>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs text-white/45">
                <tr>
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      aria-label="Select all on this page"
                      onChange={() => {
                        setAllMatching(false);
                        setSel(allOnPage ? new Set() : new Set(rows.map((r) => r.key)));
                      }}
                    />
                  </th>
                  <th className="px-2 py-2.5 font-normal">Name</th>
                  <th className="px-2 py-2.5 font-normal">Mobile / email</th>
                  <th className="px-2 py-2.5 font-normal">Type & tags</th>
                  <th className="px-3 py-2.5 text-right font-normal">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.key} className="cursor-pointer border-t border-white/5 hover:bg-white/[.03]" onClick={() => setOpen(c.key)}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={allMatching || sel.has(c.key)}
                        aria-label={`Select ${c.name || c.key}`}
                        onChange={() => {
                          setAllMatching(false);
                          setSel((s) => {
                            const n = new Set(s);
                            if (n.has(c.key)) n.delete(c.key);
                            else n.add(c.key);
                            return n;
                          });
                        }}
                      />
                    </td>
                    <td className="max-w-[180px] truncate px-2 py-2.5 font-medium">{c.name || <span className="text-white/40">No name</span>}</td>
                    <td className="px-2 py-2.5 text-white/75">
                      {c.phone && <span className={`whitespace-nowrap ${c.waBlocked ? "text-white/40 line-through" : ""}`}>{phoneText(c.phone)}</span>}
                      {c.email && <span className={`block max-w-[220px] truncate text-xs ${c.emailUnsubscribed ? "text-white/35 line-through" : "text-white/50"}`}>{c.email}</span>}
                    </td>
                    <td className="px-2 py-2.5">
                      <Chips c={c} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-white/50">{ago(c.lastAt)}</td>
                  </tr>
                ))}
                {page && !rows.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-white/50">
                      Nobody matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length < total && (
            <button onClick={() => load(f, rows.length)} disabled={busy} className="w-full rounded-xl bg-white/[.05] py-2.5 text-sm text-white/80 ring-1 ring-white/10 disabled:opacity-50">
              Show more ({(total - rows.length).toLocaleString("en-IN")} left)
            </button>
          )}
          <p className="text-xs text-white/40">Crossed-out numbers and emails have opted out or can&apos;t receive messages; campaigns skip them automatically.</p>
        </main>
      </div>
      {open && <Panel k={open} onClose={() => setOpen(null)} onChange={() => load(f)} />}
    </div>
  );
}
