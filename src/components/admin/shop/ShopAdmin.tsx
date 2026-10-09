"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, BarChart3, BookOpen, ExternalLink, Gift, Layers, Loader2, Package, Search, Settings, ShoppingBag, Truck } from "lucide-react";
import { Card, inr, type ShopData } from "./common";
import { OrdersTab } from "./OrdersTab";
import { CategoriesTab, ProductsTab } from "./CatalogTabs";
import { CombosTab } from "./CombosTab";
import { BlogTab, SettingsTab } from "./ContentTabs";
import { SeoTab } from "./SeoTab";

type Tab = "dashboard" | "orders" | "products" | "categories" | "combos" | "blog" | "settings" | "seo";
const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "orders", label: "Orders", icon: Truck },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories & sale %", icon: Layers },
  { id: "combos", label: "Combos", icon: Gift },
  { id: "blog", label: "Blog", icon: BookOpen },
  { id: "settings", label: "Store settings", icon: Settings },
  { id: "seo", label: "SEO audit", icon: Search },
];

export function ShopAdmin() {
  const [data, setData] = useState<ShopData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [flash, setFlash] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/shop", { cache: "no-store" });
    if (res.status === 401) {
      location.href = "/admin/login";
      return;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || "Couldn't load the store.");
    else {
      setError("");
      setData(json);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  const done = useCallback(
    async (msg: string) => {
      setFlash(msg);
      setTimeout(() => setFlash(""), 3000);
      await load();
    },
    [load],
  );

  const toShip = data?.stats.ordersToShip ?? 0;
  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <a href="/admin" className="rounded-lg p-2 text-white/70 hover:bg-white/5" aria-label="Back to admin">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <ShoppingBag className="h-5 w-5 text-amber-300" />
          <h1 className="font-display text-lg sm:text-xl">Royal Supplements Store</h1>
          <a href="/shop" target="_blank" className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80">
            View store <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      {flash && <div className="fixed inset-x-0 top-16 z-40 mx-auto w-fit rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-black shadow-lg">{flash}</div>}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-20 lg:mx-0 lg:flex-col lg:self-start lg:px-0" aria-label="Store sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium ${tab === t.id ? "bg-amber-400 text-black" : "text-white/70 hover:bg-white/5"}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
              {t.id === "orders" && toShip > 0 && <span className={`ml-auto rounded-full px-2 text-xs font-black ${tab === t.id ? "bg-black text-amber-300" : "bg-amber-400 text-black"}`}>{toShip}</span>}
            </button>
          ))}
        </nav>

        <section className="min-w-0">
          {error && (
            <p className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/15 p-4 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          {!data && !error && (
            <p className="flex items-center gap-2 text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading the store…
            </p>
          )}
          {data && (
            <>
              {tab === "dashboard" && <Dashboard data={data} go={setTab} />}
              {tab === "orders" && <OrdersTab data={data} done={done} />}
              {tab === "products" && <ProductsTab data={data} done={done} />}
              {tab === "categories" && <CategoriesTab data={data} done={done} />}
              {tab === "combos" && <CombosTab data={data} done={done} />}
              {tab === "blog" && <BlogTab data={data} done={done} />}
              {tab === "settings" && <SettingsTab data={data} done={done} />}
              {tab === "seo" && <SeoTab data={data} />}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Dashboard({ data, go }: { data: ShopData; go: (t: Tab) => void }) {
  const s = data.stats;
  const max = Math.max(1, ...s.daily.map((d) => d.revenue));
  const setup = [
    { ok: data.products.length > 0, text: "Add your products (Products → New product)", tab: "products" as Tab },
    { ok: !!data.settings.fssaiLicence, text: "Add your FSSAI registration / licence number (Store settings) — required to sell food supplements online", tab: "settings" as Tab },
    { ok: !!data.settings.orderEmail, text: "Set the email that receives orders (Store settings)", tab: "settings" as Tab },
    { ok: data.channels.email, text: "Connect email sending (RESEND_API_KEY + EMAIL_FROM in Vercel) so order emails go out", tab: null },
    { ok: data.channels.razorpay, text: "Connect Razorpay (RAZORPAY_KEY_ID / SECRET in Vercel) to take payments", tab: null },
    { ok: data.combos.length > 0, text: "Create combos — the builder finds products for ₹3000 / ₹4000 / ₹5000", tab: "combos" as Tab },
  ];
  const todo = setup.filter((x) => !x.ok);
  return (
    <div className="space-y-6">
      {todo.length > 0 && (
        <Card className="border-amber-400/30 bg-amber-400/5">
          <h2 className="font-display text-lg text-amber-200">Finish setting up ({setup.length - todo.length}/{setup.length} done)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {todo.map((x) => (
              <li key={x.text} className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                {x.tab ? (
                  <button type="button" onClick={() => go(x.tab!)} className="text-left text-white/85 underline decoration-white/30 underline-offset-4 hover:text-white">
                    {x.text}
                  </button>
                ) : (
                  <span className="text-white/70">{x.text}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Revenue (30 days)", v: inr(s.revenue30) },
          { l: "Paid orders", v: String(s.ordersPaid), sub: `${s.todayOrders} today` },
          { l: "To pack / ship", v: String(s.ordersToShip), hot: s.ordersToShip > 0 },
          { l: "Average order", v: inr(s.avgOrder), sub: `${inr(s.revenueTotal)} all time` },
        ].map((k) => (
          <button key={k.l} type="button" onClick={() => k.l.includes("ship") && go("orders")} className={`rounded-2xl border p-4 text-left ${k.hot ? "border-amber-400/50 bg-amber-400/10" : "border-white/10 bg-white/[0.03]"}`}>
            <p className="text-xs text-white/55">{k.l}</p>
            <p className="font-display mt-1 text-2xl">{k.v}</p>
            {k.sub && <p className="mt-0.5 text-xs text-white/45">{k.sub}</p>}
          </button>
        ))}
      </div>

      <Card>
        <h2 className="font-display text-lg">Last 14 days</h2>
        <div className="mt-4 flex h-40 items-end gap-1.5" role="img" aria-label="Daily revenue chart">
          {s.daily.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-300" style={{ height: `${Math.max(2, (d.revenue / max) * 130)}px` }} title={`${d.day}: ${inr(d.revenue)}, ${d.orders} orders`} />
              <span className="text-[10px] text-white/40">{d.day.slice(3)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg">Best sellers</h2>
          {s.top.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">No sales yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/5 text-sm">
              {s.top.map((t) => (
                <li key={t.name} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{t.name}</span>
                  <span className="shrink-0 text-white/60">
                    {t.qty} sold · {inr(t.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-lg">Low stock</h2>
          {s.lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">Nothing at 5 or fewer.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/5 text-sm">
              {s.lowStock.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className={p.stock === 0 ? "font-bold text-red-300" : "text-amber-200"}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
          {s.abandoned > 0 && <p className="mt-4 text-xs text-white/45">{s.abandoned} checkout(s) started but not paid.</p>}
        </Card>
      </div>
    </div>
  );
}
