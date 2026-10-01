"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "./useCart";

/** "Buy now" (straight to checkout) + "Add to cart" for a book, bundle or the complete library. */
export function AddToCart({ id, buyLabel = "Buy now", stacked = false }: { id: string; buyLabel?: string; stacked?: boolean }) {
  const { add, has } = useCart();
  const router = useRouter();
  const inCart = has(id);
  const buyNow = () => {
    add(id);
    router.push("/library/checkout");
  };
  return (
    <div className={`flex gap-2 ${stacked ? "flex-col" : "flex-col sm:flex-row"}`}>
      <button type="button" onClick={buyNow} className="btn-brand flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 font-bold">
        <Zap className="h-4 w-4" /> {buyLabel}
      </button>
      {inCart ? (
        <Link href="/library/checkout" className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-emerald-400/50 px-5 py-3 font-semibold text-emerald-300">
          <Check className="h-4 w-4" /> In cart
        </Link>
      ) : (
        <button type="button" onClick={() => add(id)} className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 px-5 py-3 font-semibold text-white hover:border-white/50">
          <ShoppingBag className="h-4 w-4" /> Add to cart
        </button>
      )}
    </div>
  );
}
