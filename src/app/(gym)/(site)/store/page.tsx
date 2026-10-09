import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Ban, MessageCircle, ShieldCheck, ShoppingBag, Tag } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { whatsappHref } from "@/lib/site";
import { STORE_PRODUCTS } from "@/lib/store/supplements";
import { PageHero } from "@/components/ui/Section";
import { StoreGrid } from "@/components/store/StoreGrid";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Supplement Store — Whey, Creatine & Gym Gear Picked by Our Coaches",
    description: `Whey protein, creatine, peanut butter and gym gear recommended by the coaches at ${c.business.name}. Genuine brands, live prices on Amazon, no steroids or banned substances.`,
    path: "/store",
  });
}

const PROMISES = [
  { icon: BadgeCheck, title: "Picked by our coaches", text: "Only what we'd recommend to members on the floor." },
  { icon: ShieldCheck, title: "Genuine brands", text: "Well-known, lab-tested brands. Buy from the brand's official store." },
  { icon: Ban, title: "Nothing banned", text: "No steroids or banned substances — ever." },
  { icon: Tag, title: "Live prices", text: "Prices and offers update on Amazon, so you always see today's deal." },
];

export default async function StorePage() {
  const c = await getContent();
  const picks = STORE_PRODUCTS.filter((p) => p.pick).length;
  return (
    <>
      <PageHero
        eyebrow="Royal Supplement Store"
        title="Fuel that"
        highlight="actually works"
        intro={`${STORE_PRODUCTS.length} supplements and gym essentials our coaches trust — protein, creatine, healthy snacks and gear. ${picks} coach's picks to start with.`}
      />

      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <Link href="/shop" className="mb-6 flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 p-5 text-black sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <span>
            <span className="font-display block text-2xl leading-none sm:text-3xl">Buy direct from our own store</span>
            <span className="mt-1 block text-sm font-semibold text-black/75">Mega sale — protein, pre-workout and aminos up to 50% off, multivitamins 30% off, plus value combos. Delivered home.</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-black px-5 py-3 text-sm font-bold text-amber-300 sm:self-auto">
            <ShoppingBag className="h-4 w-4" /> Shop the sale
          </span>
        </Link>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="glass brand-border rounded-2xl p-4 sm:p-5">
              <Icon className="h-5 w-5 text-brand sm:h-6 sm:w-6" />
              <p className="mt-2 text-sm font-semibold text-white sm:mt-3 sm:text-base">{title}</p>
              <p className="mt-1 hidden text-sm text-white/60 sm:block">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <StoreGrid products={STORE_PRODUCTS} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="glass brand-border flex flex-col items-start justify-between gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-display text-2xl text-white">Not sure what you need?</h2>
            <p className="mt-1 max-w-xl text-white/65">Most members need only protein and creatine — and some need nothing but better food. Ask a coach before you spend.</p>
          </div>
          <a
            href={whatsappHref(c.business, `Hi ${c.business.name}, which supplements should I take for my goal?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brand inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 font-bold"
          >
            <MessageCircle className="h-5 w-5" /> Ask a coach on WhatsApp
          </a>
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-white/40">
          Affiliate disclosure: we earn a small commission from Amazon on purchases made through these links, at no extra cost to you. Supplements
          aren&apos;t medicines and don&apos;t replace a balanced diet. If you are pregnant, under 18, or have a medical condition, check with your
          doctor first.
        </p>
      </section>
    </>
  );
}
