import type { Metadata } from "next";
import { Clock, MapPin, Phone } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { formatTime, hoursDays, fullAddress, instagramHref, telHref, whatsappHref } from "@/lib/site";
import { LeadForm } from "@/components/home/LeadForm";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Contact & Free Trial — Gym in Sector 93 Noida",
    description: `Book a free trial at ${c.business.name}. Call ${c.business.phone}, WhatsApp us or visit ${fullAddress(c.business)}.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const c = await getContent();
  const b = c.business;
  const cards = [
    { icon: Phone, title: "Call us", body: b.phone, sub: b.altPhone, href: telHref(b.phone) },
    { icon: MapPin, title: "Visit", body: fullAddress(b), href: b.googleMapsUrl },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <PageHero eyebrow="Contact" title="Let's get" highlight="started" intro="Book a free trial, ask about plans or just drop by — we're on Gejha Main Road." />
      <section id="trial" className="mx-auto grid max-w-7xl scroll-mt-28 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          {cards.map((card) => (
            <a key={card.title} href={card.href} target={card.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="glass flex gap-4 rounded-2xl p-5 hover:ring-1 hover:ring-brand/50">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15">
                <card.icon className="h-6 w-6 text-brand" />
              </span>
              <span>
                <span className="block text-sm uppercase tracking-widest text-white/50">{card.title}</span>
                <span className="block font-semibold text-white">{card.body}</span>
                {card.sub && <span className="block text-sm text-white/60">{card.sub}</span>}
              </span>
            </a>
          ))}
          <div className="glass flex gap-4 rounded-2xl p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <Clock className="h-6 w-6 text-brand" />
            </span>
            <ul>
              <li className="text-sm uppercase tracking-widest text-white/50">Hours</li>
              {b.hours.map((h) => (
                <li key={h.label + h.open} className="text-white">
                  <span className="text-white/70">{h.label || h.days}:</span> {formatTime(h.open)} – {formatTime(h.close)}
                </li>
              ))}
              <li className="text-sm text-white/50">{hoursDays(b.hours)}</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={whatsappHref(b)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-bold text-white">
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp
            </a>
            <a href={instagramHref(b.instagram)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-semibold text-white hover:border-brand">
              <InstagramIcon className="h-5 w-5" /> @{b.instagram}
            </a>
          </div>
        </div>
        <LeadForm whatsapp={b.whatsapp} gymName={b.name} source="contact" />
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-3xl ring-1 ring-brand/30">
          <iframe
            title={`Map to ${b.name}`}
            src={b.mapEmbedUrl}
            className="h-[420px] w-full grayscale-[60%] invert-[92%] hue-rotate-180"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}
