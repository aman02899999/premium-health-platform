"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./useCart";

/** Floating cart button on the library pages. */
export function CartBar() {
  const { items } = useCart();
  const pathname = usePathname();
  if (items.length === 0 || pathname.startsWith("/library/checkout") || pathname.startsWith("/library/access")) return null;
  return (
    <Link
      href="/library/checkout"
      className="btn-brand fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 z-40 sm:bottom-5 flex items-center gap-2 rounded-full px-5 py-3.5 font-bold shadow-[0_12px_30px_-8px_rgba(232,57,75,.7)]"
    >
      <ShoppingBag className="h-5 w-5" /> Checkout
      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-brand">{items.length}</span>
    </Link>
  );
}
