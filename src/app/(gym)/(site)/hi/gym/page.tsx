import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { HI_GYM, hiGymLanguages, hindiHours } from "@/lib/content/hindi-gym";
import { livePriceRows } from "@/lib/blog/gym-choice";
import { activeOffer } from "@/lib/offers";
import { todayIST } from "@/lib/growth/dates";
import { breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl, formatINR, telHref, whatsappHref } from "@/lib/site";
import { PageHero, SectionHeading } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 86400; // 1 day: ISR writes are capped (see src/lib/isr-budget.test.ts)

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  const meta = pageMeta(c, { title: HI_GYM.title, description: HI_GYM.description, path: HI_GYM.path });
  return {
    ...meta,
    // The layout's title template would add the English name a second time.
    title: { absolute: HI_GYM.title },
    alternates: { canonical: absoluteUrl(HI_GYM.path), languages: hiGymLanguages() },
    openGraph: { ...meta.openGraph, locale: "hi_IN" },
  };
}

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function HindiGymPage() {
  const c = await getContent();
  const b = c.business;
  const today = todayIST();
  const rows = livePriceRows(c.plans, today, c.offers);
  const offer = activeOffer(today, c.offers);
  const wa = whatsappHref(b, `नमस्ते ${b.name}, मुझे फ्री ट्रायल सेशन बुक करना है।`);
  const hours = hindiHours(b.hours);
  // The hours answer is filled from the saved hours, so it can't drift from the real timings.
  const faqs = HI_GYM.faqs.map((f) => (f.a === "HOURS" ? { q: f.q, a: hours } : { q: f.q, a: f.a }));
  const address = `${b.address.street}, ${b.address.locality}, ${b.address.city}, ${b.address.region} ${b.address.postalCode}`;
  return (
    <div lang="hi">
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "हिंदी", path: HI_GYM.path }]),
          faqJsonLd(faqs),
        ]}
      />
      <PageHero eyebrow={HI_GYM.eyebrow} title={HI_GYM.h1} highlight={HI_GYM.h1Highlight} intro={HI_GYM.intro} />

      <section className="mx-auto max-w-3xl px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/contact#trial" className="btn-brand rounded-full px-6 py-3 text-sm font-semibold">फ्री ट्रायल बुक करें</Link>
          <a href={wa} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-brand">
            <MessageCircle className="h-4 w-4" /> WhatsApp करें
          </a>
          <a href={telHref(b.phone)} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-brand">
            <Phone className="h-4 w-4" /> {b.phone}
          </a>
        </div>
        <p className="mt-3 text-center text-sm text-white/60">
          <Link href="/" hrefLang="en" className="underline hover:text-brand">Read in English</Link>
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="क्यों रॉयल फिटनेस" title="जिम में" highlight="क्या मिलेगा" />
        <ul className="grid gap-4 sm:grid-cols-2">
          {HI_GYM.why.map((w) => (
            <li key={w.t} className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-white">{w.t}</h3>
              <p className="mt-1 text-white/70">{w.d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-white/60">
          {b.rating.source} पर {b.rating.value} रेटिंग ({b.rating.count}+ रेटिंग)।
        </p>
      </section>

      <section aria-labelledby="hi-prices" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h2 id="hi-prices" className="font-display text-center text-3xl text-white">आज के दाम</h2>
        <p className="mt-2 text-center text-sm text-white/60">
          {offer ? `फेस्टिव दाम ${fmtDay(offer.endsOn)} तक। कपल के दाम सामान्य रहेंगे।` : "मेंबरशिप पेज वाले ही दाम।"}
        </p>
        <ul className="mt-5 space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-white" lang="en">{r.name}</span>
                <span className="whitespace-nowrap">
                  {r.standardPrice > 0 && <s className="mr-1.5 text-sm text-white/40">{formatINR(r.standardPrice)}</s>}
                  <span className="font-semibold text-white">{formatINR(r.price)}</span>
                </span>
              </div>
              <p className="mt-1 text-sm text-white/70" lang="en">{r.gets}</p>
              <p className="mt-1 text-xs text-white/50">
                {r.perMonth ? `${formatINR(r.perMonth)} प्रति महीना` : ""}
                {r.perMonth && r.couplePrice ? " · " : ""}
                {r.couplePrice ? `कपल ${formatINR(r.couplePrice)}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-center">
          <Link href="/membership" className="text-brand underline-offset-4 hover:underline">सारे प्लान और नियम देखें</Link>
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="प्रोग्राम" title="आपका" highlight="लक्ष्य" />
        <ul className="flex flex-wrap justify-center gap-3">
          {HI_GYM.programs.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="inline-block rounded-full border border-white/15 px-5 py-2.5 text-white hover:border-brand">{p.t}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h2 className="font-display text-center text-3xl text-white">समय और पता</h2>
        <div className="glass mt-5 space-y-3 rounded-2xl p-5 text-white/80">
          <p>{hours}</p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand" />
            <span lang="en">{address}</span>
          </p>
          <a href={b.googleMapsUrl} className="text-brand underline-offset-4 hover:underline">Google Maps पर रास्ता देखें</a>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-center text-3xl text-white">अक्सर पूछे जाने वाले सवाल</h2>
        <div className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10">
          {faqs.map((f, i) => (
            <details key={f.q} className="group p-5" open={i === 0}>
              <summary className="cursor-pointer list-none font-semibold text-white [&::-webkit-details-marker]:hidden">{f.q}</summary>
              <p className="mt-2 text-white/75">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="font-display text-center text-2xl text-white">हिंदी में पढ़ें</h2>
        <ul className="mt-4 space-y-2 text-center">
          {HI_GYM.guides.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="text-brand underline-offset-4 hover:underline">{g.t}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
