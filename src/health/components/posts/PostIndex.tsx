"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, Languages } from "lucide-react";
import { postPath, type PostLang, type PostMeta } from "@/health/lib/post-types";

const PER_PAGE = 9;
const T = {
  en: { all: "All", page: "Page", prev: "← Newer", next: "Older →", other: "हिंदी में पढ़ें", min: "min", none: "No guides in this category yet." },
  hi: { all: "सभी", page: "पेज", prev: "← नए", next: "पुराने →", other: "Read in English", min: "मिनट", none: "इस श्रेणी में अभी कोई गाइड नहीं है।" },
};

/** Category filter, pagination and an English/Hindi switch for the long-form posts. */
export function PostIndex({ posts, lang, otherHref }: { posts: PostMeta[]; lang: PostLang; otherHref: string }) {
  const t = T[lang];
  const cats = useMemo(() => Array.from(new Set(posts.map((p) => p.category))).sort(), [posts]);
  const [cat, setCat] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const list = cat ? posts.filter((p) => p.category === cat) : posts;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const shown = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pick = (c: string | null) => {
    setCat(c);
    setPage(1);
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {[null, ...cats].map((c) => (
          <button key={c ?? "all"} type="button" onClick={() => pick(c)} aria-pressed={cat === c} className={`rounded-full px-4 py-1.5 text-sm font-bold ${cat === c ? "bg-emerald-700 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-emerald-400 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700"}`}>
            {c ?? t.all}
          </button>
        ))}
        <Link href={otherHref} hrefLang={lang === "hi" ? "en-IN" : "hi-IN"} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-bold text-stone-900 hover:bg-amber-300">
          <Languages className="h-4 w-4" /> {t.other}
        </Link>
      </div>
      {shown.length === 0 ? (
        <p className="mt-8 text-stone-600">{t.none}</p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <li key={p.slug}>
              <Link href={postPath(p.lang, p.slug)} className="group block h-full overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-stone-700 dark:bg-stone-900">
                <Image src={p.heroImage} alt={p.heroAlt} width={600} height={315} unoptimized={p.heroImage.endsWith(".svg")} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} className="h-auto w-full" />
                <div className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{p.category}</p>
                  <h2 className="font-display mt-1 text-lg font-black leading-snug text-stone-900 group-hover:text-emerald-800 dark:text-white">{lang === "hi" ? p.hindiTitle : p.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-stone-400">{p.description}</p>
                  <p className="mt-3 flex items-center gap-1 text-xs text-stone-500"><Clock className="h-3.5 w-3.5" /> {p.readingTime} {t.min}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label={t.page} className="mt-8 flex items-center justify-center gap-3 text-sm font-bold">
          <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-full px-4 py-2 ring-1 ring-stone-300 disabled:opacity-40">{t.prev}</button>
          <span>{t.page} {page} / {pages}</span>
          <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} className="rounded-full px-4 py-2 ring-1 ring-stone-300 disabled:opacity-40">{t.next}</button>
        </nav>
      )}
    </div>
  );
}
