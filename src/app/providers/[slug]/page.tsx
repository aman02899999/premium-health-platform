import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, AdSlot, DisclaimerBar } from "@/components/ui";
import { UniquePageSEO } from "@/components/seo/UniquePageSEO";
import { SITE } from "@/lib/site";
import { BUSINESS_LISTINGS } from "@/lib/monetization/config";
import { LeadForm } from "@/components/monetization/LeadForm";
import { LEAD_FORMS } from "@/lib/monetization/config";
import { PremiumCTA } from "@/components/earning/PremiumCTA";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BUSINESS_LISTINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = BUSINESS_LISTINGS.find((l) => l.slug === slug);
  if (!listing) return { title: "Provider not found" };
  const title = `${listing.title} — ${listing.providerType} | BHG`.slice(0, 60);
  const desc = `${listing.description} ${listing.location} — ${listing.tier} listing.`.slice(0, 155);
  const ogImage = `${SITE.url}/api/og?title=${encodeURIComponent(listing.title)}&category=${encodeURIComponent(listing.providerType)}&type=tool`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/providers/${slug}`, languages: { "en-IN": `${SITE.url}/providers/${slug}`, en: `${SITE.url}/providers/${slug}`, "x-default": `${SITE.url}/providers/${slug}` } },
    openGraph: { title, description: desc, url: `${SITE.url}/providers/${slug}`, type: "website", images: [{ url: ogImage, width: 1200, height: 630, alt: title }] },
  };
}

export default async function ProviderSlugPage({ params }: Props) {
  const { slug } = await params;
  const listing = BUSINESS_LISTINGS.find((l) => l.slug === slug);
  if (!listing) notFound();
  const leadForm = LEAD_FORMS[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Providers", href: "/providers" }, { label: listing.title }]} />
      <UniquePageSEO
        breadcrumbs={[{ name: "Home", item: "/" }, { name: "Providers", item: "/providers" }, { name: listing.title, item: `/providers/${slug}` }]}
        faqs={[
          { q: `Who is ${listing.title}?`, a: `${listing.description} Location: ${listing.location}. Tier: ${listing.tier}. Credentials: ${listing.credentials}. Demo listing — not medical endorsement. Clearly separate Featured from Recommended based on clinical evidence.` },
        ]}
        howTo={{ name: "How to contact provider", steps: ["View profile + credentials + location + tier", "Check verification status — demo not verified", "Submit inquiry via lead form — minimal data", "Wait for contact within 24h"] }}
      />
      <div className="mt-3 rounded-3xl bg-gradient-to-br from-stone-900 to-violet-900 p-6 text-white md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">{listing.providerType} · {listing.tier} · {listing.location} · {listing.verified ? "Verified" : "Demo — Not Verified"}</p>
        <h1 className="font-display mt-1 text-3xl font-black">{listing.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/90">{listing.description} Credentials: {listing.credentials}. Do not imply paid listing = medically superior.</p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-900">
            <h2 className="font-bold">About — {listing.providerType}</h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{listing.description} Location: {listing.location}. Tier: {listing.tier}. This is a demo listing — in production, verify credentials via admin dashboard /admin/earning.</p>
            <p className="mt-3 text-[11px] text-stone-400">Clearly separate Featured from Recommended based on clinical evidence. Do not fabricate provider credentials. Demo content clearly marked.</p>
          </div>
          <LeadForm config={leadForm} page={`/providers/${slug}`} />
        </div>
        <div className="space-y-4">
          <PremiumCTA compact />
        </div>
      </div>
      <div className="mt-8 space-y-4"><AdSlot slot="Provider detail footer" /><DisclaimerBar compact /></div>
    </div>
  );
}
