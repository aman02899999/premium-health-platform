import type { Metadata } from "next";
import { Star } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { isDbConfigured } from "@/health/db";
import { approvedReviews } from "@/lib/reviews/store";
import { summary, type PublicReview } from "@/lib/reviews/validate";
import { PageHero, SectionHeading } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { ReviewCard, Stars } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Member Reviews — Gym in Sector 93 Noida",
    description: `Verified reviews from ${c.business.name} members and diet-plan clients. Every review is checked against a real membership or plan.`,
    path: "/reviews",
  });
}

export default async function ReviewsPage() {
  const c = await getContent();
  const reviews: PublicReview[] = isDbConfigured ? await approvedReviews().catch(() => []) : [];
  const s = summary(reviews);
  return (
    <>
      {/* No review markup in the JSON-LD: Google ignores self-published reviews of a business and may penalise them. */}
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Reviews", path: "/reviews" }])} />
      <PageHero
        eyebrow="Verified reviews"
        title="What our members"
        highlight="say"
        intro="Every review here comes from a real member or diet-plan client: we check the number against our records before it is shown. Critical ones are published too."
      />
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        {s.count > 0 ? (
          <Reveal className="glass mx-auto flex max-w-xl flex-col items-center gap-2 rounded-3xl p-6 text-center">
            <p className="font-display text-5xl text-white">{s.average.toFixed(1)}</p>
            <Stars rating={Math.round(s.average)} className="h-5 w-5" />
            <p className="text-sm text-white/60">
              {s.count} verified review{s.count === 1 ? "" : "s"}
            </p>
          </Reveal>
        ) : (
          <Reveal className="text-center">
            <p className="mx-auto max-w-xl text-white/65">Verified reviews from our members will appear here. Are you a member? Be the first to share your experience below.</p>
          </Reveal>
        )}
        {s.count > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>
      <section id="write" className="mx-auto max-w-3xl scroll-mt-28 px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Members only" title="Share your" highlight="experience" intro="Use the mobile number you joined or bought your plan with. Only your first name, initial and area are shown." />
        <ReviewForm />
        <p className="mt-6 text-center text-sm text-white/55">
          <a href={c.business.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline hover:text-brand">
            <Star className="h-4 w-4" /> You can also review us on Google
          </a>
        </p>
      </section>
    </>
  );
}
