"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, Crown, Gift, Home, LayoutGrid, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "./cart";

type NavCat = { slug: string; name: string };

function CartIcon({ className = "" }: { className?: string }) {
  const { count, ready } = useCart();
  return (
    <span className={`relative inline-flex ${className}`}>
      <ShoppingCart className="h-5 w-5" />
      {ready && count > 0 && <span className="absolute -right-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-black text-black">{count}</span>}
    </span>
  );
}

export function ShopHeader({ storeName, announcement, categories }: { storeName: string; announcement: string; categories: NavCat[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <>
      {announcement && (
        <div className="overflow-hidden bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 py-2 text-center text-[11px] font-black uppercase tracking-wider text-black sm:text-xs">
          <p className="px-3">{announcement}</p>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-white/80 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/shop" className="flex items-center gap-2" aria-label={`${storeName} home`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-lg shadow-amber-500/30">
              <Crown className="h-5 w-5" />
            </span>
            <span className="font-display text-lg leading-none tracking-wide text-white sm:text-xl">
              {storeName.split(" ")[0]} <span className="text-amber-300">{storeName.split(" ").slice(1).join(" ")}</span>
            </span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Store">
            {categories.slice(0, 5).map((c) => (
              <Link key={c.slug} href={`/shop/c/${c.slug}`} className={`rounded-full px-3 py-2 text-sm ${pathname === `/shop/c/${c.slug}` ? "bg-white/10 text-amber-300" : "text-white/70 hover:text-white"}`}>
                {c.name}
              </Link>
            ))}
            <Link href="/shop/combos" className="rounded-full px-3 py-2 text-sm font-bold text-amber-300 hover:text-amber-200">
              Combos
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link href="/shop/products" className="rounded-full p-2.5 text-white/80 hover:text-white" aria-label="Search products">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/shop/account" className="hidden rounded-full p-2.5 text-white/80 hover:text-white sm:inline-flex" aria-label="My account and orders">
              <User className="h-5 w-5" />
            </Link>
            <Link href="/shop/cart" className="rounded-full bg-white/10 p-2.5 pr-3.5 text-white hover:bg-white/15" aria-label="Cart">
              <CartIcon />
            </Link>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setOpen(false)}>
          <nav className="h-full w-80 max-w-[85vw] overflow-y-auto bg-coal p-5" onClick={(e) => e.stopPropagation()} aria-label="Store menu">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-xl text-white">{storeName}</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/70" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-1 text-white/85">
              {[{ href: "/shop", l: "Home" }, { href: "/shop/products", l: "All products" }, ...categories.map((c) => ({ href: `/shop/c/${c.slug}`, l: c.name })), { href: "/shop/combos", l: "Combo offers" }, { href: "/shop/blog", l: "Supplement guides" }, { href: "/shop/account", l: "My orders" }, { href: "/shop/policies", l: "Shipping & returns" }].map((x) => (
                <li key={x.href}>
                  <Link href={x.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 hover:bg-white/5">
                    {x.l}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/" className="mt-6 block rounded-xl border border-white/10 px-3 py-3 text-sm text-white/60">
              ← Royal Fitness Club
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

/** Phone bottom navigation; a spacer keeps the page end clear of it. */
export function ShopBottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/shop", l: "Home", icon: Home },
    { href: "/shop/products", l: "Shop", icon: LayoutGrid },
    { href: "/shop/combos", l: "Combos", icon: Gift },
    { href: "/shop/blog", l: "Guides", icon: BookOpen },
    { href: "/shop/cart", l: "Cart", icon: null },
  ];
  return (
    <>
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden" />
      <nav aria-label="Store quick links" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="grid h-16 grid-cols-5">
          {items.map((it) => {
            const active = it.href === "/shop" ? pathname === "/shop" : pathname.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href} className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-amber-300" : "text-white/60"}`}>
                {it.icon ? <it.icon className="h-5 w-5" /> : <CartIcon />}
                {it.l}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
