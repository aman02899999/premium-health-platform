import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Search Blog — SEO Optimized",
  description: "Search health guides — diabetes, thyroid, PCOS, nutrition, Ayurveda — SEO optimized with categories, latest, trending.",
  alternates: { canonical: "/blog/search" },
};

export default async function BlogSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const all = getAllEnrichedArticles();
  const filtered = q
    ? all.filter((a) => `${a.title} ${a.excerpt} ${a.tags.join(" ")} ${a.category}`.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Search" }]} />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-emerald-900 p-6 text-white md:p-8">
        <h1 className="font-display text-3xl font-black">Search Blog — SEO Optimized</h1>
        <p className="mt-2 text-sm text-emerald-100/90">Search {all.length} guides — try diabetes, thyroid, millets, yoga. Internal linking + freshness + categories = pro SEO.</p>
        <form className="mt-4 flex gap-2">
          <input name="q" defaultValue={q} placeholder="Search guides: diabetes, thyroid, millets…" className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm placeholder:text-emerald-200/60" />
          <button type="submit" className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-900">Search</button>
        </form>
      </div>

      <div className="mt-6">
        {q ? (
          <>
            <p className="text-sm text-stone-600">{filtered.length} results for "{q}"</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <Link key={a.slug} href={`/blog/${a.slug}`} className="group overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
                  <div className="relative aspect-[16/9] w-full">
                    <Image src={a.heroImage} alt={a.heroImageAlt} fill className="object-cover group-hover:scale-105 transition" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase text-amber-600">{a.category}</p>
                    <h3 className="mt-1 font-bold group-hover:text-emerald-700">{a.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-stone-500">Enter search term above — SEO optimized with categories, latest, trending, related.</p>
        )}
      </div>
    </div>
  );
}
