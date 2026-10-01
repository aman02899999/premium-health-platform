import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText, ShieldCheck } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl, whatsappHref } from "@/lib/site";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { BOOKS, coverSrc } from "@/lib/library/catalog";
import { COMPLETE_LIBRARY_PRICE, bookBySlug } from "@/lib/library/pricing";
import { BuyBox } from "@/components/library/BuyBox";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BOOKS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = bookBySlug(slug);
  if (!book) return {};
  const c = await getContent();
  return pageMeta(c, {
    title: `${book.title} — ${book.subtitle}`,
    description: `${book.label}: ${book.benefits.join(". ")}. ${book.pages}-page premium PDF, Vol. ${book.volume} of the Royal Fitness Club Premium Library.`,
    path: `/library/${book.slug}`,
    image: coverSrc(book.volume),
  });
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = bookBySlug(slug);
  if (!book) notFound();
  const c = await getContent();
  const related = BOOKS.filter((b) => b.category === book.category && b.slug !== book.slug).slice(0, 4);
  const online = razorpayConfigured();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Book",
      name: book.title,
      alternativeHeadline: book.subtitle,
      bookFormat: "https://schema.org/EBook",
      numberOfPages: book.pages,
      inLanguage: "en-IN",
      genre: book.category,
      image: absoluteUrl(coverSrc(book.volume)),
      url: absoluteUrl(`/library/${book.slug}`),
      publisher: { "@type": "Organization", name: c.business.name },
      offers: { "@type": "Offer", price: book.price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: absoluteUrl(`/library/${book.slug}`) },
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Library", path: "/library" },
      { name: book.title, path: `/library/${book.slug}` },
    ]),
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/library" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All books
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div>
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-[0_30px_60px_-25px_rgba(0,0,0,.9)] ring-1 ring-white/10">
            <Image src={coverSrc(book.volume)} alt={`${book.title} — cover`} fill priority sizes="(min-width:1024px) 380px, 90vw" className="object-cover" />
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand">{book.category} · Volume {book.volume}</p>
          <h1 className="font-display mt-3 text-4xl leading-tight text-white sm:text-5xl">{book.title}</h1>
          <p className="mt-3 text-lg italic text-white/70">{book.subtitle}</p>
          <p className="mt-4 inline-block rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand">{book.label}</p>

          <ul className="mt-6 space-y-2">
            {book.benefits.map((b) => (
              <li key={b} className="flex gap-3 text-white/85">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> {b}
              </li>
            ))}
          </ul>

          <div className="glass brand-border mt-8 rounded-3xl p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="font-display text-3xl text-white">₹{book.price}</span>
              <span className="flex items-center gap-1.5 text-sm text-white/55">
                <FileText className="h-4 w-4" /> {book.pages}-page PDF
              </span>
            </div>
            <BuyBox
              itemId={book.slug}
              label="Buy this book"
              price={book.price}
              online={online}
              whatsappUrl={whatsappHref(c.business, `Hi ${c.business.name}, I'd like to buy "${book.title}" (Vol. ${book.volume}).`)}
            />
            <p className="mt-4 text-center text-sm text-white/60">
              Want everything? <Link href="/library#complete" className="font-semibold text-brand underline">All {BOOKS.length} books for ₹{COMPLETE_LIBRARY_PRICE.toLocaleString("en-IN")}</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl text-white">About this book</h2>
          <div className="mt-4 space-y-4 text-white/75">
            {book.blurb.split("\n\n").map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
          {book.sensitive && (
            <p className="mt-5 flex gap-2 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-100/90">
              <ShieldCheck className="h-5 w-5 shrink-0" /> Educational guide. It supports — never replaces — care from your doctor, and contains no doses, cycles or sources.
            </p>
          )}
        </section>
        <section>
          <h2 className="font-display text-2xl text-white">Inside: {book.chapters.length} chapters</h2>
          <ol className="mt-4 grid gap-x-6 gap-y-2 text-sm text-white/75 sm:grid-cols-2">
            {book.chapters.map((ch, i) => (
              <li key={ch} className="flex gap-3">
                <span className="font-display w-6 shrink-0 text-brand">{String(i + 1).padStart(2, "0")}</span>
                {ch}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display mb-6 text-2xl text-white">More in {book.category}</h2>
          <ul className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map((b) => (
              <li key={b.slug}>
                <Link href={`/library/${b.slug}`} className="group block">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl ring-1 ring-white/10 transition group-hover:ring-brand/60">
                    <Image src={coverSrc(b.volume)} alt={`${b.title} — cover`} fill sizes="(min-width:640px) 22vw, 45vw" className="object-cover" />
                  </div>
                  <p className="mt-2 text-sm text-white">{b.title}</p>
                  <p className="text-sm text-white/55">₹{b.price}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
