import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content/store";
import { CALCULATORS } from "@/lib/calculators";
import { breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl, publishedPosts, telHref, whatsappHref } from "@/lib/site";
import { Calculator } from "@/components/tools/Calculator";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { FaqList, PostCard } from "@/components/home/Blocks";
import { CtaCard } from "@/components/blog/CtaCard";
import { Icon } from "@/components/Icon";

export const revalidate = 300;

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const calc = CALCULATORS.find((c) => c.slug === slug);
  if (!calc) return {};
  const c = await getContent();
  return pageMeta(c, { title: `${calc.title} — Free & Instant`, description: calc.description, path: `/tools/${calc.slug}` });
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const calc = CALCULATORS.find((c) => c.slug === slug);
  if (!calc) notFound();
  const c = await getContent();
  const related = publishedPosts(c).filter((p) => p.body.includes(`[[calculator:${calc.key}]]`)).slice(0, 3);
  const others = CALCULATORS.filter((x) => x.slug !== calc.slug);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Fitness Tools", path: "/tools" },
            { name: calc.title, path: `/tools/${calc.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: calc.title,
            url: absoluteUrl(`/tools/${calc.slug}`),
            description: calc.description,
            applicationCategory: "HealthApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: 0, priceCurrency: "INR" },
            provider: { "@type": "HealthClub", name: c.business.name },
          },
          faqJsonLd(calc.faqs),
        ]}
      />
      <PageHero eyebrow="Free fitness tool" title={calc.title} intro={calc.description} />
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <Calculator calcKey={calc.key} />
        <p className="text-center text-xs text-white/45">
          Estimates for healthy adults — not medical advice. Consult a doctor if you have a medical condition.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-display mb-6 text-center text-3xl text-white">Frequently asked</h2>
        <FaqList faqs={calc.faqs.map((f, i) => ({ id: String(i), ...f }))} />
        <div className="mx-auto max-w-3xl">
          <CtaCard whatsapp={whatsappHref(c.business)} phone={telHref(c.business.phone)} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h2 className="font-display mb-6 text-3xl text-white">Related guides</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p, i) => (
              <PostCard key={p.slug} post={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="font-display mb-6 text-3xl text-white">More calculators</h2>
        <div className="flex flex-wrap gap-3">
          {others.map((o) => (
            <Link key={o.slug} href={`/tools/${o.slug}`} className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 hover:text-gold">
              <Icon name={o.icon} className="h-4 w-4 text-gold" /> {o.title.replace(/ \(.*\)$/, "")}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
