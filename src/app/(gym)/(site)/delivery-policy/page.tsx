import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { fullAddress } from "@/lib/site";
import { PageHero } from "@/components/ui/Section";
import { ACCESS_DAYS, DOWNLOADS_PER_BOOK } from "@/lib/library/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, { title: "Shipping & Delivery Policy", description: `How ${c.business.name} delivers eBooks and activates memberships. No physical shipping.`, path: "/delivery-policy" });
}

export default async function DeliveryPolicyPage() {
  const c = await getContent();
  const b = c.business;
  return (
    <>
      <PageHero eyebrow="Legal" title="Shipping &" highlight="delivery" />
      <section className="prose-royal mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <p>Last updated: 1 October 2026. We don&apos;t ship physical goods — everything sold on this website is delivered digitally or at the gym.</p>

        <h2>Premium Library eBooks</h2>
        <ul>
          <li>Delivery is instant: after a successful payment you&apos;re taken to a private download page with every book in your order.</li>
          <li>Each book can be downloaded {DOWNLOADS_PER_BOOK} times, and the link stays active for {ACCESS_DAYS} days.</li>
          <li>Bookmark your download page. If you lose it, use <Link href="/library/recover">Recover my books</Link> with your email and Razorpay payment ID.</li>
          <li>Books are PDFs and open on any phone, tablet or computer. Buyers anywhere in the world receive them the same way.</li>
        </ul>

        <h2>Gym memberships</h2>
        <p>
          Memberships bought online are activated at the front desk on your first visit to {b.name}, {fullAddress(b)}. Bring the phone number you paid with.
        </p>

        <h2>Problems with delivery</h2>
        <p>
          If payment succeeded but you didn&apos;t reach your download page, call or WhatsApp us on {b.phone}. See our{" "}
          <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> for refunds.
        </p>
      </section>
    </>
  );
}
