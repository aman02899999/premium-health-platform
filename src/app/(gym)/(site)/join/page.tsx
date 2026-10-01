import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { whatsappHref } from "@/lib/site";
import { PageHero } from "@/components/ui/Section";
import { JoinCheckout } from "@/components/join/JoinCheckout";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return {
    ...pageMeta(c, {
      title: "Join Online — Pay for Your Membership",
      description: `Join ${c.business.name} online: pick a single or couple plan and pay securely with UPI, card or net banking.`,
      path: "/join",
    }),
    robots: { index: false, follow: true },
  };
}

export default async function JoinPage() {
  const c = await getContent();
  const b = c.business;
  const plans = c.plans.filter((p) => p.price > 0);
  return (
    <>
      <PageHero eyebrow="Join online" title="Start" highlight="today" intro="Pick your plan, pay securely, and show your confirmation at the front desk." />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {razorpayConfigured() ? (
          <Suspense>
            <JoinCheckout plans={plans} gymName={b.name} whatsapp={b.whatsapp} />
          </Suspense>
        ) : (
          <div className="glass brand-border space-y-4 rounded-3xl p-8 text-center">
            <p className="text-white/80">Online payment is being set up. Book a free trial or message us to join today.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/contact#trial" className="btn-brand rounded-full px-6 py-3 font-bold">
                Book a free trial
              </Link>
              <a href={whatsappHref(b, `Hi ${b.name}, I'd like to join.`)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white">
                WhatsApp us
              </a>
            </div>
          </div>
        )}
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-white/45">
          <ShieldCheck className="h-4 w-4" /> Payments are processed by Razorpay. We never see or store your card or UPI details.
        </p>
      </section>
    </>
  );
}
