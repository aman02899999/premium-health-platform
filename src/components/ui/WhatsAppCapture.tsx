"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageCircle, X } from "lucide-react";

// Every "WhatsApp us" button on the site opens this short form first, so the coach knows who is
// writing and what about — and, if they agree, can send them the plans by email. "Skip" always
// goes straight to WhatsApp. Once someone has filled it, it doesn't ask again for 30 days.

type Interest = "diet" | "pt" | "membership" | "other";
const OPTIONS: [Interest, string][] = [
  ["diet", "Diet plan"],
  ["pt", "Personal training"],
  ["membership", "Gym membership"],
  ["other", "Something else"],
];
const LABEL: Record<Interest, string> = { diet: "a personal diet plan", pt: "personal training", membership: "a gym membership", other: "your services" };
const KEY = "rfc-wa-lead-v1";
const TTL = 30 * 86_400_000;

function guessInterest(path: string, text: string): Interest {
  const s = `${path} ${text}`.toLowerCase();
  if (/diet|nutrition|meal|calorie/.test(s)) return "diet";
  if (/personal training|personal-training|\bpt\b|trainer/.test(s)) return "pt";
  if (/membership|join|trial|plan/.test(s)) return "membership";
  return "other";
}

export function WhatsAppCapture({ whatsapp }: { whatsapp: string }) {
  const number = whatsapp.replace(/\D/g, "");
  const path = usePathname();
  const [target, setTarget] = useState<{ href: string; text: string } | null>(null);
  const [f, setF] = useState({ name: "", phone: "", email: "", interest: "other" as Interest, marketing: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.dataset.noCapture !== undefined) return;
      const m = /^https:\/\/(?:wa\.me|api\.whatsapp\.com\/send)\/?(\d+)?/.exec(a.href);
      if (!m || (m[1] && m[1] !== number)) return; // share links and other numbers pass through
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) || "null") as { at: number } | null;
        if (saved && Date.now() - saved.at < TTL) return;
      } catch {
        /* storage blocked: ask */
      }
      e.preventDefault();
      const text = new URL(a.href).searchParams.get("text") || "";
      setF((x) => ({ ...x, interest: (a.dataset.interest as Interest) || guessInterest(location.pathname, text) }));
      setError("");
      setTarget({ href: a.href, text });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [number]);

  useEffect(() => {
    if (target) setTimeout(() => first.current?.focus(), 50);
  }, [target]);

  if (!target) return null;
  const close = () => setTarget(null);
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  const digits = f.phone.replace(/\D/g, "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.name.trim().length < 2) return setError("Please enter your name.");
    if (!/^(91)?[6-9]\d{9}$/.test(digits)) return setError("Please enter a valid 10-digit mobile number.");
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) return setError("Please check your email address, or leave it blank.");
    setBusy(true);
    // keepalive: the request finishes even though WhatsApp opens straight away.
    fetch("/api/leads", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name.trim(), phone: digits.slice(-10), email: f.email.trim(), interest: f.interest, marketing: f.marketing && !!f.email.trim(), source: `whatsapp-${f.interest}`, message: target!.text.slice(0, 600), goal: LABEL[f.interest].slice(0, 60) }),
    }).catch(() => {});
    try {
      localStorage.setItem(KEY, JSON.stringify({ at: Date.now() }));
    } catch {
      /* ignore */
    }
    const msg = `Hi, I'm ${f.name.trim()}. I'm interested in ${LABEL[f.interest]}.${target!.text ? ` ${target!.text}` : ""}`;
    open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`);
    setBusy(false);
    close();
  }

  const field = "field mt-1 w-full";
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="wa-capture-title" onClick={(e) => e.target === e.currentTarget && close()}>
      <form onSubmit={submit} className="glass brand-border relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl">
        <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-[#25d366]">
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">WhatsApp</span>
        </div>
        <h2 id="wa-capture-title" className="font-display mt-1 text-2xl text-white">
          Before we chat — 3 quick details
        </h2>
        <p className="mt-1 text-sm text-white/60">So the coach knows who you are and what you need.</p>

        <div className="mt-4 grid gap-3">
          <div>
            <span className="text-sm text-white/70">I&apos;m interested in</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {OPTIONS.map(([v, l]) => (
                <button key={v} type="button" aria-pressed={f.interest === v} onClick={() => setF({ ...f, interest: v })} className={`rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 ${f.interest === v ? "bg-brand text-white ring-brand" : "bg-white/[.03] text-white/70 ring-white/10"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <label className="text-sm text-white/70">
            Your name
            <input ref={first} required minLength={2} maxLength={80} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
          </label>
          <label className="text-sm text-white/70">
            WhatsApp number
            <input required type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={field} />
          </label>
          <label className="text-sm text-white/70">
            Email <span className="text-white/40">(optional — for your plan and offers)</span>
            <input type="email" autoComplete="email" maxLength={120} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={field} />
          </label>
          {f.email.trim() && (
            <label className="flex cursor-pointer items-start gap-2 text-sm text-white/70">
              <input type="checkbox" checked={f.marketing} onChange={(e) => setF({ ...f, marketing: e.target.checked })} className="mt-1 accent-[#e8394b]" />
              <span>Email me plans, prices, tips and offers. I can unsubscribe at any time.</span>
            </label>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-3.5 font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />} Continue to WhatsApp
        </button>
        <button
          type="button"
          onClick={() => {
            open(target.href);
            close();
          }}
          className="mt-3 w-full text-center text-sm text-white/50 underline underline-offset-4 hover:text-white"
        >
          Skip and open WhatsApp
        </button>
        <p className="mt-3 text-center text-[11px] text-white/35">We use these details only to reply to you. See our privacy policy.</p>
      </form>
    </div>
  );
}
