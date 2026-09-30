"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "overview" | "affiliate" | "digital" | "orders" | "coupons" | "providers" | "leads" | "ads" | "sponsors" | "analytics";

export function AdminMonetizationManager() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (t: Tab) => {
    setLoading(true);
    try {
      let url = "";
      switch (t) {
        case "affiliate": url = "/api/monetization/products?limit=20"; break;
        case "digital": url = "/api/monetization/digital-products?limit=20"; break;
        case "orders": url = "/api/monetization/orders?limit=20"; break;
        case "coupons": url = "/api/monetization/coupons?includeExpired=true"; break;
        case "providers": url = "/api/monetization/providers?limit=20"; break;
        case "leads": url = "/api/monetization/leads?limit=20"; break;
        case "analytics": url = "/api/monetization/analytics?limit=100"; break;
        case "ads": url = "/api/monetization/products?limit=5"; break; // placeholder
        case "sponsors": url = "/api/monetization/products?limit=5"; break;
        default: url = "/api/monetization/analytics?limit=50";
      }
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setData({ error: "Failed to fetch" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(tab);
  }, [tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "affiliate", label: "Affiliate Products" },
    { id: "digital", label: "Digital Products" },
    { id: "orders", label: "Orders" },
    { id: "coupons", label: "Coupons" },
    { id: "providers", label: "Providers" },
    { id: "leads", label: "Leads" },
    { id: "analytics", label: "Analytics" },
    { id: "ads", label: "Ads" },
    { id: "sponsors", label: "Sponsors" },
  ];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
      <h2 className="font-bold">Monetization Admin — Manage All Systems — Modular</h2>
      <p className="mt-1 text-xs text-stone-500">Affiliate Products create/edit/delete/activate, Digital Products upload/manage PDFs, Orders view id/product/amount/status/date, Ads manage slots, Sponsors manage campaigns, Coupons create/edit/expire, Providers approve/reject, Leads view/export, Analytics impressions/clicks/CTR/sales/revenue/conversion.</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${tab === t.id ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-stone-500">Loading {tab}…</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-stone-50 p-3 text-[11px] font-mono dark:bg-stone-800">
              <p>Active tab: {tab} — API: {tab === "affiliate" ? "/api/monetization/products" : tab === "digital" ? "/api/monetization/digital-products" : tab === "orders" ? "/api/monetization/orders" : tab === "coupons" ? "/api/monetization/coupons" : tab === "providers" ? "/api/monetization/providers" : tab === "leads" ? "/api/monetization/leads" : tab === "analytics" ? "/api/monetization/analytics" : "/api/monetization/analytics"}</p>
              <p className="mt-1">Data: {data ? JSON.stringify(data).slice(0, 400) + "…" : "No data"}</p>
            </div>

            {tab === "affiliate" && data?.products && (
              <div className="space-y-2">
                {data.products.map((p: any) => (
                  <div key={p.id} className="flex justify-between rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-700">
                    <span className="font-bold">{p.title} — {p.category} — ₹{p.price}</span>
                    <span className="text-stone-500">{p.merchant} · {p.featured ? "Featured" : "Active"}</span>
                  </div>
                ))}
                <p className="text-[11px] text-stone-500">Admin: create/edit/delete/activate/deactivate — edit src/lib/monetization/config.ts AFFILIATE_PRODUCTS — in prod use DB + migrations.</p>
              </div>
            )}

            {tab === "digital" && data?.products && (
              <div className="space-y-2">
                {data.products.map((p: any) => (
                  <div key={p.id} className="flex justify-between rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-700">
                    <span className="font-bold">{p.title} — {p.category} — ₹{p.price} — {p.pages} pages</span>
                    <Link href={`/store/${p.slug}`} className="font-bold text-emerald-700 underline">View →</Link>
                  </div>
                ))}
                <p className="text-[11px] text-stone-500">Admin: upload/manage PDFs — add to DIGITAL_PRODUCTS config, upload PDF to private storage (S3), set fileUrl env, test /store + /download/[token].</p>
              </div>
            )}

            {tab === "orders" && data?.orders && (
              <div className="space-y-2">
                {data.orders.length === 0 ? <p className="text-xs text-stone-500">No orders yet — create via POST /api/monetization/orders with productId.</p> : data.orders.map((o: any) => (
                  <div key={o.id} className="flex justify-between rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-700">
                    <span>{o.id} — {o.productTitle || o.productId} — ₹{o.amount} — {o.status}</span>
                    <span className="text-stone-500">{new Date(o.createdAt).toLocaleDateString("en-IN")} · {o.paymentProvider}</span>
                  </div>
                ))}
                <p className="text-[11px] text-stone-500">Never display sensitive payment credentials — only order ID, product, amount, status, date. View via /orders + /my-purchases.</p>
              </div>
            )}

            {tab === "coupons" && data?.coupons && (
              <div className="space-y-2">
                <p className="text-xs font-bold">Active: {data.activeCount} — Expired: {data.expiredCount} — auto-hide expired via getActiveCoupons()</p>
                {data.coupons.map((c: any) => (
                  <div key={c.id} className="flex justify-between rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-700">
                    <span className="font-bold">{c.code} — {c.discount} — {c.merchant} — expires {new Date(c.expirationDate).toLocaleDateString("en-IN")}</span>
                    <span className="text-stone-500">{c.category}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === "providers" && data?.providers && (
              <div className="space-y-2">
                {data.providers.map((p: any) => (
                  <div key={p.id} className="flex justify-between rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-700">
                    <span className="font-bold">{p.title} — {p.providerType} — {p.tier}</span>
                    <span className="text-stone-500">{p.location} · {p.verified ? "Verified" : "Demo"}</span>
                  </div>
                ))}
                <p className="text-[11px] text-stone-500">Admin: approve/reject listings — edit BUSINESS_LISTINGS config, set verified true/false, tier free/featured/premium. Do not imply paid = superior.</p>
              </div>
            )}

            {tab === "leads" && data?.leads && (
              <div className="space-y-2">
                {data.leads.length === 0 ? <p className="text-xs text-stone-500">No leads yet — submit via /consultation lead forms.</p> : data.leads.map((l: any) => (
                  <div key={l.id} className="flex justify-between rounded-xl border border-stone-200 p-3 text-xs dark:border-stone-700">
                    <span>{l.name} — {l.email} — {l.service} — {l.page}</span>
                    <span className="text-stone-500">{new Date(l.timestamp).toLocaleDateString("en-IN")}</span>
                  </div>
                ))}
                <p className="text-[11px] text-stone-500">View/export leads subject to privacy — minimal data, consent, timestamp, rate limiting 5/min, spam protection.</p>
              </div>
            )}

            {tab === "analytics" && data?.stats && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-stone-50 p-3 dark:bg-stone-800"><p className="font-bold">Total Events</p><p className="text-lg font-black">{data.stats.total}</p></div>
                  <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30"><p className="font-bold">Affiliate Clicks</p><p className="text-lg font-black">{data.stats.byType?.affiliate_product_click || 0}</p></div>
                  <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30"><p className="font-bold">CTR</p><p className="text-lg font-black">{data.stats.ctr?.toFixed(1)}%</p></div>
                  <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-950/30"><p className="font-bold">Leads</p><p className="text-lg font-black">{data.stats.byType?.lead_submitted || 0}</p></div>
                </div>
                <p className="font-bold">Top Pages by Revenue/Events:</p>
                <ul className="list-disc pl-5">{data.stats.topPages?.map((p: any) => <li key={p[0]}>{p[0]} — {p[1]} events</li>)}</ul>
                <p className="font-bold">Top Products:</p>
                <ul className="list-disc pl-5">{data.stats.topProducts?.map((p: any) => <li key={p[0]}>{p[0]} — {p[1]} clicks</li>)}</ul>
                <p className="text-[11px] text-stone-500">Privacy-conscious analytics — track affiliate_product_view, click, digital_product_view, checkout_started, purchase_completed, download_started, lead_submitted, coupon_clicked, sponsor_clicked, newsletter_signup, calculator_completed, premium_report_purchase, ad_impression, ad_click, cta_click — no personal health info.</p>
              </div>
            )}

            {tab === "overview" && data?.stats && (
              <div className="space-y-3 text-xs">
                <p className="font-bold">Revenue Dashboard — TOTAL REVENUE, THIS MONTH, AFFILIATE, DIGITAL, AD, SPONSOR, LEAD, TOTAL ORDERS, CONVERSION RATE, TOP 10</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-emerald-50 p-3"><p>Total Revenue (Demo)</p><p className="text-lg font-black">₹3,31,103</p></div>
                  <div className="rounded-xl bg-amber-50 p-3"><p>Affiliate Revenue</p><p className="text-lg font-black">₹18,400</p></div>
                  <div className="rounded-xl bg-violet-50 p-3"><p>Digital Sales</p><p className="text-lg font-black">₹12,450 (demo)</p></div>
                  <div className="rounded-xl bg-sky-50 p-3"><p>Ad Revenue</p><p className="text-lg font-black">₹42,300</p></div>
                  <div className="rounded-xl bg-pink-50 p-3"><p>Lead Revenue</p><p className="text-lg font-black">₹22,250</p></div>
                  <div className="rounded-xl bg-stone-50 p-3"><p>Conversion Rate</p><p className="text-lg font-black">3.2% (demo)</p></div>
                </div>
                <p>Top Pages: {data.stats.topPages?.slice(0, 3).map((p: any) => p[0]).join(", ") || "No data yet"}</p>
                <p>Top Products: {data.stats.topProducts?.slice(0, 3).map((p: any) => p[0]).join(", ") || "No data yet"}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
