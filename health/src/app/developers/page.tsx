import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SectionHeading, FaqAccordion } from "@/components/ui";
import { SITE } from "@/lib/site";
import { API_ENDPOINTS } from "@/lib/saas/endpoints";
import { API_PLANS, formatQuota, monthlyPriceLabel } from "@/lib/saas/plans";
import { PUBLIC_APIS } from "@/data/public-apis";

export const metadata: Metadata = {
  title: "Developer API — India Health Data for Your App | BHG",
  description:
    "One authenticated API over open, licence-clean health data: foods and nutrition, exercises, clinical trials, medical literature, air quality and country indicators. Free tier, transparent quotas, OpenAPI spec.",
  alternates: { canonical: "/developers" },
  openGraph: {
    title: "Bharat Health Guide Data API",
    description: "Health, nutrition and research data from open sources, behind one API with a free tier.",
    type: "website",
    url: `${SITE.url}/developers`,
  },
};

const dataEndpoints = API_ENDPOINTS.filter((e) => e.source);

const faqs = [
  {
    q: "Do I need a key?",
    a: "Yes for data endpoints — create a free key in the dashboard and send it as the x-api-key header (or Authorization: Bearer). The plans, OpenAPI spec and this page are public.",
  },
  {
    q: "What does the free tier include?",
    a: `${formatQuota(API_PLANS[0].requestsPerDay)} requests per day at ${API_PLANS[0].requestsPerMinute} requests per minute across every data endpoint. No card, no expiry. Attribution to the upstream source is required — each endpoint lists its source and licence.`,
  },
  {
    q: "What happens when I exceed my quota?",
    a: "The API returns HTTP 429 with a Retry-After header and a machine-readable error code (quota_exceeded for the daily limit, rate_limited for the per-minute burst limit). Nothing is silently dropped.",
  },
  {
    q: "Can I use the data commercially?",
    a: "The sources are open-licensed (for example CC0 for OpenAlex, public domain for ClinicalTrials.gov, CC BY 4.0 for World Bank and Open-Meteo), each with its own attribution requirement. Check the source column on every endpoint before shipping.",
  },
  {
    q: "Is patient data involved?",
    a: "No. This API serves public reference data — foods, exercises, trials, literature, air quality and country aggregates. It accepts no patient data, and no health information is stored alongside your usage counters.",
  },
];

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Developers" }]} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebAPI",
            name: "Bharat Health Guide Data API",
            description: "India-focused health, nutrition and research data from open sources.",
            documentation: `${SITE.url}/developers/docs`,
            provider: { "@type": "Organization", name: "Bharat Health Guide", url: SITE.url },
            termsOfService: `${SITE.url}/terms`,
          }),
        }}
      />

      <div className="mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-teal-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Developer API · v1 · OpenAPI 3.1 · {PUBLIC_APIS.length}+ sources tracked</p>
        <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">One API for India&apos;s open health data</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-100/90">
          Instead of wiring up {PUBLIC_APIS.length} unrelated free APIs — each with its own auth quirks, shapes, rate limits and licence terms — call one endpoint surface with one key,
          one response envelope and one quota model. We aggregate {dataEndpoints.length} live data sources, normalise them, cache them, and keep the licence metadata attached.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link href="/developers/dashboard" className="rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-emerald-950 hover:bg-amber-400">Get a free API key →</Link>
          <Link href="/developers/docs" className="rounded-xl border border-white/25 px-5 py-2.5 font-bold hover:bg-white/10">Read the docs</Link>
          <a href="/api/v1/openapi.json" className="rounded-xl border border-white/25 px-5 py-2.5 font-bold hover:bg-white/10">OpenAPI spec</a>
          <Link href="/api-directory" className="rounded-xl border border-white/25 px-5 py-2.5 font-bold hover:bg-white/10">{PUBLIC_APIS.length}-API directory</Link>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div><dt className="text-emerald-200/80">Data endpoints</dt><dd className="font-display text-2xl font-black">{dataEndpoints.length}</dd></div>
          <div><dt className="text-emerald-200/80">Free tier</dt><dd className="font-display text-2xl font-black">{formatQuota(API_PLANS[0].requestsPerDay)}<span className="text-sm font-bold">/day</span></dd></div>
          <div><dt className="text-emerald-200/80">Response shape</dt><dd className="font-display text-2xl font-black">1</dd></div>
          <div><dt className="text-emerald-200/80">Fields of health data stored</dt><dd className="font-display text-2xl font-black">0</dd></div>
        </dl>
      </div>

      <SectionHeading
        eyebrow="Quickstart"
        id="quickstart"
        title="Three steps to your first call"
        desc="Create a key in the dashboard, then pass it as x-api-key. Every data endpoint returns the same envelope, with your quota echoed in the meta block and in X-RateLimit-* headers."
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-stone-900 p-5 text-stone-100 dark:border-stone-700">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">curl</p>
          <pre className="mt-2 overflow-x-auto text-xs leading-relaxed"><code>{`curl -s "https://bharathealthguide.in/api/v1/literature/search?q=millet%20glycemic" \\
  -H "x-api-key: $BHG_API_KEY"`}</code></pre>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-900 p-5 text-stone-100 dark:border-stone-700">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">response</p>
          <pre className="mt-2 overflow-x-auto text-xs leading-relaxed"><code>{`{
  "ok": true,
  "meta": {
    "plan": "free",
    "quota": { "requestsToday": 1, "remainingToday": 999 }
  },
  "data": { "results": [ /* … */ ], "total": 128 }
}`}</code></pre>
        </div>
      </div>

      <SectionHeading
        eyebrow="Endpoints"
        id="endpoints"
        title="What you can call"
        desc="All data endpoints share the same auth, envelope, quota model and caching behaviour. Full parameters, samples and source licences are in the docs."
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-700">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <thead className="bg-stone-100 text-[11px] uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            <tr>
              <th className="px-4 py-3">Endpoint</th>
              <th className="px-4 py-3">What it returns</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Licence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {API_ENDPOINTS.filter((e) => e.auth !== "session").map((endpoint) => (
              <tr key={endpoint.path}>
                <td className="px-4 py-3">
                  <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-stone-800 dark:text-emerald-300">{endpoint.path}</code>
                  <p className="mt-1 text-xs font-bold">{endpoint.title}</p>
                </td>
                <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-300">{endpoint.summary}</td>
                <td className="px-4 py-3 text-xs">
                  {endpoint.source ? (
                    <a href={endpoint.source.url} className="font-bold text-emerald-700 hover:underline dark:text-emerald-400" target="_blank" rel="noopener noreferrer nofollow">
                      {endpoint.source.name}
                    </a>
                  ) : (
                    <span className="text-stone-400">Bharat Health Guide</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{endpoint.source?.license ?? "Own data"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeading eyebrow="Pricing" id="pricing" title="Plans that scale with you" desc="Quotas are enforced per key per UTC day. No overage surprises: you get a 429 with Retry-After, never a silent drop or a surprise bill." />

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {API_PLANS.map((plan) => (
          <div key={plan.id} className={`flex flex-col rounded-2xl border p-5 ${plan.id === "starter" ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-stone-200 dark:border-stone-700"}`}>
            <p className="font-display text-lg font-black">{plan.name}</p>
            <p className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-300">{monthlyPriceLabel(plan)}</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{plan.tagline}</p>
            <ul className="mt-3 flex-1 space-y-1.5 text-xs">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-1.5"><span className="text-emerald-600">✓</span><span>{feature}</span></li>
              ))}
              <li className="flex gap-1.5"><span className="text-emerald-600">✓</span><span>{plan.support}</span></li>
            </ul>
            <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-400">SLA: {plan.sla}</p>
            <Link
              href={plan.id === "enterprise" ? "/partner-with-us" : "/developers/dashboard"}
              className={`mt-3 rounded-xl px-4 py-2 text-center text-xs font-bold ${plan.id === "free" ? "bg-emerald-700 text-white hover:bg-emerald-600" : "border border-stone-300 hover:border-emerald-400 dark:border-stone-600"}`}
            >
              {plan.id === "free"
                ? "Start free"
                : plan.id === "enterprise"
                  ? "Talk to us"
                  : `Subscribe to ${plan.name}`}
            </Link>
          </div>
        ))}
      </div>

      <SectionHeading eyebrow="Reliability" title="How the API behaves under load" desc="Predictable limits, honest headers, no silent failures." />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { t: "Standard rate-limit headers", d: "X-RateLimit-Limit-Day / Remaining-Day / Limit-Minute / Remaining-Minute and X-RateLimit-Reset on every response." },
          { t: "Machine-readable errors", d: "Every failure returns { ok: false, error: { code, message, docs } } — codes are stable, so you can branch on them." },
          { t: "Cached upstreams", d: "Provider responses are cached with per-source TTLs (10 minutes to 24 hours), so latency stays low and upstream rate limits are respected." },
          { t: "Graceful degradation", d: "If an upstream source is down, endpoints return an empty result set with live: false and a 200 — or 503 with upstream_unavailable where an empty answer would be misleading." },
          { t: "Versioned paths", d: "/api/v1 is frozen for this contract. Breaking changes ship under a new version prefix." },
          { t: "Keys are hashed", d: "Your key is stored as a SHA-256 hash and shown once at creation — a database leak cannot be replayed against the API." },
        ].map((item) => (
          <div key={item.t} className="rounded-2xl border border-stone-200 p-5 dark:border-stone-700">
            <p className="font-bold">{item.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">{item.d}</p>
          </div>
        ))}
      </div>

      <SectionHeading eyebrow="FAQ" title="Questions developers ask" />
      <div className="mt-4"><FaqAccordion faqs={faqs} /></div>

      <div className="mt-8 rounded-3xl bg-gradient-to-br from-emerald-900 to-stone-900 p-6 text-white md:p-8">
        <h2 className="font-display text-2xl font-black">Ship with real Indian health data</h2>
        <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">
          Free tier, one key, OpenAPI spec, and every source&apos;s licence attached to the response. Start with a prototype today and upgrade only when your traffic requires it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/developers/dashboard" className="rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-emerald-950 hover:bg-amber-400">Create a free key</Link>
          <Link href="/api-directory" className="rounded-xl border border-white/25 px-5 py-2.5 font-bold hover:bg-white/10">Browse all {PUBLIC_APIS.length} public APIs</Link>
        </div>
      </div>
    </div>
  );
}
