"use client";

import { useState } from "react";
import { ScanLine, Search } from "lucide-react";

type Product = {
  name: string;
  brand?: string;
  nutrients?: { calories?: number; sugar?: number; fat?: number; protein?: number; sodium?: number };
  nutriScore?: string;
  novaGroup?: number;
  provenance?: { source?: string; license?: string };
};

const fmt = (n?: number, digits = 1) => (typeof n === "number" ? String(Math.round(n * 10 ** digits) / 10 ** digits) : "—");

export function BarcodeScanner() {
  // An Indian (890…) product that Open Food Facts has, so the first lookup shows a real label.
  const [code, setCode] = useState("8901491101837");
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lookup = async () => {
    const clean = code.replace(/\D/g, "");
    setLoading(true);
    setErr(null);
    setProduct(null);
    setNotFound(null);
    try {
      if (clean.length < 8 || clean.length > 14) throw new Error("Enter the 8 to 14 digit number under the barcode.");
      const res = await fetch(`/health/api/health/food/${clean}`);
      if (res.status === 404) setNotFound(clean);
      else if (!res.ok) throw new Error("Couldn't reach the food database. Please try again in a minute.");
      else setProduct((await res.json()) as Product);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><ScanLine className="h-4 w-4 text-sky-600" /> Barcode Scanner</h3>
      <p className="mt-1 text-[11px] text-stone-500">Type the number under the barcode of any packaged food. Indian products start with 890. Data from Open Food Facts, for education only.</p>

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); lookup(); }}>
        <label htmlFor="barcode-input" className="sr-only">Barcode number</label>
        <input id="barcode-input" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter barcode (e.g. 890…)" className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800" />
        <button type="submit" disabled={loading} className="shrink-0 rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Search className="mr-1 inline h-4 w-4" /> {loading ? "…" : "Lookup"}</button>
      </form>

      {err && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30">{err}</p>}
      {notFound && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">We couldn&apos;t find {notFound} yet. Many Indian products aren&apos;t listed, so check the label on the pack, or search the food by name in the <a href="/health/food-database" className="font-bold underline">food database</a>.</p>}

      {product && (
        <div className="mt-4 rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60" aria-live="polite">
          <p className="text-sm font-bold">{product.name}</p>
          {product.brand && <p className="mt-0.5 text-[12px] text-stone-600 dark:text-stone-300">{product.brand}</p>}
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-sm font-bold">{fmt(product.nutrients?.calories, 0)} kcal</p><p>per 100 g</p></div>
            <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-sm font-bold">{fmt(product.nutrients?.sugar)} g</p><p>sugar per 100 g</p></div>
            <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-sm font-bold">{fmt(product.nutrients?.fat)} g</p><p>fat per 100 g</p></div>
            <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-sm font-bold">{fmt(product.nutrients?.protein)} g</p><p>protein per 100 g</p></div>
            <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-sm font-bold">{product.nutriScore ?? "—"}</p><p>Nutri-Score (A best, E worst)</p></div>
            <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="text-sm font-bold">{product.novaGroup ? `NOVA ${product.novaGroup}` : "—"}</p><p>processing (4 = ultra-processed)</p></div>
          </div>
          <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">Source: Open Food Facts (ODbL). Packaged food data can be out of date, so always check the label.</p>
        </div>
      )}
    </div>
  );
}
