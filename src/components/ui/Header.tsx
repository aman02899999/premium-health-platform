"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Calculator, ChevronRight, CreditCard, Dumbbell, HeartPulse, Home, Images, Menu, Newspaper, Phone, Salad, ShoppingBag, Stethoscope, Store, UserRound, X, type LucideIcon } from "lucide-react";
import { healthHref } from "@/lib/portal";
import { NAV } from "@/lib/site";
import { Logo } from "./Logo";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { supabaseConfigured } from "@/lib/supabase/config";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/programs": Dumbbell,
  "/membership": CreditCard,
  "/health-hub": Stethoscope,
  "/tools": Calculator,
  "/blog": Newspaper,
  "/library": BookOpen,
  "/store": Store,
  "/gallery": Images,
  "/contact": Phone,
};

export function Header({ name, phoneHref, announcement }: { name: string; phoneHref: string; announcement: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (pathname.startsWith("/admin")) return null;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {announcement && (
        <div
          className={`announce-bar overflow-hidden bg-gradient-to-r from-navy via-[#be1b2c] to-navy text-center text-xs font-semibold text-white transition-all duration-300 ${
            scrolled ? "max-h-0 py-0" : "max-h-10 py-2"
          }`}
        >
          {announcement}
        </div>
      )}
      <div className={`transition-all duration-300 ${scrolled ? "border-b border-white/10 bg-ink/90 py-2.5 backdrop-blur-xl" : "py-4"}`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 min-[106.25rem]:max-w-[1600px]" aria-label="Main">
          {/* The full menu needs the room on laptops: there the logo is the badge alone (the link
              label names the club); the wordmark comes back on wide screens and wherever the menu is folded. */}
          <Link href="/" aria-label={name} onClick={() => setOpen(false)} className="shrink-0">
            <Logo name={name} textClassName="xl:hidden min-[106.25rem]:block" />
          </Link>
          <ul className="hidden items-center gap-0.5 xl:flex min-[106.25rem]:gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors min-[106.25rem]:px-3.5 ${
                    isActive(item.href) ? "bg-white/10 text-brand" : "text-white/75 hover:text-white"
                  }`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <a href={phoneHref} className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 hover:border-brand hover:text-brand sm:flex" aria-label="Call the gym">
              <Phone className="h-4 w-4" />
            </a>
            <a href={healthHref} className="hidden h-10 items-center gap-1.5 rounded-full border border-emerald-400/40 px-3 text-xs font-bold text-emerald-300 hover:border-emerald-300 hover:text-emerald-200 md:flex" title="Bharat Health Guide" aria-label="Bharat Health Guide">
              <HeartPulse className="h-4 w-4" /> <span className="xl:hidden min-[106.25rem]:inline">Health</span>
            </a>
            <Link href="/shop" className="hidden h-10 items-center gap-1.5 rounded-full border border-amber-400/40 px-3 text-xs font-bold text-amber-300 hover:border-amber-300 hover:text-amber-200 xl:flex" title="Royal Supplements Store" aria-label="Royal Supplements Store">
              <ShoppingBag className="h-4 w-4" /> <span className="xl:hidden min-[106.25rem]:inline">Shop</span>
            </Link>
            <AccountMenu />
            <Link href="/contact#trial" className="btn-brand hidden whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold sm:inline-block">
              Free Trial
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 xl:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer: slides in from the right, scrolls on short screens, CTA pinned at the bottom. */}
      {/* The closed drawer is only "invisible", which Next still counts as on screen, so its links
          don't prefetch: otherwise every page load on a phone fetched every page in the menu. */}
      <div className={`fixed inset-0 z-10 xl:hidden ${open ? "visible" : "invisible"}`} aria-hidden={!open}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 right-0 flex h-[100dvh] w-[min(88vw,380px)] flex-col border-l border-white/10 bg-ink shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <span className="font-display text-lg tracking-wide text-white">Menu</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3" aria-label="Mobile">
            <ul className="space-y-0.5">
              {NAV.map((item) => {
                const Icon = NAV_ICONS[item.href] ?? ChevronRight;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link prefetch={false}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition-colors ${
                        active ? "bg-brand/15 text-white ring-1 ring-brand/40" : "text-white/80 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${active ? "text-brand" : "text-white/45"}`} />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-white/25" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="mt-5 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">More from us</p>
            <ul className="mt-2 space-y-2">
              {supabaseConfigured && (
                <li>
                  <Link prefetch={false} href="/account" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-sky hover:bg-white/5">
                    <UserRound className="h-5 w-5 shrink-0" /> My account
                  </Link>
                </li>
              )}
              {supabaseConfigured && (
                <li>
                  <Link prefetch={false} href="/account/plans" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-sky hover:bg-white/5">
                    <Salad className="h-5 w-5 shrink-0" /> My diet &amp; workout plans
                  </Link>
                </li>
              )}
              <li>
                <a href={healthHref} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/5 px-3 py-3 text-[15px] font-semibold text-emerald-300 hover:bg-emerald-500/10">
                  <HeartPulse className="h-5 w-5 shrink-0" /> Bharat Health Guide
                </a>
              </li>
              <li>
                <Link prefetch={false} href="/shop" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl border border-amber-400/25 bg-amber-500/5 px-3 py-3 text-[15px] font-semibold text-amber-300 hover:bg-amber-500/10">
                  <ShoppingBag className="h-5 w-5 shrink-0" /> Royal Supplements Store
                </Link>
              </li>
            </ul>
          </nav>

          <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-white/10 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Link prefetch={false} href="/contact#trial" onClick={() => setOpen(false)} className="btn-brand flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold">
              Book Free Trial
            </Link>
            <a href={phoneHref} aria-label="Call the gym" className="flex h-11 w-11 items-center justify-center self-center rounded-full border border-white/15 text-white/80 hover:border-brand hover:text-brand">
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
