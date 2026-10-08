"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Priced } from "@/lib/shop/pricing";
import type { Category } from "@/lib/shop/types";
import { ProductCard } from "./cards";

type Sort = "popular" | "discount" | "price-asc" | "price-desc";

/** Search, filter by category and sort — all in the browser, the list is small. */
export function ProductBrowser({ products, categories, fixedCategory }: { products: Priced[]; categories: Category[]; fixedCategory?: string }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState(fixedCategory ?? params.get("c") ?? "");
  const [sort, setSort] = useState<Sort>("popular");
  const [inStock, setInStock] = useState(false);

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = products.filter((p) => {
      if (cat && p.category?.slug !== cat) return false;
      if (inStock && p.stock <= 0) return false;
      const hay = `${p.name} ${p.brand} ${p.category?.name ?? ""} ${p.shortDescription} ${p.flavours.join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    const by: Record<Sort, (a: Priced, b: Priced) => number> = {
      popular: (a, b) => Number(b.featured) - Number(a.featured) || Number(b.stock > 0) - Number(a.stock > 0),
      discount: (a, b) => b.discount - a.discount,
      "price-asc": (a, b) => a.salePrice - b.salePrice,
      "price-desc": (a, b) => b.salePrice - a.salePrice,
    };
    return out.sort(by[sort]);
  }, [products, q, cat, sort, inStock]);

  return (
    <div>
      <div className="sticky top-[4.25rem] z-30 -mx-4 mb-5 border-b border-white/10 bg-ink/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search whey, creatine, BCAA…" className="h-11 w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 text-white outline-none focus:border-amber-300" />
          </label>
          <div className="flex gap-2">
            {!fixedCategory && (
              <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white sm:flex-none">
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white sm:flex-none">
              <option value="popular">Popular</option>
              <option value="discount">Biggest discount</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>
        <label className="mt-2 inline-flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-amber-400" /> In stock only
        </label>
      </div>
      <p className="mb-3 text-sm text-white/50">
        {list.length} product{list.length === 1 ? "" : "s"}
      </p>
      {list.length === 0 ? (
        <p className="rounded-3xl border border-white/10 p-10 text-center text-white/60">No products match. Try another search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} p={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
