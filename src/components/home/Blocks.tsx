import Link from "next/link";
import { ArrowRight, Check, Star } from "lucide-react";
import type { BlogPost, Faq, Program, Trainer } from "@/lib/content/types";
import { instagramHref } from "@/lib/site";
import { readingMinutes } from "@/lib/markdown";
import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { InstagramIcon } from "@/components/ui/BrandIcons";

export function ProgramGrid({ programs }: { programs: Program[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {programs.map((p, i) => (
        <Reveal key={p.id} delay={i * 80}>
          <TiltCard className="group h-full rounded-3xl">
            <article id={p.id} className="glass gold-border flex h-full scroll-mt-32 flex-col overflow-hidden rounded-3xl">
              {p.image && (
                <div className="h-44 overflow-hidden">
                  <SmartImage src={p.image} alt={p.title} className="transition-transform duration-700 group-hover:scale-110" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-7">
                <div className="pop-3d mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/30 to-gold/5 ring-1 ring-gold/40">
                  <Icon name={p.icon} className="h-7 w-7 text-gold" />
                </div>
                <h3 className="font-display text-2xl text-white">{p.title}</h3>
                <p className="mt-3 text-white/65">{p.summary}</p>
                <ul className="mt-5 space-y-2 text-sm text-white/80">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </TiltCard>
        </Reveal>
      ))}
    </div>
  );
}

export function TrainerGrid({ trainers }: { trainers: Trainer[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-8">
      {trainers.map((t, i) => (
        <Reveal key={t.id} delay={i * 90} className="w-full max-w-sm">
          <TiltCard className="rounded-3xl">
            <article className="glass gold-border overflow-hidden rounded-3xl">
              <div className="aspect-[4/5] overflow-hidden">
                <SmartImage src={t.image} alt={`${t.name}, ${t.role}`} icon="UserCheck" label={t.name} />
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl text-white">{t.name}</h3>
                <p className="text-sm font-semibold uppercase tracking-widest text-gold">{t.role}</p>
                <p className="mt-3 text-sm text-white/65">{t.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.specialties.map((s) => (
                    <span key={s} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75">
                      {s}
                    </span>
                  ))}
                </div>
                {t.instagram && (
                  <a href={instagramHref(t.instagram)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-white/70 hover:text-gold">
                    <InstagramIcon className="h-4 w-4" /> @{t.instagram}
                  </a>
                )}
              </div>
            </article>
          </TiltCard>
        </Reveal>
      ))}
    </div>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {faqs.map((f) => (
        <details key={f.id} className="glass group rounded-2xl px-6 py-5 open:ring-1 open:ring-gold/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-white/70">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function PostCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  return (
    <Reveal delay={index * 70} className="h-full">
      <TiltCard className="group h-full rounded-3xl" max={6}>
        <article className="glass flex h-full flex-col overflow-hidden rounded-3xl">
          <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden" tabIndex={-1} aria-hidden>
            <SmartImage src={post.cover} alt={post.title} icon="Activity" label={post.category} className="transition-transform duration-700 group-hover:scale-105" />
          </Link>
          <div className="flex flex-1 flex-col p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              {post.category} · {readingMinutes(post.body)} min read
            </p>
            <h3 className="mt-2 text-xl font-bold leading-snug text-white">
              <Link href={`/blog/${post.slug}`} className="hover:text-gold">
                {post.title}
              </Link>
            </h3>
            <p className="mt-3 line-clamp-3 flex-1 text-sm text-white/60">{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold">
              Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </article>
      </TiltCard>
    </Reveal>
  );
}

export function RatingBadge({ value, count, source, href }: { value: number; count: number; source: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="glass inline-flex items-center gap-3 rounded-full py-2 pl-2 pr-5 hover:ring-1 hover:ring-gold/50">
      <span className="flex h-9 items-center rounded-full bg-gold px-3 font-bold text-black">{value}</span>
      <span className="flex flex-col leading-tight">
        <span className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(value) ? "fill-gold text-gold" : "text-white/30"}`} />
          ))}
        </span>
        <span className="text-xs text-white/70">
          {count}+ reviews on {source}
        </span>
      </span>
    </a>
  );
}
