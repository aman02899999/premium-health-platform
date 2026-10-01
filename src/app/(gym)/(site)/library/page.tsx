import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Download, ShieldCheck, Sparkles } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { pageMeta } from "@/lib/seo";
import { BOOKS, CATEGORIES, coverSrc } from "@/lib/library/catalog";
import { BUNDLES } from "@/lib/library/bundles";
import { MULTI_BUY } from "@/lib/library/cart";
import { COMPLETE_LIBRARY_ID, COMPLETE_LIBRARY_PRICE, libraryListPrice } from "@/lib/library/pricing";
import { ratingSummaries, type RatingSummary } from "@/lib/library/reviews";
import { PageHero } from "@/components/ui/Section";
import { AddToCart } from "@/components/library/AddToCart";
import { BundleCard } from "@/components/library/BundleCard";
import { LibraryGrid } from "@/components/library/LibraryGrid";

// Re-render every 10 minutes so newly approved reviews show up.
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Premium Library — Fitness, Yoga, Nutrition & Mind eBooks",
    description: `${BOOKS.length} premium PDF guides on strength, fat loss, Indian nutrition, yoga, meditation, psychology and health. Buy one book or the complete library.`,
    path: "/library",
  });
}

export default async function LibraryPage() {
  let ratings: Record<string, RatingSummary> = {};
  try {
    ratings = await ratingSummaries();
  } catch (err) {
    console.error("[library] ratings unavailable:", (err as Error).message);
  }
  const list = libraryListPrice();
  const saving = Math.round((1 - COMPLETE_LIBRARY_PRICE / list) * 100);
  const totalPages = BOOKS.reduce((s, b) => s + b.pages, 0);
  const featured = [1, 13, 19, 31, 34, 53];
  const combos = BUNDLES.filter((b) => b.kind === "combo");
  const sections = BUNDLES.filter((b) => b.kind === "section");
  return (
    <>
      <PageHero
        eyebrow="Premium Library"
        title="Knowledge that"
        highlight="builds bodies"
        intro={`${BOOKS.length} premium guides on strength, nutrition, yoga, meditation, psychology and health — written for Indian lives. Buy one book, a combo for your goal, or own the whole library.`}
      />

      <section id="complete" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="glass brand-border grid gap-8 overflow-hidden rounded-3xl p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
              <Sparkles className="h-3.5 w-3.5" /> Best value
            </p>
            <h2 className="font-display mt-4 text-3xl text-white sm:text-4xl">The Complete Premium Library</h2>
            <p className="mt-3 text-white/70">
              All {BOOKS.length} books — {totalPages.toLocaleString("en-IN")} pages across {CATEGORIES.length} sections. Every future update to these volumes included.
            </p>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-4xl text-white">₹{COMPLETE_LIBRARY_PRICE.toLocaleString("en-IN")}</span>
              <span className="text-white/45 line-through">₹{list.toLocaleString("en-IN")}</span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">Save {saving}%</span>
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
              <li className="flex gap-2"><Download className="h-4 w-4 shrink-0 text-brand" /> Instant PDF downloads</li>
              <li className="flex gap-2"><BookOpen className="h-4 w-4 shrink-0 text-brand" /> Read on phone, tablet or print</li>
              <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-brand" /> Secure payment by Razorpay</li>
              <li className="flex gap-2"><Sparkles className="h-4 w-4 shrink-0 text-brand" /> Worksheets & trackers in every book</li>
            </ul>
            <div className="mt-6 max-w-md">
              <AddToCart id={COMPLETE_LIBRARY_ID} buyLabel="Get all books" />
              <p className="mt-3 text-xs text-white/45">Instant download after payment · UPI, cards, net banking · Secured by Razorpay</p>
            </div>
          </div>
          <div className="relative hidden min-h-[320px] overflow-hidden lg:block" aria-hidden>
            {featured.map((v, i) => (
              <div
                key={v}
                className="absolute w-40 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10"
                style={{ left: `${(i % 3) * 28}%`, top: `${Math.floor(i / 3) * 48 + (i % 2) * 6}%`, transform: `rotate(${(i - 2.5) * 3}deg)` }}
              >
                <Image src={coverSrc(v)} alt="" width={160} height={240} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="combos" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="font-display mb-2 text-3xl text-white">Combo offers</h2>
        <p className="mb-8 text-white/60">Hand-picked sets for one goal — about 40% less than buying the same books one by one.</p>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {combos.map((b) => (
            <li key={b.id}>
              <BundleCard bundle={b} />
            </li>
          ))}
        </ul>
      </section>

      <section id="collections" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="font-display mb-2 text-3xl text-white">Complete collections</h2>
        <p className="mb-8 text-white/60">Every book in a section — about half the single-book price.</p>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((b) => (
            <li key={b.id}>
              <BundleCard bundle={b} />
            </li>
          ))}
        </ul>
      </section>

      <section id="books" className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        <h2 className="font-display mb-2 text-3xl text-white">Or choose single books</h2>
        <p className="mb-2 text-white/60">Every volume is a premium, watermarked PDF with worksheets, trackers and practical plans.</p>
        <p className="mb-8 text-sm font-semibold text-emerald-300">
          Mix any books in your cart: {MULTI_BUY.slice().reverse().map((t) => `${t.min}+ books ${Math.round(t.rate * 100)}% off`).join(" · ")}
        </p>
        <LibraryGrid books={BOOKS} categories={CATEGORIES} ratings={ratings} />
        <p className="mt-12 text-center text-sm text-white/50">
          Already bought? <Link href="/library/recover" className="text-brand underline">Recover your downloads</Link>
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-white/40">
          These books are educational and don&apos;t replace advice from your doctor. Drug-education titles contain no doses, cycles or sources.
        </p>
      </section>
    </>
  );
}
