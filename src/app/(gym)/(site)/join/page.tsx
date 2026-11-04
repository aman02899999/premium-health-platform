import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { whatsappHref } from "@/lib/site";
import { PageHero } from "@/components/ui/Section";
import { JoinCheckout, type JoinPrefill } from "@/components/join/JoinCheckout";
import { memberByCode, memberByRenewToken } from "@/lib/growth/members";
import { formatDate } from "@/lib/growth/dates";
import { REFERRED_BONUS_DAYS, looksLikeReferralCode } from "@/lib/growth/config";
import { inviteBanner } from "@/lib/growth/invite";
import { Gift, ShieldCheck } from "lucide-react";
import { applyOffer } from "@/lib/offers";
import { todayIST } from "@/lib/growth/dates";

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

export default async function JoinPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const c = await getContent();
  const b = c.business;
  const plans = applyOffer(c.plans, todayIST(), c.offers).filter((p) => p.price > 0);
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  // /join?renew=<token> comes from a renewal reminder; /join?ref=<code> from a member's share link.
  let prefill: JoinPrefill | undefined;
  const renewing = one("renew") ? await memberByRenewToken(one("renew")).catch(() => null) : null;
  if (renewing) prefill = { name: renewing.name, phone: renewing.phone, email: renewing.email ?? "", renewal: { planName: renewing.planName, expiresOn: formatDate(renewing.expiresOn) } };
  else if (looksLikeReferralCode(one("ref"))) prefill = { referredBy: one("ref").toUpperCase() };
  // A real member's code gets a welcome naming them (first name only); an unknown code is still
  // prefilled, since the reward check happens at payment.
  const inviter = !renewing && prefill?.referredBy ? await memberByCode(prefill.referredBy).catch((err: Error) => (console.error("[join] referral lookup:", err.message), null)) : null;
  const banner = inviter ? inviteBanner(inviter.name, REFERRED_BONUS_DAYS) : null;
  return (
    <>
      <PageHero eyebrow="Join online" title="Start" highlight="today" intro="Pick your plan, pay securely, and show your confirmation at the front desk." />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {banner && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-brand/10 p-4 ring-1 ring-brand/30">
            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-bold text-white">{banner.title}</p>
              <p className="mt-1 text-sm text-white/75">{banner.body}</p>
            </div>
          </div>
        )}
        {razorpayConfigured() ? (
          // The form streams in after the page; holding its space stops the footer jumping under the visitor.
          <Suspense fallback={<div aria-hidden className="glass min-h-[90rem] animate-pulse rounded-3xl sm:min-h-[58rem]" />}>
            <JoinCheckout plans={plans} gymName={b.name} whatsapp={b.whatsapp} prefill={prefill} />
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
