"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeartPulse, Menu, Phone, ShoppingBag, X } from "lucide-react";
import { healthHref } from "@/lib/portal";
import { NAV } from "@/lib/site";
import { Logo } from "./Logo";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { supabaseConfigured } from "@/lib/supabase/config";

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
  }, [open]);

  if (pathname.startsWith("/admin")) return null;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {announcement && (
        <div
          className={`overflow-hidden bg-gradient-to-r from-navy via-[#be1b2c] to-navy text-center text-xs font-semibold text-white transition-all duration-300 ${
            scrolled ? "max-h-0 py-0" : "max-h-10 py-2"
          }`}
        >
          {announcement}
        </div>
      )}
      <div className={`transition-all duration-300 ${scrolled ? "border-b border-white/10 bg-ink/90 py-2.5 backdrop-blur-xl" : "py-4"}`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main">
          <Link href="/" aria-label={`${name} home`} onClick={() => setOpen(false)}>
            <Logo name={name} />
          </Link>
          <ul className="hidden items-center gap-0.5 xl:flex 2xl:gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors 2xl:px-3.5 ${
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
            <a href={healthHref} className="hidden h-10 items-center gap-1.5 rounded-full border border-emerald-400/40 px-3 text-xs font-bold text-emerald-300 hover:border-emerald-300 hover:text-emerald-200 md:flex" title="Premium Health Platform">
              <HeartPulse className="h-4 w-4" /> Health
            </a>
            <Link href="/shop" className="hidden h-10 items-center gap-1.5 rounded-full border border-amber-400/40 px-3 text-xs font-bold text-amber-300 hover:border-amber-300 hover:text-amber-200 xl:flex" title="Supplement store">
              <ShoppingBag className="h-4 w-4" /> Shop
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

      <div
        id="mobile-menu"
        className={`fixed inset-0 top-0 -z-10 bg-ink/97 backdrop-blur-xl transition-all duration-500 xl:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <ul className="flex h-full flex-col items-center justify-center gap-2">
          {NAV.map((item, i) => (
            <li
              key={item.href}
              className="transition-all duration-500"
              style={{ transitionDelay: open ? `${i * 45}ms` : "0ms", transform: open ? "none" : "translateY(16px)", opacity: open ? 1 : 0 }}
            >
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={`font-display block px-6 py-2 text-3xl ${isActive(item.href) ? "text-brand" : "text-white"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {supabaseConfigured && (
            <li>
              <Link href="/account" onClick={() => setOpen(false)} className="font-display block px-6 py-2 text-xl text-sky">
                My account
              </Link>
            </li>
          )}
          <li>
            <a href={healthHref} onClick={() => setOpen(false)} className="font-display flex items-center gap-2 px-6 py-2 text-xl text-emerald-300">
              <HeartPulse className="h-5 w-5" /> Premium Health Platform
            </a>
          </li>
          <li>
            <Link href="/shop" onClick={() => setOpen(false)} className="font-display flex items-center gap-2 px-6 py-2 text-xl text-amber-300">
              <ShoppingBag className="h-5 w-5" /> Supplements Store
            </Link>
          </li>
          <li className="mt-6">
            <Link href="/contact#trial" onClick={() => setOpen(false)} className="btn-brand rounded-full px-8 py-3 font-bold">
              Book Free Trial
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
