import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { Gallery3D } from "@/components/home/Gallery3D";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { SmartImage } from "@/components/ui/SmartImage";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Gym Photos & 3D Gallery",
    description: `See inside ${c.business.name}, Sector 93 Noida — strength floor, cardio zone, machines and member transformations.`,
    path: "/gallery",
  });
}

export default async function GalleryPage() {
  const c = await getContent();
  const withImages = c.gallery.filter((g) => g.image);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gallery", path: "/gallery" }]),
          ...(withImages.length
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "ImageGallery",
                  name: `${c.business.name} gallery`,
                  image: withImages.map((g) => ({ "@type": "ImageObject", contentUrl: absoluteUrl(g.image), name: g.title, description: g.caption })),
                },
              ]
            : []),
        ]}
      />
      <PageHero eyebrow="Gallery" title="Step inside" highlight="the club" intro="Drag the carousel or hover the grid — every card reacts in 3D." />
      <section className="mx-auto max-w-7xl overflow-hidden px-4 py-10 sm:px-6">
        <Gallery3D items={c.gallery} />
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {c.gallery.map((g, i) => (
          <Reveal key={g.id} delay={(i % 3) * 80}>
            <TiltCard className="group rounded-3xl" max={12}>
              <figure className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/10">
                <SmartImage src={g.image} alt={g.title} label={g.title} icon="Dumbbell" className="transition-transform duration-700 group-hover:scale-110" />
                <figcaption className="pop-3d absolute inset-x-4 bottom-4 rounded-2xl bg-black/60 p-4 backdrop-blur">
                  <span className="font-display block text-lg text-white">{g.title}</span>
                  <span className="text-sm text-white/65">{g.caption}</span>
                </figcaption>
              </figure>
            </TiltCard>
          </Reveal>
        ))}
      </section>
    </>
  );
}
