"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ImageInput } from "@/components/admin/fields";
import { slugify } from "@/lib/shop/defaults";
import type { Post, ShopSettings } from "@/lib/shop/types";
import { Card, Empty, Label, SaveBar, Toggle, shopPost, when, type ShopData } from "./common";

type Done = (m: string) => Promise<void>;
type PostDraft = Omit<Post, "id" | "createdAt" | "updatedAt"> & { id?: string };

export function BlogTab({ data, done }: { data: ShopData; done: Done }) {
  const [edit, setEdit] = useState<PostDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!edit) return;
    setBusy(true);
    setErr("");
    try {
      await shopPost({ action: "save-post", ...edit, slug: edit.slug || slugify(edit.title) });
      await done(`Saved “${edit.title}”`);
      setEdit(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (edit)
    return (
      <Card>
        <h2 className="font-display mb-4 text-xl">{edit.id ? "Edit article" : "New article"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Label label="Title" wide>
            <input className="field" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          </Label>
          <Label label="Summary (list pages and Google)" wide>
            <textarea className="field" rows={2} value={edit.excerpt} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} />
          </Label>
          <Label label="Article" help="Markdown: ## Heading, **bold**, - bullet list, [link](/shop/c/protein). Link to products and categories — it helps them rank." wide>
            <textarea className="field font-mono text-sm" rows={18} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
          </Label>
          <Label label="Cover image" wide>
            <ImageInput value={edit.cover ?? ""} onChange={(v) => setEdit({ ...edit, cover: v || null })} />
          </Label>
          <Label label="Related category" help="Shows its products under the article.">
            <select className="field" value={edit.categorySlug ?? ""} onChange={(e) => setEdit({ ...edit, categorySlug: e.target.value || null })}>
              <option value="">— None —</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Label>
          <Label label="Tags" help="Comma-separated.">
            <input className="field" value={edit.tags.join(", ")} onChange={(e) => setEdit({ ...edit, tags: e.target.value.split(",").map((t) => t.trimStart()) })} />
          </Label>
          <Label label="URL name">
            <input className="field" value={edit.slug} placeholder={slugify(edit.title)} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} />
          </Label>
          <div className="flex items-center">
            <Toggle checked={edit.published} onChange={(v) => setEdit({ ...edit, published: v })} label="Published" />
          </div>
          <Label label={`Google title (${(edit.seoTitle ?? "").length}/60)`} wide>
            <input className="field" maxLength={70} value={edit.seoTitle ?? ""} onChange={(e) => setEdit({ ...edit, seoTitle: e.target.value })} />
          </Label>
          <Label label={`Google description (${(edit.seoDescription ?? "").length}/160)`} wide>
            <textarea className="field" rows={2} maxLength={170} value={edit.seoDescription ?? ""} onChange={(e) => setEdit({ ...edit, seoDescription: e.target.value })} />
          </Label>
        </div>
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        <SaveBar
          busy={busy}
          onSave={save}
          onCancel={() => setEdit(null)}
          onDelete={
            edit.id
              ? async () => {
                  if (!confirm(`Delete “${edit.title}”?`)) return;
                  try {
                    await shopPost({ action: "delete", kind: "post", id: edit.id });
                    await done("Article deleted");
                    setEdit(null);
                  } catch (e) {
                    setErr((e as Error).message);
                  }
                }
              : undefined
          }
        />
      </Card>
    );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setEdit({ slug: "", title: "", excerpt: "", body: "", cover: null, categorySlug: null, tags: [], published: true, seoTitle: "", seoDescription: "" })}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black"
      >
        <Plus className="h-4 w-4" /> New article
      </button>
      {data.posts.length === 0 ? (
        <Empty>No articles yet.</Empty>
      ) : (
        <ul className="space-y-2">
          {data.posts.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setEdit({ ...p, seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "" })} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-amber-400/40">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.title}</span>
                  <span className="text-xs text-white/45">
                    /shop/blog/{p.slug} · updated {when(p.updatedAt)}
                  </span>
                </span>
                {!p.published && <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/60">Draft</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const GROUPS: { title: string; fields: { k: keyof ShopSettings; label: string; help?: string; area?: boolean; image?: boolean }[] }[] = [
  {
    title: "Store & home page",
    fields: [
      { k: "storeName", label: "Store name" },
      { k: "tagline", label: "Tagline (footer)" },
      { k: "announcement", label: "Top announcement bar", help: "Leave empty to hide it." },
      { k: "heroTitle", label: "Home headline" },
      { k: "heroHighlight", label: "Headline highlight (gold text)" },
      { k: "heroText", label: "Home intro text", area: true },
      { k: "heroImage", label: "Home hero image (optional — designed artwork shows when empty)", image: true },
      { k: "banner1Image", label: "Promo banner 1 photo — protein sale (optional)", image: true },
      { k: "banner2Image", label: "Promo banner 2 photo — combos (optional)", image: true },
      { k: "banner3Image", label: "Promo banner 3 photo — tablets / aminos (optional)", image: true },
    ],
  },
  {
    title: "Orders & contact",
    fields: [
      { k: "orderEmail", label: "Send new orders to (email)", help: "Several? Separate with commas. Needs email sending connected." },
      { k: "phone", label: "Phone shown to customers" },
      { k: "whatsapp", label: "WhatsApp number", help: "With country code, e.g. 918851830081." },
      { k: "address", label: "Business address", area: true },
    ],
  },
  {
    title: "Legal",
    fields: [
      { k: "fssaiLicence", label: "FSSAI licence number", help: "14 digits. Shown in the footer — required for selling food supplements online." },
      { k: "gstin", label: "GSTIN (optional)" },
    ],
  },
  {
    title: "Delivery & returns",
    fields: [
      { k: "dispatchText", label: "Delivery promise", help: "e.g. Dispatched in 24 hours · delivered in 2–5 days" },
      { k: "returnPolicy", label: "Return & refund policy", area: true },
    ],
  },
  {
    title: "Google (store home page)",
    fields: [
      { k: "seoTitle", label: "Google title" },
      { k: "seoDescription", label: "Google description", area: true },
    ],
  },
];

export function SettingsTab({ data, done }: { data: ShopData; done: Done }) {
  const [s, setS] = useState<ShopSettings>(data.settings);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof ShopSettings, v: string | number) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy(true);
    setErr("");
    try {
      await shopPost({ action: "save-settings", ...s });
      await done("Store settings saved");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {!data.channels.email && <p className="rounded-xl bg-amber-400/10 p-3 text-sm text-amber-100">Email sending isn&apos;t connected yet, so order emails won&apos;t go out. Orders still appear in the Orders tab. To turn email on, add RESEND_API_KEY and EMAIL_FROM in Vercel.</p>}
      {GROUPS.map((g) => (
        <Card key={g.title}>
          <h2 className="font-display mb-4 text-lg">{g.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.fields.map((f) => (
              <Label key={f.k} label={f.label} help={f.help} wide={f.area || f.image}>
                {f.image ? (
                  <ImageInput value={String(s[f.k] ?? "")} onChange={(v) => set(f.k, v)} />
                ) : f.area ? (
                  <textarea className="field" rows={3} value={String(s[f.k] ?? "")} onChange={(e) => set(f.k, e.target.value)} />
                ) : (
                  <input className="field" value={String(s[f.k] ?? "")} onChange={(e) => set(f.k, e.target.value)} />
                )}
              </Label>
            ))}
            {g.title.startsWith("Delivery") && (
              <>
                <Label label="Delivery charge (₹)" help="0 = free delivery on every order.">
                  <input className="field" inputMode="numeric" value={s.shippingFee} onChange={(e) => set("shippingFee", Number(e.target.value.replace(/\D/g, "")) || 0)} />
                </Label>
                <Label label="Free delivery from (₹)" help="0 = no free-delivery threshold.">
                  <input className="field" inputMode="numeric" value={s.freeShippingOver} onChange={(e) => set("freeShippingOver", Number(e.target.value.replace(/\D/g, "")) || 0)} />
                </Label>
              </>
            )}
          </div>
        </Card>
      ))}
      {err && <p className="text-sm text-red-300">{err}</p>}
      <SaveBar busy={busy} onSave={save} saveLabel="Save settings" />
    </div>
  );
}
