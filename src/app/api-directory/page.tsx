import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, SectionHeading } from "@/components/ui";
import { SITE } from "@/lib/site";
import { PUBLIC_APIS, PUBLIC_API_CATEGORIES, PUBLIC_API_SOURCE, type PublicApiEntry } from "@/data/public-apis";

const PER_PAGE = 25;

export const metadata: Metadata = {
  title: "Public Health API Directory — 290 Free APIs (Keyless & HTTPS flags) | BHG",
  description:
    "A browsable directory of free public APIs relevant to health, nutrition, research and open data — with auth, HTTPS, CORS and licence flags, and which ones this platform already integrates behind /api/v1.",
  alternates: { canonical: "/api-directory" },
  openGraph: {
    title: "Public Health API Directory | Bharat Health Guide",
    description:
      "290 free public APIs across health, food, science, government and environment categories, with auth and HTTPS flags and integration status.",
    type: "website",
    url: `${SITE.url}/api-directory`,
  },
};

type SearchParams = {
  category?: string;
  q?: string;
  access?: string;
  integrated?: string;
  page?: string;
};

function matches(entry: PublicApiEntry, sp: SearchParams): boolean {
  if (sp.category && sp.category !== "all" && entry.category !== sp.category) return false;
  if (sp.access === "keyless" && !(/^no$/i.test(entry.auth) && entry.https)) return false;
  if (sp.access === "keys" && /^no$/i.test(entry.auth)) return false;
  if (sp.integrated === "yes" && !entry.integrated) return false;
  const q = sp.q?.trim().toLowerCase();
  if (q) {
    const haystack = `${entry.name} ${entry.description} ${entry.category}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function buildHref(sp: SearchParams, overrides: Partial<SearchParams>): string {
  const params = new URLSearchParams();
  const merged = { ...sp, ...overrides };
  if (merged.category && merged.category !== "all") params.set("category", merged.category);
  if (merged.q) params.set("q", merged.q);
  if (merged.access && merged.access !== "all") params.set("access", merged.access);
  if (merged.integrated === "yes") params.set("integrated", "yes");
  if (merged.page && merged.page !== "1") params.set("page", merged.page);
  const query = params.toString();
  return `/api-directory${query ? `?${query}` : ""}`;
}

export default async function ApiDirectoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filtered = PUBLIC_APIS.filter((entry) => matches(entry, sp)).sort((a, b) =>
    a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1), totalPages);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const keyless = filtered.filter((e) => /^no$/i.test(e.auth) && e.https).length;
  const integrated = filtered.filter((e) => e.integrated).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Developers", href: "/developers" }, { label: "API directory" }]} />

      <div className="mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-teal-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Open data · Licence-checked · {PUBLIC_API_SOURCE.totalCategoriesUpstream} categories upstream</p>
        <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">Public health API directory</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-100/90">
          Every free public API in the health-relevant categories we track — {PUBLIC_APIS.length} sources from the{" "}
          <a href={PUBLIC_API_SOURCE.repository} className="underline decoration-amber-300/60 hover:decoration-amber-300" target="_blank" rel="noopener noreferrer">
            public-apis
          </a>{" "}
          catalogue, filtered to the {PUBLIC_API_SOURCE.syncedCategories.length} categories that matter for health, nutrition, research, government and environment data. Entries marked
          <span className="mx-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">INTEGRATED</span>
          are already served through our own <Link href="/developers" className="underline decoration-amber-300/60 hover:decoration-amber-300">developer API</Link>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="rounded-xl bg-white/10 px-3 py-1.5 font-bold">{filtered.length} matching</span>
          <span className="rounded-xl bg-white/10 px-3 py-1.5 font-bold">{keyless} keyless + HTTPS</span>
          <span className="rounded-xl bg-white/10 px-3 py-1.5 font-bold">{integrated} integrated here</span>
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-3xl border border-stone-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 dark:border-stone-700 dark:bg-stone-900" method="get">
        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
          Search
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="e.g. air quality, trials, food"
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-normal text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          />
        </label>
        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
          Category
          <select name="category" defaultValue={sp.category ?? "all"} className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-normal text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
            <option value="all">All categories</option>
            {PUBLIC_API_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
          Access
          <select name="access" defaultValue={sp.access ?? "all"} className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-normal text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
            <option value="all">Any auth</option>
            <option value="keyless">Keyless + HTTPS only</option>
            <option value="keys">Requires a key</option>
          </select>
        </label>
        <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
          Integration
          <select name="integrated" defaultValue={sp.integrated ?? "all"} className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-normal text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
            <option value="all">All sources</option>
            <option value="yes">Integrated here</option>
          </select>
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-600">Filter directory</button>
          <Link href="/api-directory" className="ml-2 inline-block rounded-xl border border-stone-300 px-5 py-2 text-sm font-bold dark:border-stone-600">Reset</Link>
        </div>
      </form>

      <SectionHeading eyebrow="Catalogue" title={`${filtered.length} APIs`} desc={`Showing ${visible.length} of ${filtered.length} — page ${page} of ${totalPages}. Auth and HTTPS flags are as listed upstream; always re-check terms before production use.`} />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-700">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead className="bg-stone-100 text-[11px] uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            <tr>
              <th className="px-4 py-3">API</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Auth</th>
              <th className="px-4 py-3">HTTPS</th>
              <th className="px-4 py-3">CORS</th>
              <th className="px-4 py-3">Status here</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {visible.map((entry) => (
              <tr key={`${entry.category}-${entry.name}`} className="align-top">
                <td className="px-4 py-3">
                  <span className="font-bold">{entry.name}</span>
                  <p className="mt-0.5 max-w-md text-xs text-stone-500 dark:text-stone-400">{entry.description}</p>
                  {entry.url && (
                    <a href={entry.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                      Docs →
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{entry.category}</td>
                <td className="px-4 py-3 text-xs">
                  <span className={`rounded px-1.5 py-0.5 font-bold ${/^no$/i.test(entry.auth) ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"}`}>
                    {entry.auth}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{entry.https ? "✅" : "❌"}</td>
                <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{entry.cors}</td>
                <td className="px-4 py-3 text-xs">
                  {entry.integrated ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      INTEGRATED{entry.apiPath ? ` · /api/v1/${entry.apiPath}` : ""}
                    </span>
                  ) : (
                    <span className="text-stone-400">Not yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <p className="mt-4 rounded-2xl border border-stone-200 p-5 text-sm text-stone-500 dark:border-stone-700">
          No APIs match those filters. <Link href="/api-directory" className="font-bold text-emerald-700 dark:text-emerald-400">Reset the directory</Link>.
        </p>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link href={buildHref(sp, { page: String(page - 1) })} className="rounded-xl border border-stone-300 px-4 py-2 font-bold dark:border-stone-600">← Previous</Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-stone-500">Page {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={buildHref(sp, { page: String(page + 1) })} className="rounded-xl border border-stone-300 px-4 py-2 font-bold dark:border-stone-600">Next →</Link>
          ) : (
            <span />
          )}
        </nav>
      )}

      <div className="mt-8 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-xs leading-relaxed text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
        <p className="font-bold">Provenance &amp; upkeep</p>
        <p className="mt-1">
          Generated by <code className="rounded bg-stone-200 px-1 py-0.5 dark:bg-stone-800">node scripts/sync-public-apis.mjs</code> from{" "}
          <a href={PUBLIC_API_SOURCE.repository} className="font-bold text-emerald-700 hover:underline dark:text-emerald-400" target="_blank" rel="noopener noreferrer">{PUBLIC_API_SOURCE.repository}</a>{" "}
          ({PUBLIC_API_SOURCE.licence}), last synced {PUBLIC_API_SOURCE.generatedAt.slice(0, 10)}. Auth, HTTPS and CORS flags are reproduced as listed upstream — they are a starting point for evaluation, not a guarantee.
          Each API keeps its own terms, rate limits and attribution requirements.
        </p>
      </div>
    </div>
  );
}
