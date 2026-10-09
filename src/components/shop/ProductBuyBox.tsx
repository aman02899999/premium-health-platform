"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, Zap } from "lucide-react";
import { useCart } from "./cart";
import { AddToCart, OffBadge, Price, ProductImage } from "./ui";

type Props = { id: string; name: string; images: string[]; flavours: string[]; stock: number; sale: number; list: number; discount: number };

export function ProductGallery({ images, name, discount }: { images: string[]; name: string; discount: number }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[.06] to-transparent">
        <ProductImage src={images[i]} alt={i === 0 ? name : `${name} — photo ${i + 1}`} sizes="(max-width: 1024px) 100vw, 50vw" priority className="p-6" />
        <OffBadge pct={discount} className="absolute left-4 top-4 scale-125" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, k) => (
            <button key={src + k} type="button" onClick={() => setI(k)} aria-label={`Show photo ${k + 1}`} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white/5 ${k === i ? "border-amber-300" : "border-transparent"}`}>
              <ProductImage src={src} alt="" sizes="64px" className="p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductBuyBox(p: Props) {
  const router = useRouter();
  const cart = useCart();
  const [flavour, setFlavour] = useState(p.flavours[0]);
  const [qty, setQty] = useState(1);
  const out = p.stock <= 0;
  const max = Math.min(20, Math.max(1, p.stock));
  const line = { kind: "product" as const, id: p.id, qty, flavour };
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.03] p-5">
      <Price sale={p.sale} list={p.list} size="lg" />
      <p className="mt-1 text-xs text-white/45">Inclusive of all taxes</p>
      {p.flavours.length > 0 && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold text-white/80">Flavour</legend>
          <div className="flex flex-wrap gap-2">
            {p.flavours.map((f) => (
              <button key={f} type="button" onClick={() => setFlavour(f)} aria-pressed={f === flavour} className={`rounded-full px-4 py-2 text-sm ring-1 ${f === flavour ? "bg-amber-400 font-bold text-black ring-amber-400" : "text-white/80 ring-white/15 hover:ring-white/30"}`}>
                {f}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="mt-5 flex items-center gap-3">
        <span className="text-sm font-semibold text-white/80">Qty</span>
        <div className="flex items-center rounded-full ring-1 ring-white/15">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 text-white" aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-bold text-white" aria-live="polite">
            {qty}
          </span>
          <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} className="p-3 text-white" aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className={`text-xs ${out ? "text-red-300" : p.stock <= 5 ? "text-amber-300" : "text-emerald-300"}`}>{out ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <AddToCart line={line} name={p.name} disabled={out} />
        <button
          type="button"
          disabled={out}
          onClick={() => {
            cart.add(line);
            router.push("/shop/checkout");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-black text-black transition active:scale-[.97] disabled:opacity-40"
        >
          <Zap className="h-4 w-4" /> Buy now
        </button>
      </div>
      {/* Phones: price and add-to-cart stay on screen above the bottom navigation. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-amber-300/20 bg-ink/95 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl leading-none text-white">₹{p.sale.toLocaleString("en-IN")}</p>
          {p.list > p.sale && (
            <p className="mt-0.5 text-[11px] text-white/45">
              <s>₹{p.list.toLocaleString("en-IN")}</s> <b className="text-emerald-300">{Math.round(((p.list - p.sale) / p.list) * 100)}% off</b>
              {flavour ? ` · ${flavour}` : ""}
            </p>
          )}
        </div>
        <AddToCart line={line} name={p.name} disabled={out} className="!px-6" />
      </div>
    </div>
  );
}
