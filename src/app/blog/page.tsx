import type { Metadata } from "next";
import BlogClient from "./BlogClient";
import { getAllEnrichedArticles } from "@/data/blog-enrichment";
import { Breadcrumbs } from "@/components/ui";
import { SITE } from "@/lib/site";
import { itemListJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Health Blog — In-Depth Indian Guides on Diabetes, Thyroid, PCOS, Nutrition & Ayurveda",
  description: "Evidence-informed, India-specific long-form health guides: diabetes, blood pressure, thyroid, PCOS, fatty liver, anemia, yoga and Ayurveda — with real photos, FAQs and references.",
  keywords: ["Indian health blog", "diabetes guide India", "thyroid guide", "PCOS guide", "Ayurveda blog", "nutrition India", "health articles"],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Health Blog | Bharat Health Guide",
    description: "In-depth, India-specific health guides with photos, FAQs and guideline references.",
    type: "website",
    url: `${SITE.url}/blog`,
  },
};

export default function BlogPage() {
  const articles = getAllEnrichedArticles();
  const totalFaqs = articles.reduce((n, a) => n + a.faqs.length, 0);
  const totalSections = articles.reduce((n, a) => n + a.body.length, 0);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(articles.map((a) => ({ name: a.title, path: `/blog/${a.slug}`, image: a.heroImage })))) }} />
      <div className="mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-teal-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Evidence-informed · India-specific · Fully referenced</p>
        <h1 className="font-display mt-2 text-3xl font-black md:text-4xl">Health Blog: guides worth bookmarking</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-100/90">
          {articles.length} long-form guides · {totalSections} detailed sections · {totalFaqs} answered questions · real photography throughout.
          Filter by category tabs below, search topics, or start with a featured cornerstone guide.
        </p>
      </div>
      <BlogClient articles={articles} />
    </div>
  );
}
