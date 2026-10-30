import type { ReactNode } from "react";
import { getContent } from "@/lib/content/store";
import { localBusinessJsonLd, websiteJsonLd } from "@/lib/seo";
import { telHref, whatsappHref } from "@/lib/site";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { FloatingActions } from "@/components/ui/FloatingActions";
import { WhatsAppCapture } from "@/components/ui/WhatsAppCapture";
import { JsonLd } from "@/components/ui/JsonLd";
import { activeOffer } from "@/lib/offers";
import { todayIST } from "@/lib/growth/dates";
import { shopOpen } from "@/lib/shop/server";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [c, storeOpen] = await Promise.all([getContent(), shopOpen()]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <JsonLd data={[localBusinessJsonLd(c), websiteJsonLd(c)]} />
      <Header name={c.business.name} phoneHref={telHref(c.business.phone)} announcement={activeOffer(todayIST(), c.offers)?.banner || c.announcement} storeOpen={storeOpen} />
      <main id="main">{children}</main>
      <Footer content={c} storeOpen={storeOpen} />
      <FloatingActions whatsapp={whatsappHref(c.business)} phone={telHref(c.business.phone)} />
      <WhatsAppCapture whatsapp={c.business.whatsapp} />
    </>
  );
}
