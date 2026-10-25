import type { Metadata } from "next";
import Link from "next/link";
import { Award, BadgeCheck, Camera, Clock, FileDown, ShieldCheck, Snowflake, Star, Users } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { caseStudyRows, publishedStudies, resultStats } from "@/lib/content/results";
import { PageHero, SectionHeading } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";
import { SmartImage } from "@/components/ui/SmartImage";
import { CtaCard } from "@/components/blog/CtaCard";
import { telHref, whatsappHref } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: `Why ${c.business.shortName} — Trainers, Facility, Safety & Member Results`,
    description: `Why members choose ${c.business.name}, Sector 93 Noida: trainer credentials, the facility, how we keep you safe and member results shared with consent.`,
    path: "/why-royal-fitness",
  });
}

const FACILITY = [
  { icon: Snowflake, title: "Fully air-conditioned floor", text: "Strength and cardio areas are air-conditioned year-round." },
  { icon: Award, title: "Free-weight strength floor", text: "Barbells, plates, racks and dumbbells for the big lifts." },
  { icon: Users, title: "Machines, cables & cardio zone", text: "Cable stations, plate-loaded and pin machines, treadmills, cycles and cross-trainers." },
  { icon: Clock, title: "Two batches, six days", text: "Morning and evening batches, Monday to Saturday." },
];

const SAFETY = [
  "Form before load: every member learns the big lifts with light weights first.",
  "Injury-aware coaching: if a movement hurts, the trainer swaps it for a safe alternative.",
  "Medical conditions: we ask about them at the start and follow your doctor's advice first.",
  "CCTV-monitored floor and a marked emergency exit.",
  "Supplement advice without upselling; food comes first.",
];

export default async function WhyPage() {
  const c = await getContent();
  const b = c.business;
  const studies = publishedStudies(c.caseStudies);
  const stats = resultStats(studies);
  const rows = new Map(caseStudyRows(studies).map((r) => [r.id, r]));
  const credentialed = c.trainers.filter((t) => (t.credentials ?? []).some((x) => x.trim()));
  const photos = c.gallery.filter((g) => g.image).slice(0, 6);
  const years = new Date().getFullYear() - b.foundedYear;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Why Royal Fitness", path: "/why-royal-fitness" }])} />
      <PageHero eyebrow="Why Royal Fitness" title="Proof, not" highlight="promises" intro="Who coaches you, where you train, how we keep you safe, and what members have achieved." />

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <ul className="grid gap-4 sm:grid-cols-3">
          <li className="glass brand-border rounded-3xl p-6 text-center">
            <p className="font-display text-4xl text-brand-gradient">{years}+ years</p>
            <p className="mt-1 text-sm text-white/60">Serving Gejha and Sector 93 since {b.foundedYear}</p>
          </li>
          <li className="glass brand-border rounded-3xl p-6 text-center">
            <p className="font-display text-4xl text-brand-gradient">{b.rating.value}★</p>
            <p className="mt-1 text-sm text-white/60">
              Average of {b.rating.count}+ ratings on {b.rating.source}
            </p>
          </li>
          <li className="glass brand-border rounded-3xl p-6 text-center">
            <p className="font-display text-4xl text-brand-gradient">{c.programs.length} programs</p>
            <p className="mt-1 text-sm text-white/60">
              Each with a <Link href="/programs" className="underline hover:text-brand">written guide</Link>
            </p>
          </li>
        </ul>
      </section>

      {c.trainers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <SectionHeading eyebrow="Coaches" title="Who" highlight="trains you" intro={credentialed.length ? "Credentials listed are the ones each coach holds; ask to see the certificates at the front desk." : undefined} />
          <div className="grid gap-6 md:grid-cols-2">
            {c.trainers.map((t) => {
              const creds = (t.credentials ?? []).filter((x) => x.trim());
              return (
                <article key={t.id} className="glass brand-border flex flex-col gap-5 overflow-hidden rounded-3xl p-5 sm:flex-row">
                  <div className="aspect-[4/5] w-full shrink-0 overflow-hidden rounded-2xl sm:w-36">
                    <SmartImage src={t.image} alt={`${t.name}, ${t.role}`} icon="UserCheck" label={t.name} sizes="(min-width: 640px) 144px, 100vw" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-white">{t.name}</h3>
                    <p className="text-sm font-semibold text-brand">{t.role}</p>
                    {t.bio && <p className="mt-3 text-sm text-white/70">{t.bio}</p>}
                    {creds.length > 0 && (
                      <ul className="mt-4 space-y-1.5 text-sm text-white/80">
                        {creds.map((cr) => (
                          <li key={cr} className="flex gap-2">
                            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {cr}
                          </li>
                        ))}
                      </ul>
                    )}
                    {t.certificateImage && (
                      <a href={t.certificateImage} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                        <Award className="h-4 w-4" /> View certificate
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="Facility tour" title="Where you'll" highlight="train" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITY.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-5 ring-1 ring-white/10">
              <f.icon className="h-7 w-7 text-brand" />
              <h3 className="mt-3 font-display text-lg text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-white/65">{f.text}</p>
            </div>
          ))}
        </div>
        {photos.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((g) => (
                <figure key={g.id} className="overflow-hidden rounded-2xl">
                  <div className="aspect-[4/5]">
                    <SmartImage src={g.image} alt={g.caption || g.title} sizes="(min-width: 1152px) 360px, (min-width: 640px) 33vw, 50vw" />
                  </div>
                </figure>
              ))}
            </div>
            <p className="mt-4 text-center">
              <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
                <Camera className="h-4 w-4" /> Full gallery
              </Link>
            </p>
          </>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <SectionHeading eyebrow="Safety" title="How we keep you" highlight="safe" />
        <ul className="glass brand-border space-y-3 rounded-3xl p-6 text-white/80">
          {SAFETY.map((s) => (
            <li key={s} className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" /> {s}
            </li>
          ))}
        </ul>
      </section>

      {studies.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <SectionHeading
            eyebrow="Member results"
            title="Measured at the gym,"
            highlight="shared with consent"
            intro={`Real numbers from ${stats.count} member${stats.count === 1 ? "" : "s"} who agreed to share them. Averages cover only these members; individual results vary.`}
          />
          <div className="flex flex-wrap justify-center gap-4">
            {stats.tiles.map((t) => (
              <div key={t.label} className="glass brand-border w-full rounded-3xl p-5 text-center sm:w-[calc(50%-0.5rem)] lg:w-[calc(20%-0.8rem)] lg:min-w-[180px]">
                <p className="font-display text-3xl text-brand-gradient">{t.value}</p>
                <p className="mt-1 text-xs text-white/60">{t.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {studies.slice(0, 3).map((s) => {
              const r = rows.get(s.id)!;
              return (
                <article key={s.id} className="glass overflow-hidden rounded-3xl ring-1 ring-white/10">
                  {(s.beforeImage || s.afterImage) && (
                    <div className="grid grid-cols-2">
                      {[
                        ["Before", s.beforeImage],
                        ["After", s.afterImage],
                      ].map(([label, src]) => (
                        <figure key={label} className="relative aspect-[3/4]">
                          <SmartImage src={src} alt={`${s.name} ${label.toLowerCase()}`} label={label} sizes="(min-width: 1024px) 180px, 50vw" />
                          <figcaption className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">{label}</figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-display text-xl text-white">{s.name}</h3>
                    <p className="text-sm text-brand">
                      {r.program} · {s.weeks} weeks
                    </p>
                    <dl className="mt-3 space-y-1 text-sm">
                      {[
                        ["Weight", r.weight],
                        ["Waist", r.waist],
                        ["Strength", r.lift],
                      ]
                        .filter(([, v]) => v !== "—")
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-3">
                            <dt className="text-white/55">{k}</dt>
                            <dd className="text-right text-white">{v}</dd>
                          </div>
                        ))}
                    </dl>
                    {s.story && <p className="mt-3 text-sm text-white/65">{s.story}</p>}
                    {s.verifiedOn && <p className="mt-3 text-[11px] text-white/40">Measured at the gym · {s.verifiedOn}</p>}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-6 text-center">
            <a href="/api/proof-of-results" className="btn-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold">
              <FileDown className="h-4 w-4" /> Download proof of results (PDF)
            </a>
          </p>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
        <Link href="/reviews" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
          <Star className="h-4 w-4" /> Read and share reviews
        </Link>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <CtaCard whatsapp={whatsappHref(b)} phone={telHref(b.phone)} />
      </section>
    </>
  );
}
