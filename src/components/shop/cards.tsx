import Link from "next/link";
import { Gift } from "lucide-react";
import type { Priced, PricedCombo } from "@/lib/shop/pricing";
import { AddToCart, OffBadge, Price, ProductImage } from "./ui";
import { inr } from "@/lib/shop/format";

export function ProductCard({ p, priority = false }: { p: Priced; priority?: boolean }) {
  const out = p.stock <= 0;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-steel/70 to-coal transition hover:border-amber-300/40">
      <Link href={`/shop/p/${p.slug}`} className="relative block aspect-square bg-white/[.03]">
        <ProductImage src={p.images[0]} alt={p.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={priority} className="p-4 transition duration-500 group-hover:scale-105" />
        <OffBadge pct={p.discount} className="absolute left-3 top-3" />
        {out && <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/70 py-1 text-center text-xs font-bold text-white">Out of stock</span>}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {p.brand && <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">{p.brand}</p>}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-white sm:text-base">
          <Link href={`/shop/p/${p.slug}`} className="hover:text-amber-200">
            {p.name}
          </Link>
        </h3>
        {p.size && <p className="text-xs text-white/45">{p.size}</p>}
        <div className="mt-2 flex-1">
          <Price sale={p.salePrice} list={p.listPrice} size="sm" />
        </div>
        <AddToCart line={{ kind: "product", id: p.id, qty: 1, flavour: p.flavours[0] }} name={p.name} disabled={out} label="Add" className="mt-3 w-full !py-2.5" />
      </div>
    </article>
  );
}

export function ComboCard({ c }: { c: PricedCombo }) {
  const pct = c.listTotal > 0 ? Math.round(((c.listTotal - c.price) / c.listTotal) * 100) : 0;
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-500/15 via-coal to-coal p-5 shadow-[0_20px_60px_-30px_rgba(251,191,36,.5)]">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-black">
          <Gift className="h-3.5 w-3.5" /> Combo · extra {c.extraPct}% off
        </span>
        <OffBadge pct={pct} />
      </div>
      <h3 className="font-display mt-3 text-2xl text-white">
        <Link href={`/shop/combos/${c.slug}`} className="hover:text-amber-200">
          {c.name}
        </Link>
      </h3>
      <div className="mt-3 flex -space-x-3">
        {c.lines.slice(0, 5).map((l) => (
          <div key={l.product.id} className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-coal bg-white/10">
            <ProductImage src={l.product.images[0]} alt={l.product.name} sizes="64px" className="p-1" />
          </div>
        ))}
      </div>
      <ul className="mt-3 flex-1 space-y-1 text-sm text-white/75">
        {c.lines.map((l) => (
          <li key={l.product.id} className="flex justify-between gap-3">
            <span className="truncate">
              {l.qty > 1 ? `${l.qty} × ` : ""}
              {l.product.name}
            </span>
            <span className="shrink-0 text-white/40 line-through">{inr(l.product.listPrice * l.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-end justify-between gap-3">
        <Price sale={c.price} list={c.listTotal} size="md" />
        <AddToCart line={{ kind: "combo", id: c.id, qty: 1 }} name={c.name} disabled={!c.available} label="Add combo" />
      </div>
    </article>
  );
}
