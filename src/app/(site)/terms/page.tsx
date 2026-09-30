import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/ui/Section";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, { title: "Terms of Use", description: `Terms for using the ${c.business.name} website and tools.`, path: "/terms" });
}

export default async function TermsPage() {
  const c = await getContent();
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of" highlight="use" />
      <section className="prose-royal mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <h2>Health information</h2>
        <p>
          Articles and calculators on this site are general fitness education, not medical advice. Consult a qualified doctor before starting a
          new exercise or diet program, especially if you are pregnant or have a medical condition.
        </p>
        <h2>Prices and offers</h2>
        <p>Membership prices shown online are indicative. The final price and terms are confirmed at the front desk of {c.business.name}.</p>
        <h2>Gym rules</h2>
        <p>Members must follow trainer instructions, use equipment responsibly and follow the club rules displayed at the gym.</p>
        <h2>Content</h2>
        <p>All text, graphics and branding on this site belong to {c.business.name}. Please ask before reusing them.</p>
      </section>
    </>
  );
}
