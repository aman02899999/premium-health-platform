import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Health Data Admin — Providers, Status, Sync",
  description: "Admin dashboard for health data integration layer",
};

async function getStatus() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    // Use relative fetch for SSR
    const res = await fetch(`${base}/api/health/status`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getProviders() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/health/providers?health=true`, { cache: "no-store" }).catch(() => null);
    if (!res?.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function HealthAdminPage() {
  const status = await getStatus();
  const providersData = await getProviders();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin/health" }, { label: "Health Data" }]} />
      <h1 className="font-display mt-3 text-3xl font-black">Health Data Administration</h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
        Provider health, sync jobs, cache stats, license compliance. All external APIs are server-side only.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900 lg:col-span-2">
          <h2 className="text-sm font-bold">Provider Status</h2>
          {providersData?.providers ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-stone-500">
                    <th className="py-2">Provider</th>
                    <th>Status</th>
                    <th>Enabled</th>
                    <th>Latency</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {providersData.providers.map((p: { provider: string; status: string; enabled: boolean; responseTimeMs?: number; message?: string }) => (
                    <tr key={p.provider} className="border-b last:border-0 dark:border-stone-800">
                      <td className="py-2 font-medium">{p.provider}</td>
                      <td>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            p.status === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "REQUIRES_API_KEY"
                              ? "bg-amber-100 text-amber-800"
                              : p.status === "LICENSE_REVIEW"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td>{p.enabled ? "Yes" : "No"}</td>
                      <td>{p.responseTimeMs ? `${p.responseTimeMs}ms` : "—"}</td>
                      <td className="max-w-[200px] truncate text-xs text-stone-500">{p.message ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-stone-500">Unable to fetch provider health — try /api/health/providers?health=true directly.</p>
          )}
          <p className="mt-3 text-[11px] text-stone-400">Source: /api/health/providers + /api/health/status</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">Cache Stats</h2>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-stone-50 p-3 text-[12px] dark:bg-stone-800">
              {JSON.stringify(status?.cache ?? { note: "Fetch /api/health/status" }, null, 2)}
            </pre>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="text-sm font-bold">DB Status</h2>
            <p className="mt-2 text-sm">DB: {status?.db ?? "unknown"}</p>
            <p className="text-xs text-stone-500">Enabled providers: {status?.enabledProviders ?? "—"} / {status?.totalProviders ?? "—"}</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-800 p-5 text-white">
            <h2 className="text-sm font-bold">Quick Actions</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/api/health/providers" className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">View /api/health/providers</Link>
              <Link href="/api/health/status" className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">View /api/health/status</Link>
              <Link href="/api/health/search?q=diabetes" className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">Test search: diabetes</Link>
              <Link href="/api/health/food?q=apple" className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">Test food: apple</Link>
              <Link href="/api/health/exercises?q=pushup" className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">Test exercises: pushup</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-base font-bold">Environment Configuration</h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">See .env.example for full list. Key flags:</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-stone-900 p-4 text-[12px] text-emerald-100">
{`ENABLE_WGER=true
ENABLE_OPENFOODFACTS=true
ENABLE_USDA=false (requires USDA_API_KEY)
ENABLE_OPENFDA=true
ENABLE_RXNORM=true
ENABLE_PUBCHEM=true
ENABLE_PUBMED=true
ENABLE_CLINICALTRIALS=true
ENABLE_ICD10=true
ENABLE_SNOMED=false (self-host required)
ENABLE_AYURVEDA=true
ENABLE_HOMEOPATHY=true
ENABLE_INDIAN_MEDICINE=false (LICENSE_REVIEW)
ENABLE_WORLDBANK=true
ENABLE_OPENMETEO=true`}
        </pre>
        <p className="mt-3 text-[11px] text-stone-400">Never commit .env. All secrets server-side. Frontend never exposes keys.</p>
      </div>

      <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <h2 className="font-bold">Medical Safety</h2>
        <ul className="mt-2 list-disc pl-5 text-[13px]">
          <li>All data labeled by source + evidence level</li>
          <li>Traditional Ayurveda/Homeopathy clearly separated from evidence-based medicine</li>
          <li>No personalized dosing, no stop-medicine advice, no cure claims</li>
          <li>Source attribution shown to user where appropriate</li>
        </ul>
      </div>
    </div>
  );
}
