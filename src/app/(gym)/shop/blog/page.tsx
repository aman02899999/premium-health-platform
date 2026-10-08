import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/shop/server";
import { listPosts } from "@/lib/shop/store";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Supplement Guides — Protein, Creatine, Pre-Workout, Aminos",
  description: "Evidence-based guides to whey protein, creatine, pre-workout, EAA, BCAA, glutamine and multivitamins — what works, doses and safety.",
  alternates: { canonical: "/shop/blog" },
};

export default async function ShopBlog() {
  const { offline } = await getCatalog();
  const posts = offline ? [] : await listPosts().catch(() => []);
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-4xl text-white sm:text-5xl">Supplement guides</h1>
      <p className="mt-2 max-w-2xl text-white/60">Plain-language guides from our coaches: what each supplement does, how much to take, and who should be careful.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <article key={p.id} className="flex flex-col rounded-3xl border border-white/10 bg-white/[.03] p-5 transition hover:border-amber-300/40">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300/80">{p.tags[0] ?? "Guide"}</p>
            <h2 className="mt-2 text-lg font-bold text-white">
              <Link href={`/shop/blog/${p.slug}`} className="hover:text-amber-200">
                {p.title}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm text-white/60">{p.excerpt}</p>
            <Link href={`/shop/blog/${p.slug}`} className="mt-4 inline-block py-1 text-sm font-bold text-amber-300">
              Read guide →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
