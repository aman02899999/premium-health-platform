"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clapperboard, X } from "lucide-react";
import type { QueueItem } from "@/lib/youtube/queue";
import type { AnswerDraft } from "@/lib/youtube/queue-core";

const EMPTY: AnswerDraft = { hook: "", question: "", answer: "", why: "", tips: ["", ""], ask: "", topic: "", tags: [], medical: false };
const KIND: Record<string, string> = { answer: "Viewer question", trend: "Trend fact-check" };

function Field({ label, value, onChange, rows = 1, max }: { label: string; value: string; onChange: (v: string) => void; rows?: number; max: number }) {
  return (
    <label className="block text-xs text-white/60">
      {label} <span className="text-white/35">({value.length}/{max})</span>
      {rows > 1 ? (
        <textarea value={value} rows={rows} maxLength={max} onChange={(e) => onChange(e.target.value)} className="field mt-1 text-sm" />
      ) : (
        <input value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className="field mt-1 text-sm" />
      )}
    </label>
  );
}

function Item({ item, onDone }: { item: QueueItem; onDone: () => void }) {
  const [d, setD] = useState<AnswerDraft>(item.draft ?? { ...EMPTY, question: item.sourceText.slice(0, 160) });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const set = <K extends keyof AnswerDraft>(k: K, v: AnswerDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const send = async (action: "save" | "approve" | "reject") => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/youtube/queue", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, action, draft: d }) });
      const j = (await res.json().catch(() => ({}))) as { errors?: string[]; error?: string };
      if (!res.ok) setMsg(j.errors?.join(" · ") ?? j.error ?? "Couldn't save");
      else {
        setMsg(action === "approve" ? "Approved: it goes out in the next midday Short slot." : action === "reject" ? "Rejected." : "Saved.");
        onDone();
      }
    } finally {
      setBusy(false);
    }
  };
  const open = item.status === "draft";
  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold text-white/80">{KIND[item.kind] ?? item.kind}</span>
        <span className="text-white/50">{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        <span className={item.status === "approved" ? "text-emerald-300" : item.status === "rejected" ? "text-rose-300" : "text-amber-200"}>{item.status === "draft" ? "Waiting for you" : item.status}</span>
        {item.posted?.url && (
          <a href={item.posted.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-300 hover:underline">
            Posted ↗
          </a>
        )}
        {item.posted && !item.posted.url && <span className="text-white/50">YouTube: {item.posted.status}</span>}
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/80">“{item.sourceText}”</p>
      {item.note && <p className="mt-1 text-xs text-amber-200">{item.note}</p>}
      {open && (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <Field label="Hook (first words on screen)" value={d.hook} onChange={(v) => set("hook", v)} max={70} />
          <Field label="Topic" value={d.topic} onChange={(v) => set("topic", v)} max={40} />
          <Field label="Question (no names)" value={d.question} onChange={(v) => set("question", v)} rows={2} max={160} />
          <Field label="Straight answer" value={d.answer} onChange={(v) => set("answer", v)} rows={2} max={160} />
          <Field label="Why" value={d.why} onChange={(v) => set("why", v)} rows={2} max={180} />
          <Field label="Question for the comments" value={d.ask} onChange={(v) => set("ask", v)} rows={2} max={110} />
          <Field label="Coach tip 1" value={d.tips[0]} onChange={(v) => set("tips", [v, d.tips[1]])} rows={2} max={120} />
          <Field label="Coach tip 2" value={d.tips[1]} onChange={(v) => set("tips", [d.tips[0], v])} rows={2} max={120} />
          <Field label="Tags (comma separated)" value={d.tags.join(", ")} onChange={(v) => set("tags", v.split(",").map((t) => t.trim()).filter(Boolean))} max={160} />
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input type="checkbox" checked={d.medical} onChange={(e) => set("medical", e.target.checked)} /> Health condition (adds &quot;ask your doctor&quot;)
          </label>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {item.draft && (
          <a href={`/api/admin/youtube/queue-preview/${item.id}.mp4`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:text-white">
            <Clapperboard className="h-3.5 w-3.5" /> Preview (saved version, ~40 s)
          </a>
        )}
        {open && (
          <>
            <button type="button" disabled={busy} onClick={() => send("save")} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:text-white disabled:opacity-50">
              Save changes
            </button>
            <button type="button" disabled={busy} onClick={() => send("approve")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button type="button" disabled={busy} onClick={() => send("reject")} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/20 disabled:opacity-50">
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </>
        )}
      </div>
      {msg && <p className="mt-2 text-xs text-white/70">{msg}</p>}
    </article>
  );
}

async function fetchQueue(): Promise<{ items?: QueueItem[]; error?: string }> {
  const res = await fetch("/api/admin/youtube/queue", { cache: "no-store" }).catch(() => null);
  const j = (await res?.json().catch(() => null)) as { items?: QueueItem[]; error?: string } | null;
  return res?.ok && j?.items ? { items: j.items } : { error: j?.error ?? "Couldn't load the queue" };
}

/** Shorts written outside the bank: nothing posts until the owner approves it. */
export function ShortQueue() {
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [error, setError] = useState("");
  const apply = useCallback((r: { items?: QueueItem[]; error?: string }) => {
    if (r.items) setItems(r.items);
    else setError(r.error ?? "Couldn't load the queue");
  }, []);
  const load = useCallback(() => fetchQueue().then(apply), [apply]);
  useEffect(() => {
    let live = true;
    fetchQueue().then((r) => live && apply(r));
    return () => {
      live = false;
    };
  }, [apply]);
  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <h3 className="text-sm font-bold text-white/80">Shorts waiting for your OK</h3>
      <p className="mt-1 text-xs text-white/60">
        Every Sunday the site picks the best question from your YouTube comments and writes an answer Short. Check it, fix anything, then Approve. It posts in the next 1 pm slot, and the site replies under the viewer&apos;s comment with the link. Nothing posts without your OK.
      </p>
      {error && <p className="mt-2 text-xs text-amber-200">{error}</p>}
      {items && items.length === 0 && <p className="mt-2 text-xs text-white/50">Nothing yet. The first draft comes on Sunday.</p>}
      <div className="mt-3 space-y-3">
        {items?.map((it) => (
          <Item key={it.id} item={it} onDone={() => void load()} />
        ))}
      </div>
    </div>
  );
}
