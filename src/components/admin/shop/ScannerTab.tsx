"use client";

/* eslint-disable @next/next/no-img-element -- admin previews of arbitrary image URLs */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, ClipboardList, Link2, Loader2, Minus, PackagePlus, Pencil, Plus, ScanLine } from "lucide-react";
import { parseScan, type Scan } from "@/lib/shop/scan-code";
import type { Priced } from "@/lib/shop/pricing";
import { CameraScanner } from "./CameraScanner";
import { ProductEditor, blank, type Draft } from "./CatalogTabs";
import { Card, Label, inr, shopPost, when, type ShopData } from "./common";

type Done = (m: string) => Promise<void>;
type Suggestion = { name: string; brand: string; image: string; source: string } | null;
type Result =
  | { kind: "found"; scan: Scan; product: Priced; variant: string }
  | { kind: "new"; scan: Scan; suggestion: Suggestion }
  | { kind: "editing"; draft: Draft; barcode?: { code: string; variant: string } };
type Move = { id: number; at: string; delta: number; stockAfter: number; reason: string; note: string };

const REASON_LABEL: Record<string, string> = {
  "stock-in": "Stock in",
  count: "Shelf count",
  sold: "Sold at counter",
  damaged: "Damaged / expired",
  returned: "Returned",
  "online-order": "Online order",
  edit: "Edited in form",
  "new-product": "New product",
  other: "Other",
};
const COUNT_KEY = "rfc-shop-count";
const toDraft = (p: Priced): Draft => ({ ...p, discountPct: p.discountPct ?? "", sku: p.sku ?? "", seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "" });

/** Scan a pack to open it, add it, or count the shelf. Works with the camera, a handheld scanner or typing. */
export function ScannerTab({ data, done }: { data: ShopData; done: Done }) {
  const [mode, setMode] = useState<"look" | "count">("look");
  const [camera, setCamera] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => new Map(data.products.map((p) => [p.id, p])), [data.products]);
  const byCode = useMemo(() => new Map(data.barcodes.map((b) => [b.code, b])), [data.barcodes]);

  // Shelf count: product id → units counted. Kept on this device so a reload mid-count loses nothing.
  const [counted, setCounted] = useState<Record<string, number>>({});
  const [unknown, setUnknown] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COUNT_KEY) ?? "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore an unfinished count once
      if (saved && typeof saved === "object") setCounted(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(COUNT_KEY, JSON.stringify(counted));
    } catch {}
  }, [counted]);

  const handle = useCallback(
    async (raw: string) => {
      setErr("");
      const scan = parseScan(raw);
      if (!scan) return setErr("That code is too short. Scan again or type the numbers under the barcode.");
      const known = byCode.get(scan.code);
      if (mode === "count") {
        if (known && byId.has(known.productId)) setCounted((c) => ({ ...c, [known.productId]: (c[known.productId] ?? 0) + 1 }));
        else setUnknown((u) => (u.includes(scan.code) ? u : [scan.code, ...u]));
        return;
      }
      if (known && byId.has(known.productId)) return setResult({ kind: "found", scan, product: byId.get(known.productId)!, variant: known.variant });
      setBusy(true);
      try {
        const r = await shopPost<{ match: { productId: string; variant: string } | null; suggestion: Suggestion; scan: Scan }>({ action: "scan", code: scan.code });
        const p = r.match ? byId.get(r.match.productId) : undefined;
        setResult(p && r.match ? { kind: "found", scan: r.scan, product: p, variant: r.match.variant } : { kind: "new", scan: r.scan, suggestion: r.suggestion });
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [byCode, byId, mode],
  );

  // After a save the catalogue reloads: show the fresh numbers for the product on screen.
  const shown = result?.kind === "found" ? { ...result, product: byId.get(result.product.id) ?? result.product } : result;

  if (shown?.kind === "editing")
    return <ProductEditor key={shown.draft.id ?? "scan-new"} initial={shown.draft} data={data} barcode={shown.barcode} close={() => setResult(null)} done={done} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Scanner mode">
        {[
          { id: "look" as const, label: "Scan a product", icon: ScanLine },
          { id: "count" as const, label: "Shelf count", icon: ClipboardList },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => {
              setMode(m.id);
              setResult(null);
              setErr("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${mode === m.id ? "bg-amber-400 text-black" : "border border-white/15 text-white/75"}`}
          >
            <m.icon className="h-4 w-4" /> {m.label}
          </button>
        ))}
      </div>

      <Card>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!typed.trim()) return;
            void handle(typed);
            setTyped("");
            input.current?.focus();
          }}
        >
          <input
            ref={input}
            autoFocus
            className="field flex-1 font-mono"
            inputMode="numeric"
            enterKeyHint="go"
            autoComplete="off"
            placeholder="Scan, or type the numbers under the barcode"
            aria-label="Barcode"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          <button type="submit" className="rounded-xl bg-amber-400 px-4 text-sm font-black text-black">
            Go
          </button>
          <button type="button" onClick={() => setCamera((c) => !c)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 text-sm ${camera ? "border-amber-400 text-amber-200" : "border-white/15 text-white/75"}`} aria-pressed={camera} aria-label="Camera">
            <Camera className="h-4 w-4" /> <span className="hidden sm:inline">Camera</span>
          </button>
        </form>
        <p className="mt-2 text-xs text-white/45">A USB or Bluetooth barcode scanner works too: click the box and scan.</p>
        {camera && (
          <div className="mt-3">
            <CameraScanner onCode={(c) => void handle(c)} onClose={() => setCamera(false)} />
          </div>
        )}
        {busy && (
          <p className="mt-3 flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking it up…
          </p>
        )}
        {err && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-500/15 p-3 text-sm text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
          </p>
        )}
      </Card>

      {mode === "look" && shown?.kind === "found" && <FoundPanel key={shown.product.id} product={shown.product} scan={shown.scan} variant={shown.variant} edit={() => setResult({ kind: "editing", draft: toDraft(shown.product) })} done={done} />}
      {mode === "look" && shown?.kind === "new" && (
        <NewCodePanel
          key={shown.scan.code}
          scan={shown.scan}
          suggestion={shown.suggestion}
          data={data}
          done={done}
          create={(variant) =>
            setResult({
              kind: "editing",
              draft: { ...blank(data.categories[0]?.id ?? null), name: shown.suggestion?.name ?? "", brand: shown.suggestion?.brand || "Blackkwolf", active: false },
              barcode: { code: shown.scan.code, variant },
            })
          }
          linked={(productId, variant) => setResult({ kind: "found", scan: shown.scan, product: byId.get(productId)!, variant })}
        />
      )}
      {mode === "look" && !shown && (
        <Card>
          <p className="text-sm text-white/60">
            Scan any pack. If it&apos;s already in the store, it opens with its stock and price. If it&apos;s new, you can put the barcode on one of your products or add it as a new product.
          </p>
          <p className="mt-2 text-sm text-white/45">
            {data.barcodes.length} barcode(s) saved · {data.products.filter((p) => !data.barcodes.some((b) => b.productId === p.id)).length} product(s) still without one.
          </p>
        </Card>
      )}

      {mode === "count" && <CountPanel data={data} counted={counted} setCounted={setCounted} unknown={unknown} clearUnknown={() => setUnknown([])} done={done} />}
    </div>
  );
}

function Price({ p }: { p: Priced }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <b className="text-amber-200">{inr(p.salePrice)}</b>
      {p.discount > 0 && <s className="text-xs text-white/40">MRP {inr(p.listPrice)}</s>}
      {p.discount > 0 && <span className="text-xs text-emerald-300">{p.discount}% off</span>}
    </span>
  );
}

function FoundPanel({ product: p, scan, variant, edit, done }: { product: Priced; scan: Scan; variant: string; edit: () => void; done: Done }) {
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState<"stock-in" | "returned" | "sold" | "damaged" | "other">("stock-in");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [moves, setMoves] = useState<Move[] | null>(null);

  const loadMoves = useCallback(async () => {
    try {
      const r = await shopPost<{ moves: Move[] }>({ action: "moves", productId: p.id });
      setMoves(r.moves);
    } catch {
      setMoves([]);
    }
  }, [p.id]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load this product's history once
    void loadMoves();
  }, [loadMoves]);

  const adds = reason === "stock-in" || reason === "returned";
  async function save() {
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) return setErr("Enter how many units.");
    setBusy(true);
    setErr("");
    try {
      await shopPost({ action: "stock", productId: p.id, qty: adds ? n : -n, reason, note });
      setNote("");
      setQty("1");
      await done(`${adds ? "Added" : "Took out"} ${n} × ${p.name}`);
      await loadMoves();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex gap-4">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">{p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-black/40">No photo</span>}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg leading-tight">{p.name}</h2>
          <p className="mt-0.5 text-xs text-white/50">
            {[variant, p.size].filter(Boolean).join(" · ")} <span className="font-mono">{scan.code}</span>
          </p>
          <div className="mt-1">
            <Price p={p} />
          </div>
          <p className="mt-1 text-sm">
            <b className={p.stock === 0 ? "text-red-300" : p.stock <= 5 ? "text-amber-200" : "text-white"}>{p.stock} in stock</b>
            {!p.active && <span className="ml-2 rounded bg-white/10 px-1.5 text-xs text-white/60">Hidden from store</span>}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px]">
        <Label label="What happened">
          <select className="field" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
            <option value="stock-in">New stock arrived (+)</option>
            <option value="returned">Customer returned it (+)</option>
            <option value="sold">Sold at the counter (−)</option>
            <option value="damaged">Damaged or expired (−)</option>
            <option value="other">Other (−)</option>
          </select>
        </Label>
        <Label label="Units">
          <div className="flex">
            <button type="button" onClick={() => setQty(String(Math.max(1, (Number(qty) || 1) - 1)))} className="rounded-l-xl border border-white/15 px-2.5" aria-label="One less">
              <Minus className="h-4 w-4" />
            </button>
            <input className="field rounded-none text-center" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} aria-label="Units" />
            <button type="button" onClick={() => setQty(String((Number(qty) || 0) + 1))} className="rounded-r-xl border border-white/15 px-2.5" aria-label="One more">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </Label>
        <Label label="Note (optional)" wide>
          <input className="field" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Distributor bill no., batch, expiry…" />
        </Label>
      </div>
      {err && <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{err}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-black disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {adds ? "Add to stock" : "Take out of stock"}
        </button>
        <button type="button" onClick={edit} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80">
          <Pencil className="h-4 w-4" /> Edit price, details, show/hide
        </button>
      </div>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/55">Stock history</h3>
      {moves === null ? (
        <p className="mt-2 text-sm text-white/45">Loading…</p>
      ) : moves.length === 0 ? (
        <p className="mt-2 text-sm text-white/45">No changes recorded yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-white/5 text-sm">
          {moves.map((m) => (
            <li key={m.id} className="flex items-baseline gap-3 py-2">
              <span className={`w-14 shrink-0 font-mono ${m.delta > 0 ? "text-emerald-300" : "text-red-300"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
              <span className="min-w-0 flex-1">
                {REASON_LABEL[m.reason] ?? m.reason}
                {m.note && <span className="text-white/50"> · {m.note}</span>}
              </span>
              <span className="shrink-0 text-xs text-white/45">
                → {m.stockAfter} · {when(m.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function NewCodePanel({ scan, suggestion, data, done, create, linked }: { scan: Scan; suggestion: Suggestion; data: ShopData; done: Done; create: (variant: string) => void; linked: (productId: string, variant: string) => void }) {
  const without = data.products.filter((p) => !data.barcodes.some((b) => b.productId === p.id));
  const [productId, setProductId] = useState(without[0]?.id ?? data.products[0]?.id ?? "");
  const [variant, setVariant] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const others = data.products.filter((p) => !without.includes(p));

  async function link() {
    if (!productId) return;
    setBusy(true);
    setErr("");
    try {
      await shopPost({ action: "link-barcode", code: scan.code, productId, variant });
      await done("Barcode saved");
      linked(productId, variant);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display text-lg">New barcode</h2>
      <p className="mt-1 font-mono text-sm text-white/70">{scan.code}</p>
      {!scan.checksumOk && (
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> This number doesn&apos;t add up as a barcode, so it was probably misread. Scan it again before saving.
        </p>
      )}
      {scan.kind === "qr" && <p className="mt-2 text-sm text-white/55">This is a QR code, not a product barcode. You can still save it on a product, but the barcode on the pack is better.</p>}
      {suggestion ? (
        <div className="mt-3 flex gap-3 rounded-xl border border-white/10 p-3 text-sm">
          {suggestion.image && <img src={suggestion.image} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-white object-contain" />}
          <div className="min-w-0">
            <p className="text-white/85">
              Open Food Facts says: <b>{suggestion.name}</b>
              {suggestion.brand && ` (${suggestion.brand})`}
            </p>
            <p className="mt-1 text-xs text-white/45">Free public database. Check it against the pack; upload your own photo.</p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-white/50">Not found in the free product database (common for supplements). You type the details once; every scan after that is instant.</p>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Link2 className="h-4 w-4 text-amber-300" /> It&apos;s one of my products
          </h3>
          <div className="mt-3 space-y-3">
            <Label label="Product">
              <select className="field" value={productId} onChange={(e) => setProductId(e.target.value)}>
                {without.length > 0 && (
                  <optgroup label="No barcode yet">
                    {without.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {others.length > 0 && (
                  <optgroup label="Already has a barcode (add another flavour/size)">
                    {others.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </Label>
            <Label label="Flavour / size of this pack (optional)">
              <input className="field" value={variant} maxLength={60} onChange={(e) => setVariant(e.target.value)} placeholder="Chocolate 2 kg" />
            </Label>
            {err && <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{err}</p>}
            <button type="button" disabled={busy || !productId} onClick={link} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save barcode on this product
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <PackagePlus className="h-4 w-4 text-amber-300" /> It&apos;s a new product
          </h3>
          <p className="mt-2 text-sm text-white/60">Opens the product form with this barcode attached. You set the MRP, discount, stock, photos and details. It starts hidden from the store until you tick &ldquo;Show on store&rdquo;.</p>
          <button type="button" onClick={() => create(variant)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-400/60 px-4 py-2.5 text-sm font-semibold text-amber-200">
            <Plus className="h-4 w-4" /> Add as new product
          </button>
        </div>
      </div>
    </Card>
  );
}

function CountPanel({
  data,
  counted,
  setCounted,
  unknown,
  clearUnknown,
  done,
}: {
  data: ShopData;
  counted: Record<string, number>;
  setCounted: (f: (c: Record<string, number>) => Record<string, number>) => void;
  unknown: string[];
  clearUnknown: () => void;
  done: Done;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const rows = data.products.filter((p) => counted[p.id] !== undefined);
  const notYet = data.products.filter((p) => counted[p.id] === undefined && p.active);
  const set = (id: string, n: number) => setCounted((c) => ({ ...c, [id]: Math.max(0, n) }));

  async function save() {
    if (!rows.length) return;
    if (!confirm(`Set the stock of ${rows.length} product(s) to the numbers you counted?`)) return;
    setBusy(true);
    setErr("");
    try {
      const r = await shopPost<{ changed: number }>({ action: "count", counts: rows.map((p) => ({ productId: p.id, qty: counted[p.id] })), note });
      setCounted(() => ({}));
      clearUnknown();
      await done(`Count saved: ${r.changed} product(s) changed`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-white/65">Scan every pack on the shelf, one by one. Each scan adds 1. Fix any number with − / +, then save. Only the products you counted change.</p>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">Nothing counted yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{p.name}</span>
                  <span className={`text-xs ${counted[p.id] === p.stock ? "text-white/45" : "text-amber-200"}`}>
                    System says {p.stock}
                    {counted[p.id] !== p.stock && ` · will change by ${counted[p.id] - p.stock > 0 ? "+" : ""}${counted[p.id] - p.stock}`}
                  </span>
                </span>
                <button type="button" onClick={() => set(p.id, counted[p.id] - 1)} className="rounded-lg border border-white/15 p-2" aria-label={`One less ${p.name}`}>
                  <Minus className="h-4 w-4" />
                </button>
                <input className="field w-16 text-center" inputMode="numeric" value={counted[p.id]} onChange={(e) => set(p.id, Number(e.target.value.replace(/\D/g, "")) || 0)} aria-label={`Counted ${p.name}`} />
                <button type="button" onClick={() => set(p.id, counted[p.id] + 1)} className="rounded-lg border border-white/15 p-2" aria-label={`One more ${p.name}`}>
                  <Plus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {unknown.length > 0 && (
          <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-100">
            {unknown.length} barcode(s) aren&apos;t on any product yet: <span className="font-mono">{unknown.slice(0, 5).join(", ")}</span>
            {unknown.length > 5 && "…"}. Switch to &ldquo;Scan a product&rdquo; to save them, then count those again.
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Label label="Note (optional)">
            <input className="field" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Month-end count" />
          </Label>
          <div className="flex gap-2">
            <button type="button" disabled={busy || !rows.length} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-black disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save count
            </button>
            {rows.length > 0 && (
              <button type="button" onClick={() => confirm("Clear this count and start again?") && setCounted(() => ({}))} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70">
                Start again
              </button>
            )}
          </div>
        </div>
        {err && <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-100">{err}</p>}
      </Card>
      {notYet.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-white/55">Not counted yet ({notYet.length})</h3>
          <p className="mt-1 text-xs text-white/45">None of these on the shelf? Tap it to add it to the count at 0.</p>
          <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {notYet.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => set(p.id, 0)} className="rounded-full border border-white/10 px-2.5 py-1 text-white/65 hover:border-white/30" title="Add to the count at 0">
                  {p.name} · {p.stock}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
