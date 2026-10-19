import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/content/store";
import { applyOffer } from "@/lib/offers";
import { todayIST } from "@/lib/growth/dates";
import { pageMeta } from "@/lib/seo";
import { absoluteUrl, formatINR } from "@/lib/site";
import { basePlan, perMonth, planFaqs, planFeatures, savingPct } from "@/lib/content/plans";
import { PrintButton } from "@/components/membership/PrintButton";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Membership Price Sheet",
    description: `One-page printable price sheet for ${c.business.name} memberships in Sector 93, Noida: single and couple prices, cost per month and what each plan includes.`,
    path: "/membership/price-sheet",
  });
}

/** One A4 page, light colours, for printing or saving as PDF from the browser. */
export default async function PriceSheetPage() {
  const c = await getContent();
  const today = todayIST();
  const plans = applyOffer(c.plans, today);
  const { features, has } = planFeatures(plans);
  const base = basePlan(plans);
  const b = c.business;
  const offerEnds = plans.find((p) => p.offer)?.offer?.endsOn;
  const terms = planFaqs(b);
  const td = "border border-neutral-300 px-2 py-1.5 text-center";

  return (
    <div className="min-h-screen bg-neutral-100 py-6 text-neutral-900 print:bg-white print:py-0">
      <style>{"@page{size:A4;margin:12mm}@media print{body{background:#fff!important}.noise::before{display:none!important}}"}</style>
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <Link href="/membership" className="text-sm text-neutral-600 underline">
          ← Back to membership
        </Link>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-[210mm] bg-white p-8 shadow print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-4 border-[#e8394b] pb-3">
          <div>
            <h1 className="font-display text-3xl uppercase text-[#04466d]">{b.name}</h1>
            <p className="text-sm text-neutral-600">
              {b.address.street}, {b.address.locality}, {b.address.city} {b.address.postalCode}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Membership price sheet</p>
            <p className="text-neutral-600">Prices as of {today}</p>
          </div>
        </header>

        <table className="mt-5 w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#04466d] text-white">
              <th className="border border-[#04466d] px-2 py-2 text-left">Plan</th>
              {plans.map((p) => (
                <th key={p.id} className="border border-[#04466d] px-2 py-2">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="border border-neutral-300 px-2 py-1.5 text-left">Duration</th>
              {plans.map((p) => <td key={p.id} className={td}>{p.duration}</td>)}
            </tr>
            <tr className="bg-neutral-50">
              <th className="border border-neutral-300 px-2 py-1.5 text-left">Price (1 person)</th>
              {plans.map((p) => <td key={p.id} className={`${td} font-bold`}>{formatINR(p.price)}</td>)}
            </tr>
            <tr>
              <th className="border border-neutral-300 px-2 py-1.5 text-left">Per month</th>
              {plans.map((p) => <td key={p.id} className={td}>≈ {formatINR(perMonth(p))}</td>)}
            </tr>
            <tr className="bg-neutral-50">
              <th className="border border-neutral-300 px-2 py-1.5 text-left">Saving vs {base?.name}</th>
              {plans.map((p) => <td key={p.id} className={td}>{savingPct(p, base) ? `${savingPct(p, base)}%` : "—"}</td>)}
            </tr>
            <tr>
              <th className="border border-neutral-300 px-2 py-1.5 text-left">Couple (2 people)</th>
              {plans.map((p) => <td key={p.id} className={td}>{p.couplePrice > 0 ? formatINR(p.couplePrice) : "—"}</td>)}
            </tr>
            {features.map((f, i) => (
              <tr key={f} className={i % 2 ? "" : "bg-neutral-50"}>
                <th className="border border-neutral-300 px-2 py-1.5 text-left font-normal">{f}</th>
                {plans.map((p) => <td key={p.id} className={td}>{has(p.id, f) ? "✓" : ""}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {offerEnds && <p className="mt-2 text-[11px] text-neutral-600">Offer prices are valid until {offerEnds}; standard prices apply after that. Couple prices are standard prices.</p>}
        {c.planNote && <p className="mt-1 text-[11px] text-neutral-600">{c.planNote}</p>}

        <section className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] leading-snug">
          {terms.map((t) => (
            <div key={t.id}>
              <p className="font-semibold text-[#04466d]">{t.q}</p>
              <p className="text-neutral-700">{t.a}</p>
            </div>
          ))}
        </section>

        <footer className="mt-5 flex flex-wrap justify-between gap-2 border-t border-neutral-300 pt-3 text-[11px] text-neutral-700">
          <span>Call / WhatsApp {b.phone}</span>
          <span>Free trial session for new members</span>
          <span>{absoluteUrl("/membership").replace(/^https?:\/\//, "")}</span>
        </footer>
      </article>
    </div>
  );
}
