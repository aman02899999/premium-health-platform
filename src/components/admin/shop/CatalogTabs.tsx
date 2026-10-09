"use client";

/* eslint-disable @next/next/no-img-element -- admin previews of arbitrary image URLs */
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { ImageInput } from "@/components/admin/fields";
import { applyPct } from "@/lib/shop/pricing";
import { slugify } from "@/lib/shop/defaults";
import type { Category, NutritionRow, Product } from "@/lib/shop/types";
import { Card, Empty, Label, SaveBar, Toggle, inr, shopPost, type ShopData } from "./common";

type Done = (m: string) => Promise<void>;
type Draft = Omit<Product, "id" | "updatedAt" | "discountPct"> & { id?: string; discountPct: number | "" };

const blank = (categoryId: string | null): Draft => ({
  slug: "",
  name: "",
  brand: "Blackwolf",
  categoryId,
  sku: "",
  listPrice: 0,
  discountPct: "",
  stock: 0,
  size: "",
  flavours: [],
  images: [],
  shortDescription: "",
  description: "",
  highlights: [],
  nutrition: [],
  howToUse: "",
  warnings: "",
  featured: false,
  active: true,
  seoTitle: "",
  seoDescription: "",
});

async function remove(kind: string, id: string, name: string, done: Done) {
  if (!confirm(`Delete “${name}”? This can't be undone.`)) return false;
  await shopPost({ action: "delete", kind, id });
  await done(`Deleted ${name}`);
  return true;
}

export function ProductsTab({ data, done }: { data: ShopData; done: Done }) {
  const [edit, setEdit] = useState<Draft | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const catName = useMemo(() => new Map(data.categories.map((c) => [c.id, c.name])), [data.categories]);
  const list = data.products.filter((p) => (!cat || p.categoryId === cat) && (!q || `${p.name} ${p.sku ?? ""} ${p.brand}`.toLowerCase().includes(q.toLowerCase())));

  if (edit) return <ProductEditor key={edit.id ?? "new"} initial={edit} data={data} close={() => setEdit(null)} done={done} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setEdit(blank(data.categories[0]?.id ?? null))} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black">
          <Plus className="h-4 w-4" /> New product
        </button>
        <select className="field w-auto text-sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input className="field w-full text-sm sm:ml-auto sm:w-60" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <Empty>{data.products.length ? "No products match." : "No products yet. Add the Blackwolf range with “New product”: name, real price (MRP), stock and photos. The sale price is worked out from the category discount."}</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setEdit({ ...p, discountPct: p.discountPct ?? "", sku: p.sku ?? "", seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "" })} className="flex w-full gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left hover:border-amber-400/40">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">{p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-black/40">No photo</span>}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-semibold">{p.name}</span>
                  <span className="mt-1 block text-xs text-white/50">{p.categoryId ? catName.get(p.categoryId) : "No category"}</span>
                  <span className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
                    <b className="text-amber-200">{inr(p.salePrice)}</b>
                    {p.discount > 0 && <s className="text-xs text-white/40">{inr(p.listPrice)}</s>}
                    {p.discount > 0 && <span className="text-xs text-emerald-300">{p.discount}% off</span>}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                    <span className={p.stock === 0 ? "text-red-300" : p.stock <= 5 ? "text-amber-200" : "text-white/50"}>{p.stock === 0 ? "Sold out" : `${p.stock} in stock`}</span>
                    {!p.active && <span className="rounded bg-white/10 px-1.5 text-white/60">Hidden</span>}
                    {p.featured && <span className="rounded bg-amber-400/20 px-1.5 text-amber-200">Featured</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductEditor({ initial, data, close, done }: { initial: Draft; data: ShopData; close: () => void; done: Done }) {
  const [p, setP] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setP((x) => ({ ...x, [k]: v }));
  const category = data.categories.find((c) => c.id === p.categoryId);
  const discount = p.discountPct === "" ? category?.discountPct ?? 0 : p.discountPct;
  const sale = applyPct(Number(p.listPrice) || 0, discount);

  async function save() {
    setBusy(true);
    setErr("");
    try {
      await shopPost({ action: "save-product", ...p, slug: p.slug || slugify(p.name) });
      await done(`Saved ${p.name}`);
      close();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const moveImg = (i: number, d: -1 | 1) => {
    const imgs = [...p.images];
    [imgs[i], imgs[i + d]] = [imgs[i + d], imgs[i]];
    set("images", imgs);
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl">{p.id ? "Edit product" : "New product"}</h2>
        {p.id && (
          <button type="button" onClick={() => setP({ ...p, id: undefined, name: `${p.name} (copy)`, slug: "", sku: "" })} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
        )}
        {p.id && p.slug && (
          <a href={`/shop/p/${p.slug}`} target="_blank" className="text-xs text-amber-300 underline">
            View on store
          </a>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Product name" wide>
          <input className="field" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Blackwolf 100% Whey Protein 2 kg" />
        </Label>
        <Label label="Brand">
          <input className="field" value={p.brand} onChange={(e) => set("brand", e.target.value)} />
        </Label>
        <Label label="Category">
          <select className="field" value={p.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)}>
            <option value="">— None —</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.discountPct}% off)
              </option>
            ))}
          </select>
        </Label>
        <Label label="Real price / MRP (₹)" help="Shown crossed out.">
          <input className="field" inputMode="numeric" value={p.listPrice || ""} onChange={(e) => set("listPrice", Number(e.target.value.replace(/\D/g, "")) || 0)} />
        </Label>
        <Label label="Discount % (optional)" help={`Empty = category discount (${category?.discountPct ?? 0}%).`}>
          <input className="field" inputMode="numeric" value={p.discountPct} onChange={(e) => set("discountPct", e.target.value === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} />
        </Label>
        <div className="rounded-xl bg-amber-400/10 p-3 text-sm sm:col-span-2">
          Customer pays <b className="text-lg text-amber-200">{inr(sale)}</b>
          {discount > 0 && (
            <>
              {" "}
              instead of <s className="text-white/50">{inr(Number(p.listPrice) || 0)}</s> — {discount}% off, saves {inr((Number(p.listPrice) || 0) - sale)}
            </>
          )}
        </div>
        <Label label="Stock (units)" help="0 shows Sold out. Paid orders reduce it automatically.">
          <input className="field" inputMode="numeric" value={p.stock} onChange={(e) => set("stock", Number(e.target.value.replace(/\D/g, "")) || 0)} />
        </Label>
        <Label label="Size / weight">
          <input className="field" value={p.size} onChange={(e) => set("size", e.target.value)} placeholder="2 kg · 66 servings" />
        </Label>
        <Label label="SKU (optional)">
          <input className="field" value={p.sku ?? ""} onChange={(e) => set("sku", e.target.value)} />
        </Label>
        <Label label="Flavours" help="One per line or comma-separated.">
          <textarea className="field" rows={2} value={p.flavours.join("\n")} onChange={(e) => set("flavours", e.target.value.split("\n"))} />
        </Label>

        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/55">Photos (first one is the main photo)</span>
          <div className="space-y-3">
            {p.images.map((src, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <ImageInput value={src} onChange={(v) => set("images", p.images.map((x, k) => (k === i ? v : x)))} />
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" disabled={i === 0} onClick={() => moveImg(i, -1)} className="rounded border border-white/15 p-1.5 disabled:opacity-30" aria-label="Move up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" disabled={i === p.images.length - 1} onClick={() => moveImg(i, 1)} className="rounded border border-white/15 p-1.5 disabled:opacity-30" aria-label="Move down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => set("images", p.images.filter((_, k) => k !== i))} className="rounded border border-red-400/30 p-1.5 text-red-200" aria-label="Remove photo">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {p.images.length < 12 && (
              <button type="button" onClick={() => set("images", [...p.images, ""])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/25 px-3 py-2 text-sm text-white/70">
                <Plus className="h-4 w-4" /> Add photo
              </button>
            )}
          </div>
        </div>

        <Label label="Short description" help="One or two lines under the name and in Google results." wide>
          <textarea className="field" rows={2} value={p.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
        </Label>
        <Label label="Full description" help="Blank line = new paragraph." wide>
          <textarea className="field" rows={6} value={p.description} onChange={(e) => set("description", e.target.value)} />
        </Label>
        <Label label="Key highlights" help="One per line, e.g. 24 g protein per scoop." wide>
          <textarea className="field" rows={4} value={p.highlights.join("\n")} onChange={(e) => set("highlights", e.target.value.split("\n"))} />
        </Label>
        <NutritionEditor rows={p.nutrition} onChange={(v) => set("nutrition", v)} />
        <Label label="How to use">
          <textarea className="field" rows={3} value={p.howToUse} onChange={(e) => set("howToUse", e.target.value)} />
        </Label>
        <Label label="Warnings / who shouldn't use it">
          <textarea className="field" rows={3} value={p.warnings} onChange={(e) => set("warnings", e.target.value)} />
        </Label>
        <Label label="URL name" help={`/shop/p/${p.slug || slugify(p.name) || "…"}`}>
          <input className="field" value={p.slug} placeholder={slugify(p.name)} onChange={(e) => set("slug", slugify(e.target.value))} />
        </Label>
        <div className="flex flex-col justify-center gap-3">
          <Toggle checked={p.active} onChange={(v) => set("active", v)} label="Show on store" />
          <Toggle checked={p.featured} onChange={(v) => set("featured", v)} label="Feature on home page" />
        </div>
        <Label label={`Google title (${(p.seoTitle ?? "").length}/60)`} help="Empty = product name." wide>
          <input className="field" value={p.seoTitle ?? ""} maxLength={70} onChange={(e) => set("seoTitle", e.target.value)} />
        </Label>
        <Label label={`Google description (${(p.seoDescription ?? "").length}/160)`} help="Empty = short description." wide>
          <textarea className="field" rows={2} maxLength={170} value={p.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />
        </Label>
      </div>
      {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
      <SaveBar
        busy={busy}
        onSave={save}
        onCancel={close}
        onDelete={
          p.id
            ? async () => {
                try {
                  if (await remove("product", p.id!, p.name, done)) close();
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

function NutritionEditor({ rows, onChange }: { rows: NutritionRow[]; onChange: (r: NutritionRow[]) => void }) {
  return (
    <div className="sm:col-span-2">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/55">Nutrition per serving</span>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <input className="field text-sm" placeholder="Protein" value={r.label} onChange={(e) => onChange(rows.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
            <input className="field text-sm" placeholder="24 g" value={r.value} onChange={(e) => onChange(rows.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
            <button type="button" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="rounded-lg border border-white/15 px-2.5 text-white/60" aria-label="Remove row">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...rows, { label: "", value: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/25 px-3 py-2 text-sm text-white/70">
          <Plus className="h-4 w-4" /> Add row
        </button>
      </div>
    </div>
  );
}

type CatDraft = Omit<Category, "id"> & { id?: string };

export function CategoriesTab({ data, done }: { data: ShopData; done: Done }) {
  const [edit, setEdit] = useState<CatDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const count = (id: string) => data.products.filter((p) => p.categoryId === id).length;

  async function save() {
    if (!edit) return;
    setBusy(true);
    setErr("");
    try {
      await shopPost({ action: "save-category", ...edit, slug: edit.slug || slugify(edit.name) });
      await done(`Saved ${edit.name}`);
      setEdit(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Each category&apos;s sale % applies to every product in it unless a product sets its own discount. Changes show on the store within a minute.</p>
      <ul className="space-y-2">
        {data.categories.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => setEdit({ ...c })} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-amber-400/40">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {c.name} {!c.active && <span className="ml-1 rounded bg-white/10 px-1.5 text-xs text-white/60">Hidden</span>}
                </span>
                <span className="text-xs text-white/50">
                  /shop/c/{c.slug} · {count(c.id)} products
                </span>
              </span>
              <span className={`rounded-full px-3 py-1 text-sm font-black ${c.discountPct ? "bg-amber-400 text-black" : "bg-white/10 text-white/60"}`}>{c.discountPct ? `${c.discountPct}% OFF` : "No sale"}</span>
            </button>
          </li>
        ))}
      </ul>
      {!edit && (
        <button type="button" onClick={() => setEdit({ slug: "", name: "", description: "", discountPct: 0, sort: (data.categories.at(-1)?.sort ?? 0) + 10, image: null, seoTitle: "", seoDescription: "", active: true })} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black">
          <Plus className="h-4 w-4" /> New category
        </button>
      )}
      {edit && (
        <Card>
          <h2 className="font-display mb-4 text-xl">{edit.id ? `Edit ${edit.name}` : "New category"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label label="Name">
              <input className="field" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Label>
            <Label label="Sale discount %" help="0–90. Applies to all its products.">
              <input className="field" inputMode="numeric" value={edit.discountPct} onChange={(e) => setEdit({ ...edit, discountPct: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
            </Label>
            <Label label="Description (shown on the category page)" wide>
              <textarea className="field" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </Label>
            <Label label="Image" wide>
              <ImageInput value={edit.image ?? ""} onChange={(v) => setEdit({ ...edit, image: v || null })} />
            </Label>
            <Label label="URL name">
              <input className="field" value={edit.slug} placeholder={slugify(edit.name)} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} />
            </Label>
            <Label label="Order" help="Lower shows first.">
              <input className="field" inputMode="numeric" value={edit.sort} onChange={(e) => setEdit({ ...edit, sort: Number(e.target.value.replace(/[^\d-]/g, "")) || 0 })} />
            </Label>
            <Label label="Google title" wide>
              <input className="field" value={edit.seoTitle ?? ""} maxLength={70} onChange={(e) => setEdit({ ...edit, seoTitle: e.target.value })} />
            </Label>
            <Label label="Google description" wide>
              <textarea className="field" rows={2} maxLength={170} value={edit.seoDescription ?? ""} onChange={(e) => setEdit({ ...edit, seoDescription: e.target.value })} />
            </Label>
            <Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Show on store" />
          </div>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          <SaveBar
            busy={busy}
            onSave={save}
            onCancel={() => setEdit(null)}
            onDelete={
              edit.id
                ? async () => {
                    try {
                      if (await remove("category", edit.id!, edit.name, done)) setEdit(null);
                    } catch (e) {
                      setErr((e as Error).message);
                    }
                  }
                : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}
