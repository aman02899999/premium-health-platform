import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import { AuthorBox, AuthorList } from "@/components/blog/AuthorBox";
import { LatestArticles } from "@/components/blog/LatestArticles";

export const metadata: Metadata = {
  title: "Authors — BHG Editorial Team & Reviewers | SEO Optimized",
  description: "Meet BHG authors and medical reviewers — evidence-reviewed health writers, E-E-A-T optimized, SEO optimized.",
  alternates: { canonical: "/blog/author" },
};

export default function BlogAuthorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Authors" }]} />
      <h1 className="font-display mt-3 text-4xl font-black">Authors & Reviewers — E-E-A-T</h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Expertise, Experience, Authority, Trust — SEO & SSO optimized. Every article has author + reviewer + citations.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AuthorList />
          <AuthorBox author="BHG Editorial Team" role="Evidence-reviewed health writers · 12 articles" reviewer="Dr. Placeholder (medical review pending)" />
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">E-E-A-T SEO</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-stone-600 dark:text-stone-300">
              <li>Author Person JSON-LD + sameAs links</li>
              <li>ReviewedBy + medicalReviewedBy in Article schema</li>
              <li>Citations to PubMed / ICMR / FSSAI</li>
              <li>About page + Contact + Editorial Policy — trust signals</li>
            </ul>
          </div>
        </div>
        <div>
          <LatestArticles limit={6} />
        </div>
      </div>
    </div>
  );
}
