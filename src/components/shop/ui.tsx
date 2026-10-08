"use client";

import { inr } from "@/lib/shop/format";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Package, ShoppingCart } from "lucide-react";
import { useCart } from "./cart";
import type { CartLine } from "@/lib/shop/types";

/** Optimised through Next for our own uploads; plain <img> for any other host an admin pasted. */
export function ProductImage({ src, alt, sizes, priority = false, className = "" }: { src: string | null | undefined; alt: string; sizes: string; priority?: boolean; className?: string }) {
  if (!src) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-steel to-coal ${className}`} aria-label={alt} role="img">
        <Package className="h-12 w-12 text-white/20" />
      </div>
    );
  }
  const optimisable = src.startsWith("/") || /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src);
  if (optimisable) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-contain ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element -- external host chosen by the admin
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={`absolute inset-0 h-full w-full object-contain ${className}`} />;
}

/** Offer price, crossed-out real price, and the saving. */
export function Price({ sale, list, size = "md" }: { sale: number; list: number; size?: "sm" | "md" | "lg" }) {
  const off = list > sale ? Math.round(((list - sale) / list) * 100) : 0;
  const big = size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-lg";
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className={`font-display ${big} text-white`}>{inr(sale)}</span>
        {off > 0 && <span className={`${size === "lg" ? "text-lg" : "text-sm"} text-white/40 line-through`}>{inr(list)}</span>}
        {off > 0 && <span className={`${size === "lg" ? "text-base" : "text-xs"} font-bold text-emerald-400`}>{off}% off</span>}
      </div>
      {off > 0 && size !== "sm" && <p className="text-xs text-amber-300">You save {inr(list - sale)}</p>}
    </div>
  );
}

export function OffBadge({ pct, className = "" }: { pct: number; className?: string }) {
  if (pct <= 0) return null;
  return (
    <span className={`inline-flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-2.5 py-1 leading-none text-black shadow-lg shadow-amber-500/30 ${className}`}>
      <span className="font-display text-lg">{pct}%</span>
      <span className="text-[9px] font-black tracking-widest">OFF</span>
    </span>
  );
}

export function AddToCart({ line, name, disabled, label = "Add to cart", className = "" }: { line: CartLine; name: string; disabled?: boolean; label?: string; className?: string }) {
  const cart = useCart();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        cart.add(line);
        cart.announce(name);
        setDone(true);
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-40 ${done ? "bg-emerald-500 text-white" : "btn-brand"} ${className}`}
    >
      {done ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
      {disabled ? "Out of stock" : done ? "Added" : label}
    </button>
  );
}

/** Small toast when something is added, with a link to the cart. */
export function CartToast() {
  const { lastAdded } = useCart();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!lastAdded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show on each add
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, [lastAdded]);
  if (!visible || !lastAdded) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white p-3 text-sm text-ink shadow-2xl sm:bottom-6">
      <Check className="h-5 w-5 shrink-0 text-emerald-600" />
      <span className="min-w-0 flex-1 truncate">
        <b>{lastAdded.name}</b> added to cart
      </span>
      <Link href="/shop/cart" className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white">
        View cart
      </Link>
    </div>
  );
}
