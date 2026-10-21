import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Lightbulb, Scale, Sparkles, Info } from "lucide-react";
import type { Block, BoxKind, Inline } from "@/lib/markdown";
import { PremiumAwareAd } from "@/health/components/ads/PremiumAwareAd";
import { Mermaid } from "./Mermaid";

// Renders a long-form post. Ads appear only where the post has [[ad]] (top level, at most 3):
// never inside tables, boxes, the FAQ, forms or tools.
const MAX_ADS = 3;

function inline(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "strong":
        return <strong key={i}>{inline(n.c)}</strong>;
      case "em":
        return <em key={i}>{inline(n.c)}</em>;
      case "code":
        return <code key={i}>{n.v}</code>;
      case "link":
        return n.href.startsWith("/") ? (
          <Link key={i} href={n.href} className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900 dark:text-emerald-400">
            {inline(n.c)}
          </Link>
        ) : (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 dark:text-emerald-400">
            {inline(n.c)}
          </a>
        );
    }
  });
}

const BOX: Record<BoxKind, { cls: string; icon: typeof Info; label: { en: string; hi: string } }> = {
  answer: { cls: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40", icon: Sparkles, label: { en: "The short answer", hi: "संक्षेप में जवाब" } },
  takeaways: { cls: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30", icon: CheckCircle2, label: { en: "Key takeaways", hi: "मुख्य बातें" } },
  tip: { cls: "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30", icon: Lightbulb, label: { en: "Tips and tricks", hi: "काम के टिप्स" } },
  warning: { cls: "border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/40", icon: AlertTriangle, label: { en: "See a doctor or go to hospital if", hi: "डॉक्टर के पास या अस्पताल जाएँ अगर" } },
  mythfact: { cls: "border-violet-300 bg-violet-50/60 dark:border-violet-800 dark:bg-violet-950/30", icon: Scale, label: { en: "Myth vs fact", hi: "मिथक बनाम सच" } },
  note: { cls: "border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-stone-900", icon: Info, label: { en: "Note", hi: "ध्यान दें" } },
};

function Blocks({ blocks, lang, ads }: { blocks: Block[]; lang: "en" | "hi"; ads?: ReadonlySet<number> }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2":
            return (
              <h2 key={i} id={b.id} className="font-display mt-12 scroll-mt-28 text-2xl font-black text-stone-900 dark:text-white md:text-3xl">
                {inline(b.c)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} id={b.id} className="mt-8 scroll-mt-28 text-xl font-bold text-stone-900 dark:text-white">
                {inline(b.c)}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="my-4 text-[17px] leading-8 text-stone-700 dark:text-stone-300">
                {inline(b.c)}
              </p>
            );
          case "ul":
          case "ol": {
            const L = b.t;
            return (
              <L key={i} className={`my-4 space-y-2 pl-6 text-[17px] leading-8 text-stone-700 dark:text-stone-300 ${L === "ol" ? "list-decimal" : "list-disc"} marker:text-emerald-600`}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </L>
            );
          }
          case "quote":
            return (
              <blockquote key={i} className="my-6 border-l-4 border-emerald-500 pl-4 italic text-stone-700 dark:text-stone-300">
                {inline(b.c)}
              </blockquote>
            );
          case "table":
            return (
              <div key={i} className="my-6 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-stone-100 dark:bg-stone-800">
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} className="px-4 py-3 font-bold text-stone-900 dark:text-white">
                          {inline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                    {b.rows.map((r, j) => (
                      <tr key={j} className="align-top">
                        {r.map((c, k) => (
                          <td key={k} className="px-4 py-3 leading-6 text-stone-700 dark:text-stone-300">
                            {inline(c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "img":
            return (
              <figure key={i} className="my-8">
                <Image src={b.src} alt={b.alt} width={640} height={800} loading="lazy" unoptimized={b.src.endsWith(".svg")} sizes="(max-width: 768px) 100vw, 640px" className="mx-auto h-auto w-full max-w-[640px] rounded-2xl border border-stone-200 dark:border-stone-700" />
                {b.alt && <figcaption className="mt-2 text-center text-sm text-stone-500">{b.alt}</figcaption>}
              </figure>
            );
          case "hr":
            return <hr key={i} className="my-10 border-stone-200 dark:border-stone-700" />;
          case "mermaid":
            return <Mermaid key={i} code={b.code} caption={b.caption} steps={b.steps} lang={lang} />;
          case "box": {
            const s = BOX[b.kind];
            const Icon = s.icon;
            return (
              <aside key={i} className={`my-8 rounded-2xl border-2 p-5 ${s.cls}`} role={b.kind === "warning" ? "note" : undefined}>
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-stone-900 dark:text-white">
                  <Icon className="h-5 w-5" aria-hidden /> {b.title || s.label[lang]}
                </p>
                <div className="[&>*:first-child]:mt-2 [&>*:last-child]:mb-0">
                  <Blocks blocks={b.blocks} lang={lang} />
                </div>
              </aside>
            );
          }
          case "faq":
            return (
              <div key={i} className="my-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white dark:divide-stone-700 dark:border-stone-700 dark:bg-stone-900">
                {b.items.map((f, j) => (
                  <details key={j} className="group p-5" open={j === 0}>
                    <summary className="cursor-pointer list-none text-lg font-bold text-stone-900 marker:hidden dark:text-white">
                      <span className="mr-2 text-emerald-600 group-open:rotate-90">›</span>
                      {f.q}
                    </summary>
                    <div className="[&>*:last-child]:mb-0">
                      <Blocks blocks={f.a} lang={lang} />
                    </div>
                  </details>
                ))}
              </div>
            );
          case "ad":
            return ads?.has(i) ? <PremiumAwareAd key={i} /> : null;
          default:
            return null;
        }
      })}
    </>
  );
}

export function PostBody({ blocks, lang }: { blocks: Block[]; lang: "en" | "hi" }) {
  return (
    <div className="post-body">
      <Blocks blocks={blocks} lang={lang} ads={new Set(blocks.flatMap((b, i) => (b.t === "ad" ? [i] : [])).slice(0, MAX_ADS))} />
    </div>
  );
}
