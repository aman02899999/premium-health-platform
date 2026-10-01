import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, BookOpenText, Check, FileText, ShieldCheck } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { BOOKS, TIERS, coverSrc } from "@/lib/library/catalog";
import { bundlesWithBook } from "@/lib/library/bundles";
import { EXCERPTS } from "@/lib/library/excerpts";
import { COMPLETE_LIBRARY_PRICE, bookBySlug } from "@/lib/library/pricing";
import { approvedReviews, type BookReview } from "@/lib/library/reviews";
import { AddToCart } from "@/components/library/AddToCart";
import { Book3D } from "@/components/library/Book3D";
import { BookTilt } from "@/components/library/BookTilt";
import { BundleCard } from "@/components/library/BundleCard";
import { Stars } from "@/components/library/Stars";

// Re-render every 10 minutes so newly approved reviews show up.
export const revalidate = 600;

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
  const bundles = bundlesWithBook(book.slug).sort((a, b) => (a.kind === b.kind ? a.price - b.price : a.kind === "combo" ? -1 : 1)).slice(0, 2);
  const excerpt = EXCERPTS[book.slug];
  let reviews: BookReview[] = [];
  try {
    reviews = await approvedReviews(book.slug);
  } catch (err) {
    console.error("[library] reviews unavailable:", (err as Error).message);
  }
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
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
      // Only real, approved buyer reviews are ever published as ratings.
      ...(reviews.length
        ? {
            aggregateRating: { "@type": "AggregateRating", ratingValue: average.toFixed(1), reviewCount: reviews.length, bestRating: 5, worstRating: 1 },
            review: reviews.slice(0, 10).map((r) => ({
              "@type": "Review",
              author: { "@type": "Person", name: r.displayName },
              datePublished: r.createdAt.slice(0, 10),
              reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
              reviewBody: r.body,
            })),
          }
        : {}),
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
          <BookTilt>
            <Book3D src={coverSrc(book.volume)} alt={`${book.title} — cover`} sizes="(min-width:1024px) 380px, 90vw" priority />
          </BookTilt>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand">{book.category} · Volume {book.volume}</p>
          <h1 className="font-display mt-3 text-4xl leading-tight text-white sm:text-5xl">{book.title}</h1>
          <p className="mt-3 text-lg italic text-white/70">{book.subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="inline-block rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand">{book.label}</p>
            <p className="text-xs uppercase tracking-widest text-white/45">{TIERS[book.tier].label} edition</p>
          </div>
          {reviews.length > 0 && (
            <a href="#reviews" className="mt-4 flex w-fit items-center gap-2 text-sm text-white/70 hover:text-white">
              <Stars value={average} /> {average.toFixed(1)} · {reviews.length} verified {reviews.length === 1 ? "review" : "reviews"}
            </a>
          )}

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
            <AddToCart id={book.slug} />
            <p className="mt-3 text-center text-xs text-white/45">Instant download · UPI, cards, net banking · Secured by Razorpay</p>
            <p className="mt-4 text-center text-sm text-white/60">
              Add 2+ books to your cart to save up to 30%, or{" "}
              <Link href="/library#complete" className="font-semibold text-brand underline">
                get all {BOOKS.length} books for ₹{COMPLETE_LIBRARY_PRICE.toLocaleString("en-IN")}
              </Link>
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

      {excerpt && excerpt.blocks.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display flex items-center gap-3 text-2xl text-white">
            <BookOpenText className="h-6 w-6 text-brand" /> Read the introduction
          </h2>
          <div className="mt-5 rounded-3xl bg-[#f6f0e4] p-6 text-[#2a241c] shadow-inner sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6a35]">Chapter 1</p>
            <h3 className="font-display mt-1 text-2xl text-[#1d1a16]">{excerpt.chapter}</h3>
            <div className="mt-4 space-y-3 font-serif text-[15px] leading-relaxed">
              {excerpt.blocks.map(([kind, text], i) =>
                kind === "h" ? (
                  <h4 key={i} className="pt-2 font-sans text-base font-bold text-[#1d1a16]">{text}</h4>
                ) : kind === "li" ? (
                  <p key={i} className="flex gap-2 pl-2"><span className="text-[#9c7a46]">•</span> {text}</p>
                ) : kind === "q" ? (
                  <p key={i} className="border-l-2 border-[#9c7a46] pl-4 italic text-[#4a3f31]">{text}</p>
                ) : (
                  <p key={i}>{text}</p>
                ),
              )}
            </div>
            <p className="mt-6 border-t border-[#d9cdb8] pt-4 text-sm italic text-[#6b5d48]">
              The book continues for {book.pages} pages across {book.chapters.length} chapters.
            </p>
          </div>
        </section>
      )}

      <section id="reviews" className="mt-14">
        <h2 className="font-display text-2xl text-white">Reader reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 max-w-2xl text-white/60">
            No reviews yet. Only verified buyers can review a book — every buyer gets a review form on their download page, and each review is checked before it appears here.
          </p>
        ) : (
          <>
            <p className="mt-2 flex items-center gap-2 text-white/70">
              <Stars value={average} /> {average.toFixed(1)} out of 5 · {reviews.length} verified {reviews.length === 1 ? "buyer" : "buyers"}
            </p>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <li key={r.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Stars value={r.rating} />
                    <span className="text-xs text-white/40">{new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm text-white/80">{r.body}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
                    <span className="font-semibold text-white/80">{r.displayName}</span> · {[r.city, r.country].filter(Boolean).join(", ")}
                    <BadgeCheck className="ml-1 h-3.5 w-3.5 text-emerald-400" /> Verified buyer
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {bundles.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display mb-2 text-2xl text-white">Save with a bundle</h2>
          <p className="mb-6 text-white/60">This book is part of these offers.</p>
          <ul className="grid gap-5 sm:grid-cols-2">
            {bundles.map((b) => (
              <li key={b.id}>
                <BundleCard bundle={b} />
              </li>
            ))}
          </ul>
        </section>
      )}

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
