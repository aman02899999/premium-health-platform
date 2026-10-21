"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check, CircleAlert, IndianRupee, MessageCircle, Package, Salad, Star, UserPlus, X } from "lucide-react";
import { KIND_LABEL, URGENT, freshSince, type Notice, type NoticeKind } from "@/lib/admin/notifications-core";

const EVERY = 30_000;
const ICON: Record<NoticeKind, typeof Bell> = { message: MessageCircle, handoff: CircleAlert, lead: UserPlus, payment: IndianRupee, plan: Salad, order: Package, review: Star, failed: CircleAlert };
const TONE: Record<NoticeKind, string> = {
  message: "text-emerald-300",
  handoff: "text-red-300",
  lead: "text-sky-300",
  payment: "text-amber-300",
  plan: "text-violet-300",
  order: "text-amber-200",
  review: "text-yellow-300",
  failed: "text-red-300",
};

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  return m < 1 ? "now" : m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
};

const canNotify = () => typeof window !== "undefined" && "Notification" in window;

/**
 * The admin bell: what happened in the last 3 days (messages, hand-offs, leads, payments, plans to
 * write, orders, reviews, failed messages), the unread count, and a desktop alert for anything new
 * while the admin is open. Each person sees only what their role may open.
 */
export function NotificationBell() {
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const newest = useRef<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { items: Notice[]; unread: number };
      // A desktop alert for what arrived since the last check (not on the first load).
      if (canNotify() && Notification.permission === "granted" && document.visibilityState !== "visible") {
        for (const n of freshSince(j.items, newest.current)) {
          const alert = new Notification(n.title, { body: n.body || KIND_LABEL[n.kind], tag: n.id, icon: "/icon-192.png" });
          alert.onclick = () => {
            window.focus();
            location.assign(n.href);
          };
        }
      }
      newest.current = j.items[0]?.at ?? newest.current ?? new Date(0).toISOString();
      setItems(j.items);
      setUnread(j.unread);
    } catch {
      // Offline or signed out: try again on the next tick.
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => {
      setPermission(canNotify() ? Notification.permission : "unsupported");
      load();
    }, 0);
    const t = setInterval(load, EVERY);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [load]);

  // The tab title shows the count, so it's visible from another tab.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\) /, "");
    document.title = unread ? `(${unread > 99 ? "99+" : unread}) ${base}` : base;
  }, [unread]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function seen() {
    setUnread(0);
    await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seen" }) }).catch(() => {});
  }

  async function enableAlerts() {
    if (!canNotify()) return;
    setPermission(await Notification.requestPermission());
  }

  const urgent = items.some((n) => URGENT.includes(n.kind));
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-xl border border-white/15 p-2 text-white/80 hover:bg-white/10"
      >
        {unread ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {unread > 0 && <span className={`absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full px-1 text-center text-[10px] font-bold leading-[18px] text-white ${urgent ? "bg-red-500" : "bg-sky-500"}`}>{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="fixed inset-x-2 top-16 z-50 max-h-[75vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0e1116] shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <p className="font-semibold text-white">Notifications</p>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button type="button" onClick={seen} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10">
                  <Check className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1 text-white/60 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {permission === "default" && (
            <button type="button" onClick={enableAlerts} className="block w-full border-b border-white/10 bg-emerald-500/10 px-4 py-2 text-left text-xs text-emerald-100 hover:bg-emerald-500/20">
              🔔 Turn on desktop alerts: get a pop-up for new messages and payments while the admin is open in a tab.
            </button>
          )}
          {permission === "denied" && <p className="border-b border-white/10 px-4 py-2 text-xs text-white/50">Desktop alerts are blocked for this site in your browser settings.</p>}
          <ul className="max-h-[60vh] divide-y divide-white/5 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-white/50">Nothing in the last 3 days.</li>}
            {items.map((n) => {
              const Icon = ICON[n.kind];
              return (
                <li key={n.id}>
                  <a href={n.href} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-white/5">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE[n.kind]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white">{n.title}</span>
                      {n.body && <span className="block truncate text-xs text-white/55">{n.body}</span>}
                      <span className="block text-[11px] text-white/40">
                        {KIND_LABEL[n.kind]} · {ago(n.at)}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
