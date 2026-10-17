"use client";

import { ArrowLeft, Check, CircleAlert, Clock, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatSummary } from "@/lib/social/chat";
import { windowLabel, type WindowState } from "@/lib/social/chat-window";

const LIST_EVERY = 20_000;
const THREAD_EVERY = 8_000;


const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const day = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};
const shortWhen = (iso: string) => (day(iso) === "Today" ? time(iso) : day(iso));
const pretty = (peer: string) => (peer.length === 12 && peer.startsWith("91") ? `+91 ${peer.slice(2, 7)} ${peer.slice(7)}` : `+${peer}`);
const byLabel = (by: string) => (by === "auto-reply" ? "Auto-reply" : by === "scheduled" ? "Scheduled message" : by.split("@")[0]);

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json as T;
}

function Media({ m }: { m: NonNullable<ChatMessage["media"]> }) {
  const src = `/api/admin/chats/media/${encodeURIComponent(m.id)}`;
  if (m.type === "image" || m.type === "sticker")
    return (
      <a href={src} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element -- streamed from WhatsApp through the admin route */}
        <img src={src} alt="Photo from the customer" className="max-h-72 rounded-lg" loading="lazy" />
      </a>
    );
  if (m.type === "audio") return <audio controls src={src} className="w-60 max-w-full" preload="none" />;
  if (m.type === "video") return <video controls src={src} className="max-h-72 rounded-lg" preload="none" />;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="underline">
      📄 Open document
    </a>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  return (
    <div className={`flex ${m.fromThem ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[70%] ${m.fromThem ? "rounded-tl-sm bg-white/10 text-white" : "rounded-tr-sm bg-emerald-600/80 text-white"}`}>
        {m.media && (
          <div className="mb-1">
            <Media m={m.media} />
          </div>
        )}
        {m.body ? <p className="whitespace-pre-wrap break-words">{m.body}</p> : !m.media ? <p className="italic text-white/50">(empty message)</p> : null}
        <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] text-white/60">
          {!m.fromThem && <span>{byLabel(m.by)} ·</span>}
          <span>{time(m.at)}</span>
          {!m.fromThem && (m.ok ? <Check className="h-3 w-3" /> : <CircleAlert className="h-3 w-3 text-red-300" />)}
        </div>
        {!m.ok && m.error && <p className="mt-1 text-[11px] text-red-200">Not delivered: {m.error}</p>}
      </div>
    </div>
  );
}

function Thread({ peer, fallbackName, onBack, onSent }: { peer: string; fallbackName: string; onBack: () => void; onSent: () => void }) {
  const [data, setData] = useState<{ name: string; messages: ChatMessage[]; window: WindowState } | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  const load = useCallback(async () => {
    try {
      const d = await getJson<{ name: string; messages: ChatMessage[]; window: WindowState }>(`/api/admin/chats/${peer}`);
      setData(d);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [peer]);

  // The component is keyed by the chat, so a new chat starts fresh. The first load runs on the next
  // tick, then every few seconds while the chat is open.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, THREAD_EVERY);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  useEffect(() => {
    // Scroll to the newest message when the chat opens and when a new one arrives.
    if (data && data.messages.length !== count.current) {
      count.current = data.messages.length;
      bottom.current?.scrollIntoView({ block: "end" });
    }
  }, [data]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/chats/${peer}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setText("");
      await load();
      onSent();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  const name = data?.name || fallbackName;
  const open = data?.window.open ?? false;
  let lastDay = "";
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <button onClick={onBack} aria-label="Back to chats" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{name || pretty(peer)}</p>
          <p className="truncate text-xs text-white/50">
            {name ? `${pretty(peer)} · ` : ""}
            <a href={`tel:+${peer}`} className="underline">
              Call
            </a>
          </p>
        </div>
      </header>
      {data && (
        <p className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${open ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-100"}`}>
          <Clock className="h-3.5 w-3.5 shrink-0" /> {windowLabel(data.window)}
        </p>
      )}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {!data && !error && <p className="text-center text-sm text-white/50">Loading…</p>}
        {data?.messages.map((m) => {
          const d = day(m.at);
          const sep = d !== lastDay;
          lastDay = d;
          return (
            <div key={m.id}>
              {sep && <p className="my-2 text-center text-[11px] uppercase tracking-wide text-white/40">{d}</p>}
              <Bubble m={m} />
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {error && <p className="border-t border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</p>}
      <div className="flex items-end gap-2 border-t border-white/10 p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(min-width: 768px)").matches) {
              e.preventDefault();
              send();
            }
          }}
          rows={Math.min(5, Math.max(1, text.split("\n").length))}
          maxLength={4000}
          disabled={!open}
          placeholder={open ? "Type a reply…" : "Reply window closed"}
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-emerald-400/60 focus:outline-none disabled:opacity-50"
        />
        <button onClick={send} disabled={!open || sending || !text.trim()} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white disabled:opacity-40">
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/** WhatsApp inbox for the coach: conversations on the left, the open chat on the right (one at a time on a phone). */
export function ChatsApp() {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setChats((await getJson<{ chats: ChatSummary[] }>("/api/admin/chats")).chats);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, LIST_EVERY);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  const waiting = chats?.filter((c) => c.lastFromThem && c.window.open).length ?? 0;
  useEffect(() => {
    document.title = `${waiting ? `(${waiting}) ` : ""}WhatsApp chats · Admin`;
  }, [waiting]);

  const current = chats?.find((c) => c.peer === active);
  return (
    <div className="flex h-[100dvh] flex-col bg-[#0b0b0f] text-white">
      {/* On a phone the open chat has its own back arrow, so this bar hides while a chat is open. */}
      <header className={`items-center gap-2 border-b border-white/10 px-3 py-2.5 ${active ? "hidden md:flex" : "flex"}`}>
        <a href="/admin" aria-label="Back to admin" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </a>
        <h1 className="flex-1 font-display text-lg">WhatsApp chats</h1>
        {waiting > 0 && <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold">{waiting} waiting</span>}
        <button onClick={load} aria-label="Refresh" className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className={`min-h-0 w-full overflow-y-auto border-white/10 md:block md:w-80 md:border-r ${active ? "hidden" : "block"}`}>
          {error && <p className="m-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
          {!chats && !error && <p className="p-4 text-sm text-white/50">Loading…</p>}
          {chats?.length === 0 && <p className="p-4 text-sm text-white/50">No WhatsApp conversations yet. Customer messages to the business number appear here.</p>}
          {chats?.map((c) => (
            <button
              key={c.peer}
              onClick={() => setActive(c.peer)}
              className={`flex w-full items-start gap-3 border-b border-white/5 px-3 py-3 text-left hover:bg-white/5 ${active === c.peer ? "bg-white/[0.07]" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/30 text-sm font-bold">{(c.name || "#").slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={`flex-1 truncate ${c.lastFromThem ? "font-bold" : "font-medium text-white/80"}`}>{c.name || pretty(c.peer)}</span>
                  <span className="shrink-0 text-[11px] text-white/40">{shortWhen(c.lastAt)}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className={`flex-1 truncate text-sm ${c.lastFromThem ? "text-white" : "text-white/50"}`}>{c.lastFromThem ? "" : "You: "}{c.lastBody}</span>
                  {c.lastFromThem && c.window.open && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" aria-label="Waiting for a reply" />}
                </span>
              </span>
            </button>
          ))}
        </aside>
        <main className={`min-h-0 flex-1 ${active ? "block" : "hidden md:block"}`}>
          {active ? (
            <Thread key={active} peer={active} fallbackName={current?.name ?? ""} onBack={() => setActive(null)} onSent={load} />
          ) : (
            <p className="flex h-full items-center justify-center p-6 text-center text-sm text-white/40">Pick a conversation to read and reply.</p>
          )}
        </main>
      </div>
    </div>
  );
}
