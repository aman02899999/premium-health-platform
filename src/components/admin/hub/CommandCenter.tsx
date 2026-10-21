"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  CalendarDays,
  Clapperboard,
  Contact,
  ExternalLink,
  FileCheck2,
  FileText,
  Gift,
  HelpCircle,
  Inbox,
  IndianRupee,
  LayoutTemplate,
  ListChecks,
  LogOut,
  Megaphone,
  MessageCircle,
  QrCode,
  Salad,
  Search,
  Send,
  ShoppingBag,
  Star,
  Upload,
  UserPlus,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { attention, badgeText, filterSections, inr, pctOf, type Counters } from "@/lib/admin/hub";

const ICONS: Record<string, LucideIcon> = {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  CalendarDays,
  Clapperboard,
  Contact,
  ExternalLink,
  FileCheck2,
  FileText,
  Gift,
  HelpCircle,
  Inbox,
  IndianRupee,
  LayoutTemplate,
  ListChecks,
  Megaphone,
  MessageCircle,
  QrCode,
  Salad,
  Search,
  Send,
  ShoppingBag,
  Star,
  Upload,
  UserPlus,
  Users,
  Workflow,
};

// One accent per section, so the eye finds "Grow" or "Sell" without reading.
const TONE: Record<string, string> = {
  start: "from-emerald-500/20 text-emerald-300 ring-emerald-400/30",
  grow: "from-sky-500/20 text-sky-300 ring-sky-400/30",
  sell: "from-amber-400/20 text-amber-300 ring-amber-400/30",
  manage: "from-brand/25 text-brand ring-brand/40",
  settings: "from-white/10 text-white/70 ring-white/20",
};

function Kpi({ label, value, sub, href }: { label: string; value: string; sub?: string; href: string }) {
  return (
    <a href={href} className="rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 transition hover:bg-white/[.07]">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 font-display text-2xl text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/45">{sub}</p>}
    </a>
  );
}

export function CommandCenter({ name, counters }: { name: string; counters: Counters | null }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const sections = useMemo(() => filterSections(query), [query]);
  const todo = counters ? attention(counters) : [];
  const c7 = counters?.campaign7;

  useEffect(() => {
    // "/" jumps to search, like most consoles.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Enter opens the first match.
  const first = sections[0]?.tiles[0];

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
          <span className="min-w-0 truncate font-display text-lg">
            Command Center<span className="hidden text-brand sm:inline"> · {name}</span>
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <a href="/" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80">
              <ExternalLink className="h-4 w-4" /> <span className="hidden sm:inline">View site</span>
            </a>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                location.href = "/admin/login";
              }}
              className="rounded-lg border border-white/15 p-2 text-white/70"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <label className="flex items-center gap-3 rounded-2xl bg-white/[.05] px-4 py-3 ring-1 ring-white/10 focus-within:ring-brand/60">
          <Search className="h-5 w-5 shrink-0 text-white/45" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && first) location.href = first.href;
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search tools: broadcast, renew, diet, templates…"
            aria-label="Search admin tools"
            className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/35 focus:outline-none"
          />
          <kbd className="hidden rounded border border-white/15 px-1.5 text-xs text-white/40 sm:inline">/</kbd>
        </label>

        {!query && counters && (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Key numbers">
              <Kpi label="Revenue today" value={inr(counters.revenueToday)} sub="online, after refunds" href="/admin/analytics?days=7" />
              <Kpi label="Revenue, 30 days" value={inr(counters.revenue30)} href="/admin/analytics?days=30" />
              <Kpi label="Active members" value={String(counters.activeMembers)} sub={counters.expiring7 ? `${counters.expiring7} ending this week` : undefined} href="/admin/growth?tab=members" />
              <Kpi label="Leads today" value={String(counters.leadsToday)} sub={counters.trialsToday ? `${counters.trialsToday} trials today` : undefined} href="/admin/growth?tab=leads" />
              <Kpi
                label="Campaigns, 7 days"
                value={c7?.sent ? `${pctOf(c7.read, c7.sent)}% read` : "–"}
                sub={c7?.sent ? `${c7.sent} sent · ${pctOf(c7.delivered, c7.sent)}% delivered · ${c7.clicked} clicked` : "nothing sent this week"}
                href="/admin/audience"
              />
            </section>

            <section className="rounded-2xl bg-white/[.03] p-4 ring-1 ring-white/10" aria-label="Needs you now">
              <h2 className="flex items-center gap-2 font-display text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-300" /> Needs you now
              </h2>
              {todo.length ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {todo.map((t) => (
                    <li key={t.text}>
                      <a href={t.href} className="flex items-center gap-2 rounded-xl bg-white/[.04] px-3 py-2.5 text-sm hover:bg-white/[.08]">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${t.tone === "red" ? "bg-red-400" : "bg-amber-300"}`} />
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-emerald-200">All clear: no chats waiting, no uncalled leads, nothing to ship.</p>
              )}
            </section>
          </>
        )}
        {!query && !counters && <p className="rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">Live numbers need the database. The tools below still open.</p>}

        {sections.map((s) => (
          <section key={s.id} aria-labelledby={`hub-${s.id}`}>
            <h2 id={`hub-${s.id}`} className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/45">
              {s.title}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {s.tiles.map((t) => {
                const Icon = ICONS[t.icon] ?? Activity;
                const badge = badgeText(t, counters);
                return (
                  <a
                    key={t.id}
                    href={t.href}
                    target={t.href === "/" ? "_blank" : undefined}
                    className="group flex items-start gap-3 rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[.07] hover:ring-white/20"
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br to-transparent ring-1 ${TONE[s.id]}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold">{t.title}</span>
                        {badge && (
                          <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${t.badge?.alert ? "bg-red-500/90 text-white" : "bg-white/10 text-white/80"}`}>{badge}</span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-white/50">{t.hint}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
        {!sections.length && <p className="text-center text-sm text-white/50">Nothing matches “{query}”.</p>}
      </main>
    </div>
  );
}
