import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui";
import DeveloperDashboard from "@/components/developers/DeveloperDashboard";

export const metadata: Metadata = {
  title: "Developer Dashboard — API Keys & Usage | BHG",
  description:
    "Create, label and revoke API keys and watch quota consumption by key and endpoint. Keys are stored hashed and shown once at creation.",
  alternates: { canonical: "/developers/dashboard" },
  robots: { index: false, follow: true },
};

export default function DeveloperDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Developers", href: "/developers" }, { label: "Dashboard" }]} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-teal-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Developer dashboard</p>
        <h1 className="font-display mt-2 text-3xl font-black">API keys &amp; usage</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">
          Keys are stored as SHA-256 hashes and displayed exactly once at creation — we cannot recover a lost key, which is what keeps them safe in a database leak.
          Usage is counted per key per UTC day, and quotas reset at midnight UTC.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Link href="/developers/docs" className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-emerald-950 hover:bg-amber-400">Reference</Link>
          <a href="/api/v1/openapi.json" className="rounded-xl border border-white/25 px-4 py-2 font-bold hover:bg-white/10">OpenAPI</a>
          <Link href="/developers#pricing" className="rounded-xl border border-white/25 px-4 py-2 font-bold hover:bg-white/10">Plans</Link>
        </div>
      </div>

      <div className="mt-6">
        <DeveloperDashboard />
      </div>

      <div className="mt-8 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-xs leading-relaxed text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
        <p className="font-bold">Security notes</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Revocation is immediate: the next request with a revoked key returns <code>401 invalid_api_key</code>. Usage history is retained for your records.</li>
          <li>Key management is scoped to your account — another account&apos;s key id returns <code>404</code>, so ids cannot be enumerated.</li>
          <li>Never ship a key in client-side code or a public repository; call the API from your backend and keep the key in an environment variable.</li>
          <li>No health data is stored: usage counters hold only counts and endpoint paths.</li>
        </ul>
      </div>
    </div>
  );
}
