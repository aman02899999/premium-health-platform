import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, ChevronDown, Crown, Gift, Lock, MessageCircle, Truck } from "lucide-react";
import { getCatalog, getPosts } from "@/lib/shop/server";
import { fssaiLabel, inr } from "@/lib/shop/format";
import { SITE_URL } from "@/lib/site";
import { ComboCard, ProductCard } from "@/components/shop/cards";
import { BannerArt, HeroArt } from "@/components/shop/art";
import { categoryIcon } from "@/components/shop/icons";
import { JsonLd } from "@/components/ui/JsonLd";


// The home title is complete on its own: no "| store name" suffix from the layout template.
export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getCatalog();
  return { title: { absolute: s.seoTitle } };
}

export default async function ShopHome() {
  const { settings: s, categories, products, combos, offline } = await getCatalog();
  const posts = offline ? [] : await getPosts();
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const deals = [...products].sort((a, b) => b.discount - a.discount || b.listPrice - a.listPrice).slice(0, 8);
  const shelf = featured.length > 0 ? featured : deals;
  const liveCombos = combos.filter((c) => c.available);
  const topCombos = [...liveCombos].sort((a, b) => Number(b.featured) - Number(a.featured) || a.price - b.price).slice(0, 6);
  const maxOff = Math.max(0, ...categories.map((c) => c.discountPct));
  const disc = (slug: string) => categories.find((c) => c.slug === slug)?.discountPct ?? 0;
  const cheapestCombo = liveCombos.length ? Math.min(...liveCombos.map((c) => c.price)) : 0;

  // Promo banners: wording comes from the live discounts, so they can't advertise an offer that isn't on.
  const banners = [
    disc("protein") > 0 && { href: "/shop/c/protein", kicker: "Protein sale", title: `${disc("protein")}% off whey & isolate`, text: "Real MRP shown crossed out on every tub.", tone: "gold" as const, word: "WHEY", image: s.banner1Image },
    { href: "/shop/combos", kicker: "Combo deals", title: cheapestCombo ? `Combos from ${inr(cheapestCombo)}` : "Bundle & save more", text: "Sale prices, then an extra discount on top.", tone: "red" as const, word: "COMBO", image: s.banner2Image },
    (disc("multivitamins-tablets") > 0 || disc("amino-acids") > 0) && {
      href: disc("amino-acids") >= disc("multivitamins-tablets") ? "/shop/c/amino-acids" : "/shop/c/multivitamins-tablets",
      kicker: "Aminos & tablets",
      title: [disc("amino-acids") && `EAA · BCAA ${disc("amino-acids")}% off`, disc("multivitamins-tablets") && `Tablets ${disc("multivitamins-tablets")}% off`].filter(Boolean).join(" · "),
      text: "Glutamine, multivitamins and daily essentials.",
      tone: "emerald" as const,
      word: "AMINO",
      image: s.banner3Image,
    },
  ].filter((b): b is Exclude<typeof b, false> => Boolean(b));

  const faqs = [
    { q: "Are the products genuine?", a: "Yes. Every product comes from authorised supply with a bill. Check the seal and batch details when it arrives — if anything looks wrong, WhatsApp us a photo." },
    { q: "How fast is delivery?", a: s.dispatchText },
    { q: "How do I pay?", a: "Online through Razorpay — UPI, cards, net banking and wallets. Your payment is confirmed instantly and you can track the order under My orders." },
    { q: "Can I return a product?", a: s.returnPolicy },
    { q: "Which supplement should I start with?", a: "Most people need only protein to reach their daily target, and creatine if they train hard. Read our free guides or WhatsApp the coaches before you spend." },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Store",
            name: s.storeName,
            url: `${SITE_URL}/shop`,
            telephone: s.phone,
            address: s.address,
            description: s.seoDescription,
            potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/shop/products?q={query}`, "query-input": "required name=query" },
          },
          { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ]}
      />

      {/* First screen: headline, offer and every way into the store */}
      <section className="shop-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,rgba(245,158,11,.22),transparent_45%),radial-gradient(ellipse_at_90%_60%,rgba(225,29,72,.16),transparent_45%)]" />
        <div className="shop-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-5 sm:px-6 sm:pt-8 lg:pb-10 lg:pt-12">
          <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
                <Crown className="h-3.5 w-3.5" /> {s.storeName}
              </p>
              <h1 className="font-display mt-3 text-[clamp(2.1rem,8.5vw,4.75rem)] leading-[0.92] text-white">
                {s.heroTitle} <span className="text-gold-gradient">{s.heroHighlight}</span>
              </h1>
              <p className="mt-3 line-clamp-2 max-w-xl text-sm text-white/70 sm:line-clamp-none sm:text-lg">{s.heroText}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                <Link href="/shop/products" className="btn-gold inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black sm:px-7 sm:py-3.5 sm:text-base">
                  {maxOff > 0 ? `Shop ${maxOff}% off` : "Shop now"} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/shop/combos" className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/50 bg-black/30 px-5 py-3 text-sm font-bold text-amber-100 backdrop-blur sm:px-7 sm:py-3.5 sm:text-base">
                  <Gift className="h-4 w-4" /> Combo deals
                </Link>
              </div>
              <ul className="mt-4 hidden flex-wrap gap-x-5 gap-y-2 text-xs text-white/60 sm:flex">
                <li className="flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-amber-300" /> Genuine, with bill
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-amber-300" /> Secure Razorpay checkout
                </li>
                <li className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-amber-300" /> Delivered to your door
                </li>
              </ul>
            </div>
            <div className="relative mx-auto hidden w-full max-w-md lg:block">
              {s.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-chosen marketing image
                <img src={s.heroImage} alt={`${s.storeName} offer`} className="aspect-[52/46] w-full rounded-[2rem] object-cover shadow-2xl" />
              ) : (
                <HeroArt off={maxOff} className="w-full drop-shadow-2xl" />
              )}
            </div>
          </div>

          {/* Every department, visible without scrolling on phones and desktop */}
          <nav aria-label="Shop by category" className="mt-5 lg:mt-8">
            <ul className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
              {categories.map((c) => {
                const Icon = categoryIcon(c.slug);
                return (
                  <li key={c.id}>
                    <Link href={`/shop/c/${c.slug}`} className="cat-tile group">
                      {c.discountPct > 0 && <span className="cat-badge">-{c.discountPct}%</span>}
                      <span className="cat-icon">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </span>
                      <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-white/85 sm:text-sm">{c.name}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/shop/combos" className="cat-tile group border-amber-400/40 bg-amber-400/10">
                  <span className="cat-icon bg-amber-400 text-black">
                    <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <span className="text-center text-[11px] font-black leading-tight text-amber-200 sm:text-sm">Combos</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <a href="#deals" className="mx-auto -mt-1 mb-2 hidden w-fit items-center gap-1 text-xs text-white/40 hover:text-white/70 sm:flex">
          Scroll for deals <ChevronDown className="h-4 w-4" />
        </a>
      </section>

      {offline && <p className="mx-auto mt-10 max-w-3xl px-4 text-center text-white/60">The store is being updated. Please check back in a few minutes.</p>}

      {/* Promo banners */}
      <section id="deals" className="mx-auto mt-6 max-w-7xl scroll-mt-24 px-4 sm:px-6">
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
          {banners.map((b) => (
            <Link key={b.href} href={b.href} className={`promo-banner promo-${b.tone} group w-[84%] shrink-0 snap-start sm:w-auto`}>
              <span className="relative z-10 flex max-w-[60%] flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-80">{b.kicker}</span>
                <span className="font-display mt-1 text-[1.45rem] leading-none sm:text-[1.6rem]">{b.title}</span>
                <span className="mt-2 text-xs opacity-75">{b.text}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider">
                  Shop now <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </span>
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-chosen banner photo
                <img src={b.image} alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover [mask-image:linear-gradient(to_right,transparent,black_35%)]" />
              ) : (
                <BannerArt tone={b.tone} word={b.word} className="absolute -right-6 -bottom-3 h-[92%] transition duration-500 group-hover:scale-105 sm:-right-4 sm:h-full" />
              )}
            </Link>
          ))}
        </div>
      </section>

      {!offline && products.length === 0 && (
        <section className="mx-auto mt-12 max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl text-white">Full range landing soon</h2>
          <p className="mt-2 text-white/60">
            We&apos;re adding the complete range right now. Message us on{" "}
            <a href={`https://wa.me/${s.whatsapp}`} className="text-amber-300 underline">
              WhatsApp
            </a>{" "}
            for today&apos;s prices and availability.
          </p>
        </section>
      )}

      {topCombos.length > 0 && (
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
          <SectionHead kicker="Bundle & save more" title="Combo deals" href="/shop/combos" link="All combos" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {topCombos.map((c) => (
              <ComboCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {shelf.length > 0 && (
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
          <SectionHead kicker={featured.length > 0 ? "Picked by our coaches" : "Today's sale"} title={featured.length > 0 ? "Best sellers" : "Biggest discounts"} href="/shop/products" link="View all" />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {shelf.map((p, i) => (
              <ProductCard key={p.id} p={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* Why buy here */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-amber-400/10 via-white/[.02] to-transparent p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
          <h2 className="font-display relative text-3xl text-white sm:text-4xl">
            Why lifters buy from <span className="text-gold-gradient">{s.storeName}</span>
          </h2>
          <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BadgeCheck, t: "Genuine stock", d: s.fssaiLicence ? `Authorised supply, sold with a bill. ${fssaiLabel(s.fssaiType)} ${s.fssaiLicence}.` : "Authorised supply, sold with a bill and sealed packs." },
              { icon: Lock, t: "Safe payment", d: "Razorpay checkout — UPI, cards, net banking. We never see your card details." },
              { icon: Truck, t: "Fast dispatch", d: s.dispatchText },
              { icon: MessageCircle, t: "Coach advice, free", d: "Not sure what you need? WhatsApp the coaches at Royal Fitness Club before you buy." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur">
                <f.icon className="h-7 w-7 text-amber-300" />
                <p className="mt-3 font-bold text-white">{f.t}</p>
                <p className="mt-1 text-sm text-white/60">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
          <SectionHead kicker="Free guides" title="Learn before you buy" href="/shop/blog" link="All guides" />
          <div className="grid gap-4 md:grid-cols-3">
            {posts.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/shop/blog/${p.slug}`} className="group rounded-3xl border border-white/10 bg-white/[.03] p-5 transition hover:-translate-y-0.5 hover:border-amber-300/40">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300/80">
                  <BookOpen className="h-3.5 w-3.5" /> {p.tags[0] ?? "Guide"}
                </p>
                <h3 className="mt-2 text-lg font-bold text-white group-hover:text-amber-100">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/60">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-16 max-w-3xl px-4 pb-6 sm:px-6">
        <h2 className="font-display text-center text-3xl text-white sm:text-4xl">Questions, answered</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[.03] p-4 open:border-amber-300/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                {f.q} <ChevronDown className="h-5 w-5 shrink-0 text-amber-300 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-white/65">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

function SectionHead({ kicker, title, href, link }: { kicker: string; title: string; href: string; link: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">{kicker}</p>
        <h2 className="font-display text-3xl text-white sm:text-4xl">{title}</h2>
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-amber-300 hover:text-amber-200">
        {link} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
