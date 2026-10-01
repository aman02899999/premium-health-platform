import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/ui/Section";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, { title: "Terms of Use", description: `Terms for using the ${c.business.name} website, tools and Premium Library.`, path: "/terms" });
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
        <h2>Premium Library eBooks</h2>
        <p>
          Buying an eBook gives you a personal, non-transferable licence to read it. Each PDF is watermarked to its buyer; please don&apos;t share,
          resell or upload it. Books are educational and don&apos;t replace advice from your doctor. Drug-education titles contain no doses, cycles
          or sources. Prices are in Indian rupees and include applicable taxes. Payments are processed securely by Razorpay; we never see your card
          or UPI details. Refunds follow our <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>, and delivery our{" "}
          <Link href="/delivery-policy">Delivery Policy</Link>.
        </p>
        <h2>Reviews</h2>
        <p>Only verified buyers can review a book. We check every review before publishing it and may decline reviews that are abusive, off-topic or contain personal or promotional content.</p>
        <h2>Content</h2>
        <p>All text, graphics and branding on this site belong to {c.business.name}. Please ask before reusing them.</p>
      </section>
    </>
  );
}
