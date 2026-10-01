"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { coverSrc, type Book } from "@/lib/library/catalog";

/** Book grid with section filter chips. */
export function LibraryGrid({ books, categories }: { books: Book[]; categories: readonly string[] }) {
  const [cat, setCat] = useState<string>("All");
  const shown = useMemo(() => (cat === "All" ? books : books.filter((b) => b.category === cat)), [books, cat]);
  const chip = (c: string) =>
    `rounded-full border px-4 py-2 text-sm transition ${cat === c ? "border-brand bg-brand text-white" : "border-white/15 text-white/70 hover:border-white/40"}`;
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by section">
        {["All", ...categories].map((c) => (
          <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={chip(c)}>
            {c}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((b) => (
          <li key={b.slug}>
            <Link href={`/library/${b.slug}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-[0_18px_40px_-20px_rgba(0,0,0,.8)] ring-1 ring-white/10 transition group-hover:-translate-y-1 group-hover:ring-brand/60">
                <Image src={coverSrc(b.volume)} alt={`${b.title} — cover`} fill sizes="(min-width:1024px) 22vw, (min-width:640px) 30vw, 45vw" className="object-cover" />
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-brand">{b.label}</p>
              <h3 className="font-display text-base leading-snug text-white">{b.title}</h3>
              <p className="mt-1 text-sm text-white/55">
                Vol. {b.volume} · {b.pages} pages · <span className="font-semibold text-white">₹{b.price}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
