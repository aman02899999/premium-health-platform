"use client";

import Link from "next/link";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/shop/cart";
import { useQuote } from "@/components/shop/useQuote";
import { ProductImage } from "@/components/shop/ui";
import { inr } from "@/lib/shop/format";

export default function CartPage() {
  const cart = useCart();
  const { quote, error, loading } = useQuote();

  if (cart.ready && cart.lines.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-white/20" />
        <h1 className="font-display mt-4 text-3xl text-white">Your cart is empty</h1>
        <p className="mt-2 text-white/60">Protein at up to 50% off is waiting.</p>
        <Link href="/shop/products" className="btn-gold mt-6 inline-flex rounded-full px-6 py-3 font-bold">
          Start shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="font-display mb-5 text-4xl text-white">Your cart</h1>
        {error && <p className="mb-4 rounded-2xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}
        <ul className="space-y-3">
          {cart.lines.map((l, i) => {
            const q = quote?.lines[i];
            return (
              <li key={`${l.kind}-${l.id}-${"flavour" in l ? l.flavour : ""}`} className={`flex gap-3 rounded-2xl border p-3 ${q?.problem ? "border-red-400/40 bg-red-500/5" : "border-white/10 bg-white/[.03]"}`}>
                <Link href={q?.slug ? (l.kind === "combo" ? `/shop/combos/${q.slug}` : `/shop/p/${q.slug}`) : "#"} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5">
                  <ProductImage src={q?.image} alt={q?.name ?? "Item"} sizes="80px" className="p-1" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-semibold text-white">{q?.name ?? "Loading…"}</p>
                  {q?.flavour && <p className="text-xs text-white/50">Flavour: {q.flavour}</p>}
                  {q?.contents && <p className="line-clamp-2 text-xs text-white/50">{q.contents.map((c) => `${c.qty > 1 ? `${c.qty}× ` : ""}${c.name}`).join(" + ")}</p>}
                  {q?.problem && <p className="mt-1 text-xs font-semibold text-red-300">{q.problem}</p>}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-full ring-1 ring-white/15">
                      <button type="button" onClick={() => cart.setQty(i, l.qty - 1)} className="p-2.5 text-white" aria-label="Decrease quantity">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-white">{l.qty}</span>
                      <button type="button" onClick={() => cart.setQty(i, l.qty + 1)} className="p-2.5 text-white" aria-label="Increase quantity">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {q && !q.problem && (
                      <p className="text-right">
                        <span className="font-bold text-white">{inr(q.lineTotal)}</span>{" "}
                        {q.lineList > q.lineTotal && <span className="text-xs text-white/40 line-through">{inr(q.lineList)}</span>}
                      </p>
                    )}
                    <button type="button" onClick={() => cart.remove(i)} className="p-2 text-white/40 hover:text-red-300" aria-label="Remove item">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <aside className="h-fit rounded-3xl border border-white/10 bg-white/[.03] p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl text-white">Summary</h2>
        {loading && !quote ? (
          <p className="mt-4 flex items-center gap-2 text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
          </p>
        ) : (
          quote && (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <dt>Regular price</dt>
                <dd className="line-through">{inr(quote.listTotal)}</dd>
              </div>
              <div className="flex justify-between font-semibold text-emerald-400">
                <dt>You save</dt>
                <dd>−{inr(quote.discountTotal)}</dd>
              </div>
              <div className="flex justify-between text-white/70">
                <dt>Delivery</dt>
                <dd>{quote.shipping ? inr(quote.shipping) : "FREE"}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold text-white">
                <dt>Total</dt>
                <dd>{inr(quote.total)}</dd>
              </div>
            </dl>
          )
        )}
        <Link
          href="/shop/checkout"
          aria-disabled={!quote || quote.total <= 0 || quote.problems.length > 0}
          className={`btn-gold mt-5 block rounded-full py-3.5 text-center font-bold ${!quote || quote.total <= 0 || quote.problems.length > 0 ? "pointer-events-none opacity-40" : ""}`}
        >
          Checkout securely
        </Link>
        {quote && quote.problems.length > 0 && <p className="mt-2 text-xs text-red-300">Fix the highlighted items to continue.</p>}
        <Link href="/shop/products" className="mt-3 block text-center text-sm text-white/60 hover:text-white">
          Continue shopping
        </Link>
      </aside>
    </section>
  );
}
