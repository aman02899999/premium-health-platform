"use client";

import { useState } from "react";
import { ScanLine, Search } from "lucide-react";

export function BarcodeScanner() {
  const [code, setCode] = useState("8901030875020");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lookup = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch(`/api/health/food?barcode=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="flex items-center gap-2 text-sm font-bold"><ScanLine className="h-4 w-4 text-sky-600" /> Barcode Scanner — OFF + USDA (Unique)</h3>
      <p className="mt-1 text-[11px] text-stone-500">Scan packaged foods sold in India (890… prefix = India). Uses Open Food Facts — no key required. Educational.</p>

      <div className="mt-3 flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter barcode (e.g. 890…)" className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800" />
        <button onClick={lookup} disabled={loading} className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Search className="mr-1 inline h-4 w-4" /> {loading ? "…" : "Lookup"}</button>
      </div>

      {err && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30">{err}</p>}

      {result && (
        <div className="mt-4 rounded-2xl bg-stone-50 p-4 dark:bg-stone-800/60">
          {result.data?.length ? (
            <>
              <p className="text-sm font-bold">{result.data[0].name}</p>
              <p className="mt-1 text-[12px] text-stone-600 dark:text-stone-300">{result.data[0].description}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="font-bold">{result.data[0].nutrients?.calories ?? "—"} kcal</p><p>per 100g</p></div>
                <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="font-bold">{result.data[0].nutrients?.sugar ?? "—"}g sugar</p><p>NutriScore {result.data[0].metadata?.nutriScore ?? "—"}</p></div>
                <div className="rounded-xl bg-white p-2 dark:bg-stone-900"><p className="font-bold">{result.data[0].metadata?.novaGroup ? `NOVA ${result.data[0].metadata.novaGroup}` : "—"}</p><p>processing</p></div>
              </div>
              <p className="mt-2 text-[11px] text-stone-400">Source: {result.data[0].source} · License: {result.data[0].license ?? "—"} · Provenance preserved</p>
            </>
          ) : (
            <p className="text-sm text-stone-600">No product for {code} in OFF cache. Try another 890… code or search by name at /food-database.</p>
          )}
          <p className="mt-2 text-[11px] text-stone-400">Cache {result.cached ? "hit" : "miss"} · {result.durationMs}ms · Disclaimer: packaged data may be inaccurate, check label.</p>
        </div>
      )}

      <p className="mt-3 text-[11px] text-stone-400">India insight: Many 890… products not in OFF — we fallback to USDA search by name. Future: add FSSAI label OCR.</p>
    </div>
  );
}
