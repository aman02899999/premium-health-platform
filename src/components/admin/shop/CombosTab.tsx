"use client";

/* eslint-disable @next/next/no-img-element -- admin previews of arbitrary image URLs */
import { useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { ImageInput } from "@/components/admin/fields";
import { applyPct } from "@/lib/shop/pricing";
import { slugify } from "@/lib/shop/defaults";
import type { ComboItem } from "@/lib/shop/types";
import { Card, Empty, Label, SaveBar, Toggle, inr, shopPost, type ShopData } from "./common";

type Draft = { id?: string; slug: string; name: string; description: string; image: string | null; items: ComboItem[]; extraPct: number; featured: boolean; active: boolean };
const blank = (): Draft => ({ slug: "", name: "", description: "", image: null, items: [], extraPct: 10, featured: true, active: true });

export function CombosTab({ data, done }: { data: ShopData; done: (m: string) => Promise<void> }) {
  const [edit, setEdit] = useState<Draft | null>(null);
  if (edit) return <ComboEditor key={edit.id ?? "new"} initial={edit} data={data} close={() => setEdit(null)} done={done} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEdit(blank())} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black">
          <Plus className="h-4 w-4" /> New combo
        </button>
        <p className="text-sm text-white/55">Combo price = sale prices added up, minus the extra combo %. It updates by itself when prices change.</p>
      </div>
      {data.combos.length === 0 ? (
        <Empty>No combos yet. Use “New combo” → “Fill to ₹5000” to let the builder pick products that add up to the amount.</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.combos.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setEdit({ id: c.id, slug: c.slug, name: c.name, description: c.description, image: c.image, items: c.items, extraPct: c.extraPct, featured: c.featured, active: c.active })} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-amber-400/40">
                <span className="flex items-start justify-between gap-3">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-right">
                    <b className="block text-lg text-amber-200">{inr(c.price)}</b>
                    <s className="text-xs text-white/40">{inr(c.listTotal)}</s>
                  </span>
                </span>
                <span className="mt-2 block text-xs text-white/55">{c.lines.map((l) => `${l.qty} × ${l.product.name}`).join(" · ")}</span>
                <span className="mt-2 flex gap-2 text-[11px]">
                  {!c.available && <span className="rounded bg-red-500/20 px-1.5 text-red-200">Not available — a product is hidden or out of stock</span>}
                  {!c.active && <span className="rounded bg-white/10 px-1.5 text-white/60">Hidden</span>}
                  <span className="text-white/45">+{c.extraPct}% extra off</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ComboEditor({ initial, data, close, done }: { initial: Draft; data: ShopData; close: () => void; done: (m: string) => Promise<void> }) {
  const [c, setC] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [err, setErr] = useState("");
  const [target, setTarget] = useState("5000");
  const [pick, setPick] = useState("");
  const byId = useMemo(() => new Map(data.products.map((p) => [p.id, p])), [data.products]);
  const lines = c.items.map((i) => ({ ...i, product: byId.get(i.productId) }));
  const list = lines.reduce((s, l) => s + (l.product?.listPrice ?? 0) * l.qty, 0);
  const saleTotal = lines.reduce((s, l) => s + (l.product?.salePrice ?? 0) * l.qty, 0);
  const price = applyPct(saleTotal, c.extraPct);

  async function suggest() {
    setSuggesting(true);
    setErr("");
    try {
      const r = await shopPost<{ suggestion: { productIds: string[]; price: number } }>({ action: "suggest-combo", target: Number(target), extraPct: c.extraPct });
      const amount = Number(target);
      setC((x) => ({
        ...x,
        items: r.suggestion.productIds.map((productId) => ({ productId, qty: 1 })),
        name: x.name || `₹${amount.toLocaleString("en-IN")} Combo`,
        slug: x.slug || `combo-${amount}`,
      }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSuggesting(false);
    }
  }

  async function save() {
    setBusy(true);
    setErr("");
    try {
      await shopPost({ action: "save-combo", ...c, slug: c.slug || slugify(c.name) });
      await done(`Saved ${c.name}`);
      close();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display mb-4 text-xl">{c.id ? "Edit combo" : "New combo"}</h2>

      <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
          <Sparkles className="h-4 w-4" /> Build to a price
        </p>
        <p className="mt-1 text-xs text-white/55">Picks in-stock products whose sale prices, after the extra combo %, come as close as possible to the amount without going over.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {["3000", "4000", "5000"].map((t) => (
            <button key={t} type="button" onClick={() => setTarget(t)} className={`rounded-full px-3 py-1.5 text-sm ${target === t ? "bg-amber-400 font-bold text-black" : "bg-white/10"}`}>
              ₹{Number(t).toLocaleString("en-IN")}
            </button>
          ))}
          <input className="field w-28 text-sm" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} aria-label="Target amount" />
          <button type="button" onClick={suggest} disabled={suggesting} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-60">
            {suggesting && <Loader2 className="h-4 w-4 animate-spin" />} Fill combo
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={l.productId} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">{l.product?.images[0] && <img src={l.product.images[0]} alt="" className="h-full w-full object-contain" />}</span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="line-clamp-1">{l.product?.name ?? "Deleted product"}</span>
              <span className="text-xs text-white/50">
                {l.product ? `${inr(l.product.salePrice)} each · MRP ${inr(l.product.listPrice)}` : ""}
                {l.product && l.product.stock < l.qty && <b className="text-red-300"> · only {l.product.stock} in stock</b>}
              </span>
            </span>
            <select className="field w-16 text-sm" value={l.qty} onChange={(e) => setC({ ...c, items: c.items.map((x, k) => (k === i ? { ...x, qty: Number(e.target.value) } : x)) })} aria-label="Quantity">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button type="button" onClick={() => setC({ ...c, items: c.items.filter((_, k) => k !== i) })} className="rounded-lg p-2 text-white/60 hover:text-red-200" aria-label="Remove">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <select className="field text-sm" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Add a product">
            <option value="">Add a product…</option>
            {data.products
              .filter((p) => !c.items.some((i) => i.productId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {inr(p.salePrice)}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={!pick}
            onClick={() => {
              setC({ ...c, items: [...c.items, { productId: pick, qty: 1 }] });
              setPick("");
            }}
            className="rounded-xl border border-white/15 px-4 text-sm disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-black/30 p-4 text-center text-sm">
        <div>
          <p className="text-xs text-white/50">MRP total</p>
          <s className="text-white/60">{inr(list)}</s>
        </div>
        <div>
          <p className="text-xs text-white/50">After sale</p>
          <p>{inr(saleTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Combo price</p>
          <p className="font-display text-xl text-amber-200">{inr(price)}</p>
        </div>
        {list > 0 && <p className="col-span-3 text-xs text-emerald-300">Customer saves {inr(list - price)} ({Math.round(((list - price) / list) * 100)}% off MRP)</p>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Label label="Combo name">
          <input className="field" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="₹5000 Muscle Combo" />
        </Label>
        <Label label="Extra combo discount %" help="On top of the sale prices. 0–50.">
          <input className="field" inputMode="numeric" value={c.extraPct} onChange={(e) => setC({ ...c, extraPct: Math.min(50, Number(e.target.value.replace(/\D/g, "")) || 0) })} />
        </Label>
        <Label label="Description" wide>
          <textarea className="field" rows={3} value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} placeholder="Everything a beginner needs for the first 2 months…" />
        </Label>
        <Label label="Combo image (optional — product photos are used otherwise)" wide>
          <ImageInput value={c.image ?? ""} onChange={(v) => setC({ ...c, image: v || null })} />
        </Label>
        <Label label="URL name">
          <input className="field" value={c.slug} placeholder={slugify(c.name)} onChange={(e) => setC({ ...c, slug: slugify(e.target.value) })} />
        </Label>
        <div className="flex flex-col justify-center gap-3">
          <Toggle checked={c.active} onChange={(v) => setC({ ...c, active: v })} label="Show on store" />
          <Toggle checked={c.featured} onChange={(v) => setC({ ...c, featured: v })} label="Feature on home page" />
        </div>
      </div>
      {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
      <SaveBar
        busy={busy}
        onSave={save}
        onCancel={close}
        onDelete={
          c.id
            ? async () => {
                if (!confirm(`Delete “${c.name}”?`)) return;
                try {
                  await shopPost({ action: "delete", kind: "combo", id: c.id });
                  await done(`Deleted ${c.name}`);
                  close();
                } catch (e) {
                  setErr((e as Error).message);
                }
              }
            : undefined
        }
      />
    </Card>
  );
}
