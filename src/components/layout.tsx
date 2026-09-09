"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Activity, ChevronDown, FlaskConical, Heart, Home, Leaf, Menu, Moon, Pill,
  Search, Sparkles, Sun, X, Calculator, BookOpen, ShoppingBag, Stethoscope,
  User, Crown, LogOut,
} from "lucide-react";
import { PRIMARY_NAV, SITE, FOOTER_COLUMNS, SEARCH_PLACEHOLDER } from "@/lib/site";
import { searchAll } from "@/lib/search-index";
import { cn } from "@/lib/format";
import { useAuth } from "@/components/auth/AuthContext";

// ---------- Theme ----------
const ThemeCtx = createContext<{ dark: boolean; toggle: () => void; reduceMotion: boolean; toggleMotion: () => void }>({ dark: false, toggle: () => {}, reduceMotion: false, toggleMotion: () => {} });
export function useTheme() { return useContext(ThemeCtx); }
export function Providers({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("bhg-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefers)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    if (localStorage.getItem("bhg-motion") === "reduced") {
      setReduceMotion(true);
      document.documentElement.classList.add("reduced-motion");
    }
  }, []);
  const toggle = () => {
    setDark((d) => {
      const nd = !d;
      document.documentElement.classList.toggle("dark", nd);
      localStorage.setItem("bhg-theme", nd ? "dark" : "light");
      return nd;
    });
  };
  const toggleMotion = () => {
    setReduceMotion((m) => {
      const nm = !m;
      document.documentElement.classList.toggle("reduced-motion", nm);
      localStorage.setItem("bhg-motion", nm ? "reduced" : "full");
      return nm;
    });
  };
  const val = useMemo(() => ({ dark, toggle, reduceMotion, toggleMotion }), [dark, reduceMotion]);
  return <ThemeCtx.Provider value={val}>{children}</ThemeCtx.Provider>;
}

// ---------- Logo ----------
export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20">
        <Heart className="h-5 w-5 fill-amber-300 text-amber-300" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">✦</span>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="font-display block text-[17px] font-bold text-stone-900 dark:text-white">{SITE.name}</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Modern · Ayurveda · Nutrition</span>
        </span>
      )}
    </Link>
  );
}

// ---------- Search bar ----------
export function SearchBar({ large, autoFocus }: { large?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => (q.length > 1 ? searchAll(q, 8) : []), [q]);
  return (
    <div className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); if (q.trim()) { setOpen(false); router.push(`/search?q=${encodeURIComponent(q.trim())}`); } }}
        className={cn("flex items-center gap-2 rounded-2xl border bg-white/90 shadow-lg shadow-emerald-900/5 backdrop-blur transition focus-within:border-emerald-400 dark:bg-stone-900/90 dark:border-stone-700", large ? "h-14 px-2 pl-5" : "h-11 px-2 pl-4")}
      >
        <Search className={cn("shrink-0 text-emerald-700 dark:text-emerald-300", large ? "h-5 w-5" : "h-4 w-4")} />
        <label htmlFor={large ? "global-search" : "nav-search"} className="sr-only">Search health topics</label>
        <input
          id={large ? "global-search" : "nav-search"}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder={SEARCH_PLACEHOLDER}
          className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100"
        />
        <button type="submit" className={cn("shrink-0 rounded-xl bg-emerald-700 font-semibold text-white transition hover:bg-emerald-600", large ? "h-10 px-6 text-sm" : "h-8 px-4 text-xs")}>Search</button>
      </form>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900" role="listbox" aria-label="Search suggestions">
          {results.map((r) => (
            <Link key={r.href} href={r.href} className="flex items-center gap-3 border-b border-stone-100 px-4 py-2.5 last:border-0 hover:bg-emerald-50 dark:border-stone-800 dark:hover:bg-stone-800">
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{r.type}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{r.title}</span>
                <span className="block truncate text-xs text-stone-500 dark:text-stone-400">{r.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Auth menu ----------
function AuthMenu() {
  const { user, isPremium, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/login" className="hidden rounded-xl border border-stone-200 px-3 py-2 text-[13px] font-bold hover:bg-stone-50 sm:flex dark:border-stone-700">Login</Link>
        <Link href="/register" className="rounded-xl bg-stone-900 px-3 py-2 text-[13px] font-bold text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900">Sign up</Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-sm font-bold shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xs font-black">{user.name.charAt(0).toUpperCase()}</span>
        <span className="hidden sm:block">{user.name.split(" ")[0]}</span>
        {isPremium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl dark:border-stone-700 dark:bg-stone-900">
          <div className="rounded-xl bg-stone-50 p-3 dark:bg-stone-800">
            <p className="text-sm font-bold">{user.name} {isPremium && <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white">PREMIUM</span>}</p>
            <p className="text-xs text-stone-500">{user.email}</p>
            <p className="mt-1 text-[11px] text-stone-400">{user.provider} SSO · {user.role}</p>
          </div>
          <Link href="/profile" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800"><User className="h-4 w-4" /> Profile & Earnings</Link>
          <Link href="/premium" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800"><Crown className="h-4 w-4 text-amber-500" /> Premium Plans</Link>
          <button onClick={async () => { setOpen(false); await signOut(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      )}
    </div>
  );
}

// ---------- Header ----------
export function Header() {
  const pathname = usePathname();
  const { dark, toggle, reduceMotion, toggleMotion } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  useEffect(() => { setMobileOpen(false); setOpenMenu(null); }, [pathname]);

  return (
    <>
      <div className="bg-emerald-950 text-center text-[11px] font-medium text-emerald-100/90 md:text-xs">
        <p className="mx-auto max-w-7xl px-4 py-1.5">Educational information only — not a substitute for medical advice. <Link href="/disclaimer" className="underline underline-offset-2 hover:text-amber-300">Read disclaimer</Link> · <button onClick={toggleMotion} className="underline underline-offset-2 hover:text-amber-300">{reduceMotion ? "Enable animations" : "Reduce motion"}</button></p>
      </div>
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/85 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/85">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4">
          <button className="rounded-xl p-2 hover:bg-stone-100 lg:hidden dark:hover:bg-stone-800" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <Logo />
          <div className="ml-4 hidden max-w-md flex-1 xl:block"><SearchBar /></div>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/health-calculators" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-stone-600 hover:bg-stone-100 md:flex dark:text-stone-300 dark:hover:bg-stone-800"><Calculator className="h-4 w-4" /> Calculators</Link>
            <Link href="/premium" className="hidden items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-[13px] font-bold text-stone-900 hover:bg-amber-400 md:flex"><Crown className="h-4 w-4" /> Premium</Link>
            <Link href="/search" className="rounded-xl p-2.5 hover:bg-stone-100 xl:hidden dark:hover:bg-stone-800" aria-label="Search"><Search className="h-5 w-5" /></Link>
            <button onClick={toggle} className="rounded-xl p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
            <AuthMenu />
          </div>
        </div>
        <nav className="hidden border-t border-stone-100 lg:block dark:border-stone-800/60" aria-label="Primary">
          <ul className="no-scrollbar mx-auto flex max-w-7xl items-center gap-0.5 overflow-x-auto px-4">
            {PRIMARY_NAV.map((item) => (
              <li key={item.label} className="relative" onMouseEnter={() => setOpenMenu(item.children ? item.label : null)} onMouseLeave={() => setOpenMenu(null)}>
                <Link href={item.href} className={cn("flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2.5 text-[13px] font-semibold transition", pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "text-emerald-700 dark:text-emerald-300" : "text-stone-600 hover:text-emerald-700 dark:text-stone-300")}>
                  {item.label}{item.children && <ChevronDown className="h-3 w-3" />}
                </Link>
                {item.children && openMenu === item.label && (
                  <div className="absolute left-0 top-full z-50 w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl dark:border-stone-700 dark:bg-stone-900">
                    {item.children.map((c) => (
                      <Link key={c.href + c.label} href={c.href} className="block rounded-xl px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-stone-200 dark:hover:bg-stone-800">{c.label}</Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-white p-4 dark:bg-stone-950">
            <div className="mb-3 flex items-center justify-between"><Logo /><button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 hover:bg-stone-100 dark:hover:bg-stone-800" aria-label="Close menu"><X className="h-5 w-5" /></button></div>
            <SearchBar />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "Diseases", href: "/diseases", icon: <Stethoscope className="h-4 w-4" /> },
                { label: "Ayurveda", href: "/ayurveda", icon: <Sparkles className="h-4 w-4" /> },
                { label: "Herbs", href: "/herbs", icon: <Leaf className="h-4 w-4" /> },
                { label: "Medicines", href: "/medicines", icon: <Pill className="h-4 w-4" /> },
                { label: "Lab Tests", href: "/lab-tests", icon: <FlaskConical className="h-4 w-4" /> },
                { label: "Calculators", href: "/health-calculators", icon: <Calculator className="h-4 w-4" /> },
                { label: "Blog", href: "/blog", icon: <BookOpen className="h-4 w-4" /> },
                { label: "Products", href: "/products", icon: <ShoppingBag className="h-4 w-4" /> },
              ].map((c) => (
                <Link key={c.label} href={c.href} className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm font-semibold dark:border-stone-700">{c.icon}{c.label}</Link>
              ))}
            </div>
            <nav className="mt-4 space-y-0.5" aria-label="Mobile">
              {PRIMARY_NAV.map((item) => (
                <Link key={item.label} href={item.href} className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800">{item.label}</Link>
              ))}
            </nav>
            <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100">
              <p className="flex gap-1.5"><Activity className="h-4 w-4 shrink-0" /> Emergency? Chest pain, breathlessness, stroke signs — call emergency services immediately. <Link href="/symptoms/chest-pain" className="font-bold underline">Learn signs</Link></p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Mobile bottom nav ----------
export function MobileBottomNav() {
  const pathname = usePathname();
  const items = [
    { label: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { label: "Search", href: "/search", icon: <Search className="h-5 w-5" /> },
    { label: "Diseases", href: "/diseases", icon: <Stethoscope className="h-5 w-5" /> },
    { label: "Ayurveda", href: "/ayurveda", icon: <Leaf className="h-5 w-5" /> },
    { label: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-lg lg:hidden dark:border-stone-800 dark:bg-stone-950/95" aria-label="Mobile bottom">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.label}>
              <Link href={it.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold", active ? "text-emerald-700 dark:text-emerald-300" : "text-stone-500 dark:text-stone-400")}>{it.icon}{it.label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ---------- Footer ----------
export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 pb-20 dark:border-stone-800 dark:bg-stone-950 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-stone-600 dark:text-stone-400">{SITE.tagline}. Understand, manage and prevent — with responsible, evidence-informed guidance.</p>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <strong>Medical disclaimer:</strong> {SITE.disclaimer}
            </div>
            <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400"><strong>Affiliate disclosure:</strong> {SITE.affiliateDisclosure}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/premium" className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-900">Premium — ₹199/mo</Link>
              <Link href="/login" className="rounded-xl border px-3 py-1.5 text-xs font-bold">Login — SSO</Link>
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href + l.label}><Link href={l.href} className="text-[13px] text-stone-600 hover:text-emerald-700 hover:underline dark:text-stone-300">{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-stone-200 pt-6 text-xs text-stone-500 md:flex-row dark:border-stone-800 dark:text-stone-400">
          <p>© 2026 {SITE.name}. All rights reserved. Made for Indian families. · SEO optimized · SSO optimized · Earning optimized</p>
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/disclaimer" className="hover:underline">Disclaimer</Link>
            <Link href="/affiliate-disclosure" className="hover:underline">Affiliate Disclosure</Link>
            <Link href="/sitemap.xml" className="hover:underline">Sitemap</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
