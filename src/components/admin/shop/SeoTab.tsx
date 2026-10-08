"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Search } from "lucide-react";
import type { PageAudit } from "@/app/api/admin/shop/seo/route";
import { Card, type ShopData } from "./common";

type Result = { scope: string; total: number; checked: number; score: number; pages: PageAudit[] };

/** Store-data checks that need no crawl: things Google uses that the admin can fix in a form. */
function catalogIssues(d: ShopData) {
  const out: { where: string; issue: string }[] = [];
  for (const p of d.products) {
    if (!p.active) continue;
    if (p.images.length === 0) out.push({ where: p.name, issue: "No photo — products without images rarely show in Google Shopping or image search." });
    if (p.shortDescription.length < 50) out.push({ where: p.name, issue: "Short description under 50 characters." });
    if (p.description.length < 300) out.push({ where: p.name, issue: "Full description under 300 characters — thin pages rank poorly." });
    if (!p.categoryId) out.push({ where: p.name, issue: "No category." });
    if (p.seoTitle && p.seoTitle.length > 60) out.push({ where: p.name, issue: "Google title over 60 characters (gets cut off)." });
  }
  const slugs = new Map<string, number>();
  for (const p of d.products) slugs.set(p.name.toLowerCase(), (slugs.get(p.name.toLowerCase()) ?? 0) + 1);
  for (const [name, n] of slugs) if (n > 1) out.push({ where: name, issue: `${n} products share this name — give each a unique name (size/flavour).` });
  for (const c of d.categories) if (c.active && c.description.length < 80) out.push({ where: `Category: ${c.name}`, issue: "Category description under 80 characters." });
  if (d.posts.filter((p) => p.published).length < 6) out.push({ where: "Blog", issue: "Fewer than 6 published guides." });
  if (!d.settings.fssaiLicence) out.push({ where: "Store settings", issue: "No FSSAI number — trust signal for buyers and required by law." });
  return out;
}

export function SeoTab({ data }: { data: ShopData }) {
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [scope, setScope] = useState<"shop" | "all">("shop");
  const issues = useMemo(() => catalogIssues(data), [data]);

  async function run() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/admin/shop/seo?scope=${scope}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Audit failed");
      setRes(j);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-display text-lg">Live page audit</h2>
        <p className="mt-1 text-sm text-white/55">Reads every page in your sitemap the way Google does: title, description, headings, canonical link, image alt text, structured data and speed.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(["shop", "all"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setScope(s)} className={`rounded-full px-4 py-2 text-sm ${scope === s ? "bg-white text-black" : "bg-white/5 text-white/70"}`}>
              {s === "shop" ? "Store pages" : "Whole website"}
            </button>
          ))}
          <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-black disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {busy ? "Checking pages…" : "Run audit"}
          </button>
        </div>
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        {res && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 font-display text-2xl ${res.score >= 90 ? "border-emerald-400 text-emerald-300" : res.score >= 60 ? "border-amber-400 text-amber-200" : "border-red-400 text-red-200"}`}>{res.score}</div>
              <p className="text-sm text-white/65">
                {res.pages.filter((p) => !p.issues.length).length} of {res.checked} pages have no issues
                {res.total > res.checked && ` (checked ${res.checked} of ${res.total} sitemap pages)`}.
              </p>
            </div>
            <ul className="mt-4 divide-y divide-white/5">
              {res.pages.map((p) => (
                <li key={p.url} className="py-3 text-sm">
                  <div className="flex items-start gap-2">
                    {p.issues.length ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}
                    <div className="min-w-0 flex-1">
                      <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-white/85 hover:text-amber-200">
                        {new URL(p.url).pathname} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <p className="truncate text-xs text-white/45">{p.title || "(no title)"}</p>
                      {p.issues.length > 0 && <p className="mt-1 text-xs text-amber-200">{p.issues.join(" · ")}</p>}
                      <p className="mt-0.5 text-[11px] text-white/35">
                        {p.ms} ms · {p.kb} KB · {p.images} images · {p.jsonLd.length ? `Schema: ${[...new Set(p.jsonLd)].join(", ")}` : "No schema"}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-lg">Catalogue checks ({issues.length})</h2>
        <p className="mt-1 text-sm text-white/55">Fix these in Products, Categories, Blog or Settings.</p>
        {issues.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> Nothing to fix.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {issues.slice(0, 100).map((x, i) => (
              <li key={i} className="rounded-lg bg-white/[0.03] p-3">
                <b>{x.where}</b>
                <span className="block text-white/60">{x.issue}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-lg">Already built in</h2>
        <ul className="mt-3 grid gap-2 text-sm text-white/65 sm:grid-cols-2">
          {[
            "Product, Offer & price schema on every product (Google rich results)",
            "Breadcrumb schema on categories, products, combos and guides",
            "Article schema on every guide",
            "Every product, category, combo and guide in sitemap.xml",
            "Canonical URLs on every page",
            "Cart, checkout and account hidden from Google",
            "Pages re-built within a minute of any admin change",
            "Images resized and served as WebP/AVIF",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> {t}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-white/45">To see real Google traffic and rankings, add the site to Google Search Console and submit /sitemap.xml.</p>
      </Card>
    </div>
  );
}
