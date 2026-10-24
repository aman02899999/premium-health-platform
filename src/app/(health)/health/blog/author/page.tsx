import type { Metadata } from "next";
import { Breadcrumbs } from "@/health/components/ui";
import { AuthorBox, AuthorList } from "@/health/components/blog/AuthorBox";
import { LatestArticles } from "@/health/components/blog/LatestArticles";

export const metadata: Metadata = {
  title: "Authors — Editorial Team & Reviewers",
  description: "Who writes the Bharat Health Guide, how the guides are checked, and their medical review status.",
  alternates: { canonical: "/health/blog/author" },
};

export default function BlogAuthorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Blog", href: "/health/blog" }, { label: "Authors" }]} />
      <h1 className="font-display mt-3 text-4xl font-black">Authors & Reviewers</h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Who writes these guides, and how they are checked.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AuthorList />
          <AuthorBox author="Editorial Team" role="Health writers at Royal Fitness Club" />
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">How we earn your trust</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-stone-600 dark:text-stone-300">
              <li>Every guide cites its sources, such as PubMed, ICMR and FSSAI</li>
              <li>Every page shows when it was last updated</li>
              <li>A page a doctor has not reviewed yet says &ldquo;Not yet medically reviewed&rdquo;. We do not invent reviewers</li>
              <li>Our <a href="/health/about" className="font-bold text-emerald-700 underline">editorial policy</a> explains how we write and correct pages</li>
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
