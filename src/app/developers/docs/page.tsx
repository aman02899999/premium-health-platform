import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SectionHeading } from "@/components/ui";
import { SITE } from "@/lib/site";
import { API_ENDPOINTS } from "@/lib/saas/endpoints";
import { API_PLANS, formatQuota } from "@/lib/saas/plans";

export const metadata: Metadata = {
  title: "API Reference — Auth, Quotas, Endpoints & Errors | BHG Developers",
  description:
    "Complete reference for the Bharat Health Guide Data API: authentication, response envelope, rate-limit headers, error codes, every endpoint with parameters and source licences, plus curl, JavaScript and Python examples.",
  alternates: { canonical: "/developers/docs" },
};

const errorCodes = [
  { code: "missing_api_key", status: 401, when: "No x-api-key header and no Authorization bearer token.", fix: "Send your key in the x-api-key header." },
  { code: "invalid_api_key", status: 401, when: "The key is unknown, revoked, or belongs to a deleted account.", fix: "Check for stray whitespace, or create a new key in the dashboard." },
  { code: "quota_exceeded", status: 429, when: "The plan's daily request allowance is used up.", fix: "Wait for X-RateLimit-Reset (UTC midnight) or upgrade the plan." },
  { code: "rate_limited", status: 429, when: "The per-minute burst limit was exceeded.", fix: "Retry after the number of seconds in Retry-After; back off exponentially." },
  { code: "invalid_request", status: 400, when: "A required parameter is missing or out of range.", fix: "Check the parameter table for the endpoint." },
  { code: "not_found", status: 404, when: "No such API key on your account (delete), or no matching record.", fix: "Verify the identifier." },
  { code: "upstream_unavailable", status: 503, when: "A live upstream source is unreachable and an empty answer would mislead (air quality).", fix: "Retry shortly; the endpoint is cached once the source recovers." },
  { code: "internal_error", status: 500, when: "Unexpected server-side failure.", fix: "Retry; if it persists, contact support with the timestamp and endpoint." },
];

const dataEndpoints = API_ENDPOINTS.filter((e) => e.auth === "api_key");
const billingEndpoints = API_ENDPOINTS.filter((e) => e.auth === "session").map((e) => ({
  method: e.method,
  path: e.path,
  purpose: e.title,
  notes: e.summary,
}));

export default function DeveloperDocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Developers", href: "/developers" }, { label: "Docs" }]} />

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-teal-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">API Reference · v1</p>
        <h1 className="font-display mt-2 text-3xl font-black">Developer documentation</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">
          Authentication, quota behaviour, the error contract and every endpoint — generated from the same source of truth as the OpenAPI document, so neither can drift.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Link href="/developers/dashboard" className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-emerald-950 hover:bg-amber-400">Get a key</Link>
          <a href="/api/v1/openapi.json" className="rounded-xl border border-white/25 px-4 py-2 font-bold hover:bg-white/10">openapi.json</a>
          <a href="/api/v1" className="rounded-xl border border-white/25 px-4 py-2 font-bold hover:bg-white/10">GET /api/v1</a>
        </div>
      </div>

      <nav className="mt-6 rounded-2xl border border-stone-200 p-4 text-xs dark:border-stone-700" aria-label="On this page">
        <p className="font-bold uppercase tracking-wider text-stone-500">On this page</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {["authentication", "envelope", "quotas", "errors", "endpoints", "examples"].map((id) => (
            <li key={id}><a href={`#${id}`} className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">{id}</a></li>
          ))}
        </ul>
      </nav>

      <SectionHeading id="authentication" eyebrow="Step 1" title="Authentication" desc="One key, sent in a header. Create keys in the dashboard — they are stored hashed, so the plaintext is shown exactly once at creation." />
      <div className="mt-4 space-y-3">
        <pre className="overflow-x-auto rounded-2xl bg-stone-900 p-5 text-xs leading-relaxed text-stone-100"><code>{`# preferred
curl -H "x-api-key: $BHG_API_KEY" https://bharathealthguide.in/api/v1/plans

# also accepted
curl -H "Authorization: Bearer $BHG_API_KEY" https://bharathealthguide.in/api/v1/literature/search?q=diabetes`}</code></pre>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          A query-string fallback (<code>?api_key=</code>) exists for quick browser tests only — do not use it in production, where URLs are logged.
        </p>
      </div>

      <SectionHeading id="envelope" eyebrow="Step 2" title="Response envelope" desc="Success and failure share one predictable shape, so you write one parser." />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <pre className="overflow-x-auto rounded-2xl border border-stone-200 bg-white p-5 text-xs leading-relaxed dark:border-stone-700 dark:bg-stone-900"><code>{`HTTP/1.1 200 OK
x-plan: free
x-ratelimit-limit-day: 1000
x-ratelimit-remaining-day: 999
x-ratelimit-reset: 2026-09-14T00:00:00.000Z

{
  "ok": true,
  "meta": { "plan": "free", "quota": { … } },
  "data": { "results": [ … ], "total": 128 }
}`}</code></pre>
        <pre className="overflow-x-auto rounded-2xl border border-stone-200 bg-white p-5 text-xs leading-relaxed dark:border-stone-700 dark:bg-stone-900"><code>{`HTTP/1.1 429 Too Many Requests
retry-after: 3600

{
  "ok": false,
  "error": {
    "code": "quota_exceeded",
    "message": "Daily quota reached for the Free plan…",
    "docs": "https://…/developers/docs",
    "status": 429
  }
}`}</code></pre>
      </div>

      <SectionHeading id="quotas" eyebrow="Step 3" title="Quotas & rate limits" desc="Two limits per key, both echoed in headers: a daily allowance and a per-minute burst limit. Quotas reset at UTC midnight." />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-700">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead className="bg-stone-100 text-[11px] uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            <tr><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Per day</th><th className="px-4 py-3">Per minute</th><th className="px-4 py-3">Bulk export</th><th className="px-4 py-3">Attribution</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {API_PLANS.map((plan) => (
              <tr key={plan.id}>
                <td className="px-4 py-3 font-bold">{plan.name}</td>
                <td className="px-4 py-3 text-xs">{formatQuota(plan.requestsPerDay)}</td>
                <td className="px-4 py-3 text-xs">{formatQuota(plan.requestsPerMinute)}</td>
                <td className="px-4 py-3 text-xs">{plan.bulkExport ? "Yes" : "—"}</td>
                <td className="px-4 py-3 text-xs">{plan.attributionRequired ? "Required" : "Not required"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeading
        id="billing"
        eyebrow="Console"
        title="Subscriptions &amp; billing"
        desc="Self-serve plans are settled through the payment provider abstraction. These endpoints use your account cookie, never an API key — a key can read data, it cannot move money."
      />
      <div className="mt-4 space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-700">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead className="bg-stone-100 text-[11px] uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              <tr><th className="px-4 py-3">Endpoint</th><th className="px-4 py-3">Purpose</th><th className="px-4 py-3">Notes</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {billingEndpoints.map((row) => (
                <tr key={`${row.method} ${row.path}`}>
                  <td className="px-4 py-3">
                    <span className="mr-2 rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-black text-stone-700 dark:bg-stone-700 dark:text-stone-200">{row.method}</span>
                    <code className="text-xs font-bold">{row.path}</code>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-300">{row.purpose}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/20 dark:text-amber-100">
          <p className="font-bold">When a plan is actually granted</p>
          <p className="mt-1">
            Creating a checkout does <strong>not</strong> upgrade you: the subscription is created as
            <code className="mx-1 rounded bg-white/70 px-1 dark:bg-black/30">past_due</code> and quota stays on the Free plan until a
            payment is settled. A plan moves only when the provider confirms the charge — either with a verified signature from a
            provider that holds real secrets, or on the sandbox provider, where the activation is recorded with
            <code className="mx-1 rounded bg-white/70 px-1 dark:bg-black/30">demo: true</code> and counted as zero revenue.
          </p>
          <p className="mt-2">
            Cancelling returns every active key on the account to the Free plan immediately, so cancelled subscriptions cannot keep
            spending paid quota. Keys created while a subscription is active inherit its plan; the plan in a request body is ignored
            on purpose, so a client can never promote itself.
          </p>
        </div>
      </div>

      <SectionHeading id="errors" eyebrow="Reference" title="Error codes" desc="Codes are stable — branch on them rather than on the message text." />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-700">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <thead className="bg-stone-100 text-[11px] uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">HTTP</th><th className="px-4 py-3">When</th><th className="px-4 py-3">What to do</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {errorCodes.map((row) => (
              <tr key={row.code}>
                <td className="px-4 py-3"><code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-bold dark:bg-stone-800">{row.code}</code></td>
                <td className="px-4 py-3 text-xs font-bold">{row.status}</td>
                <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-300">{row.when}</td>
                <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-300">{row.fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeading id="endpoints" eyebrow="Reference" title={`${dataEndpoints.length} data endpoints`} desc="Parameters, sample payloads and — importantly — the upstream source and licence you must honour." />
      <div className="mt-4 space-y-5">
        {dataEndpoints.map((endpoint) => (
          <article key={endpoint.path} className="rounded-2xl border border-stone-200 p-5 dark:border-stone-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-black text-white">{endpoint.method}</span>
              <code className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{endpoint.path}</code>
              <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">x-api-key</span>
            </div>
            <h3 className="mt-2 font-bold">{endpoint.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">{endpoint.summary}</p>

            {endpoint.params.length > 0 && (
              <table className="mt-3 w-full border-collapse text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-stone-400">
                  <tr><th className="py-1 pr-3">Param</th><th className="py-1 pr-3">Type</th><th className="py-1 pr-3">Required</th><th className="py-1">Description</th></tr>
                </thead>
                <tbody>
                  {endpoint.params.map((param) => (
                    <tr key={param.name} className="border-t border-stone-100 dark:border-stone-800">
                      <td className="py-1.5 pr-3"><code className="font-bold">{param.name}</code></td>
                      <td className="py-1.5 pr-3 text-stone-500">{param.type}</td>
                      <td className="py-1.5 pr-3">{param.required ? "Yes" : "No"}</td>
                      <td className="py-1.5 text-stone-600 dark:text-stone-300">{param.description}{param.example ? <span className="text-stone-400"> e.g. {param.example}</span> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {endpoint.source && (
              <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400">
                Source: <a href={endpoint.source.url} target="_blank" rel="noopener noreferrer nofollow" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">{endpoint.source.name}</a> · Licence: {endpoint.source.license}
              </p>
            )}

            {endpoint.sample ? (
              <pre className="mt-3 overflow-x-auto rounded-xl bg-stone-900 p-4 text-[11px] leading-relaxed text-stone-100"><code>{JSON.stringify(endpoint.sample, null, 2)}</code></pre>
            ) : null}
          </article>
        ))}
      </div>

      <SectionHeading id="examples" eyebrow="Recipes" title="Client examples" desc="Copy-paste starting points with retry-and-backoff handled." />
      <div className="mt-4 space-y-4">
        <pre className="overflow-x-auto rounded-2xl bg-stone-900 p-5 text-xs leading-relaxed text-stone-100"><code>{`// JavaScript — handles 429 with Retry-After
async function bhg(path, params = {}) {
  const url = new URL("https://bharathealthguide.in" + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "x-api-key": process.env.BHG_API_KEY } });
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after") ?? 60);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    const body = await res.json();
    if (!body.ok) throw new Error(body.error.code + ": " + body.error.message);
    return body.data;
  }
  throw new Error("Rate limited after retries");
}`}</code></pre>
        <pre className="overflow-x-auto rounded-2xl bg-stone-900 p-5 text-xs leading-relaxed text-stone-100"><code>{`# Python
import os, requests

def bhg(path, **params):
    r = requests.get(
        "https://bharathealthguide.in" + path,
        params=params,
        headers={"x-api-key": os.environ["BHG_API_KEY"]},
        timeout=15,
    )
    if r.status_code == 429:
        raise RuntimeError(f"Quota hit — retry after {r.headers.get('retry-after')}s")
    body = r.json()
    if not body.get("ok"):
        raise RuntimeError(body["error"]["code"])
    return body["data"]

print(bhg("/api/v1/nutrition/fruit", name="mango"))`}</code></pre>
      </div>

      <div className="mt-8 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-xs leading-relaxed text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
        <p className="font-bold">Attribution &amp; licence obligations</p>
        <p className="mt-1">
          Each endpoint lists its upstream source and licence. You must attribute the upstream provider in your own UI where their licence requires it — for example &quot;Air quality data by{" "}
          <a href="https://open-meteo.com" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400" target="_blank" rel="noopener noreferrer nofollow">Open-Meteo</a> (CC BY 4.0)&quot;.
          Plans that require attribution to Bharat Health Guide echo the required string in <code>meta.attribution</code> on every response.
        </p>
        <p className="mt-2">
          This API serves public reference data only. It is informational, not medical advice, and must not be used as the sole basis for diagnosis or treatment. See our{" "}
          <Link href="/disclaimer" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">disclaimer</Link> and{" "}
          <Link href="/terms" className="font-bold text-emerald-700 hover:underline dark:text-emerald-400">terms</Link>.
        </p>
        <p className="mt-2">Canonical URL: <code>{SITE.url}/developers/docs</code></p>
      </div>
    </div>
  );
}
