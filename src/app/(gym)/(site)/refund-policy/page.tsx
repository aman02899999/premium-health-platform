import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/ui/Section";
import { ACCESS_DAYS } from "@/lib/library/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, { title: "Refund & Cancellation Policy", description: `Refunds and cancellations for ${c.business.name} memberships and Premium Library eBooks.`, path: "/refund-policy" });
}

export default async function RefundPolicyPage() {
  const c = await getContent();
  const b = c.business;
  return (
    <>
      <PageHero eyebrow="Legal" title="Refund &" highlight="cancellation" />
      <section className="prose-royal mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <p>Last updated: 1 October 2026. This policy covers payments made on this website to {b.name}.</p>

        <h2>Premium Library eBooks (PDF)</h2>
        <ul>
          <li>eBooks are digital products delivered instantly, so we don&apos;t offer refunds once any book in your order has been downloaded.</li>
          <li>If you haven&apos;t downloaded anything, you can cancel within 7 days of payment for a full refund.</li>
          <li>If a file is damaged, won&apos;t open, or isn&apos;t the book you paid for, we&apos;ll send a working copy — or refund you if we can&apos;t fix it within 3 working days.</li>
          <li>Charged twice, or charged but no download page? We refund duplicate or failed payments in full.</li>
        </ul>

        <h2>Gym memberships</h2>
        <ul>
          <li>A membership paid online can be cancelled for a full refund until it is activated at the front desk (your first visit), within 7 days of payment.</li>
          <li>Once activated, membership fees are not refundable, and memberships can&apos;t be transferred to another person. For medical reasons or relocation, talk to us — we&apos;ll consider pausing your plan.</li>
          <li>Duplicate or failed payments are refunded in full.</li>
        </ul>

        <h2>How to ask for a refund</h2>
        <p>
          Call or WhatsApp us on {b.phone} with your name, the email or phone used to pay, and your Razorpay payment ID (it&apos;s in your payment
          confirmation and on your download page).
        </p>
        <h2>When you&apos;ll get your money</h2>
        <p>Approved refunds go back to the original payment method (UPI, card or net banking) within 5–7 working days, depending on your bank.</p>
        <p>
          See also our <Link href="/delivery-policy">Delivery Policy</Link> and <Link href="/terms">Terms</Link>. eBook download links stay active for{" "}
          {ACCESS_DAYS} days after purchase.
        </p>
      </section>
    </>
  );
}
