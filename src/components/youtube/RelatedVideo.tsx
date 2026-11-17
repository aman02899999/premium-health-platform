import { YOUTUBE_CHANNEL, absoluteUrl } from "@/lib/site";
import { videoForPage } from "@/lib/youtube/site-videos";
import { VideoFacade } from "./VideoFacade";

const COPY = {
  en: { kicker: "Watch the video", note: "A 4–5 minute guide in easy Hinglish, with sources. Education only, not medical advice.", watch: "Watch on YouTube", sub: "Subscribe" },
  hi: { kicker: "वीडियो देखें", note: "आसान हिंग्लिश में 4–5 मिनट की गाइड, सोर्स के साथ। सिर्फ़ जानकारी के लिए, मेडिकल सलाह नहीं।", watch: "YouTube पर देखें", sub: "सब्सक्राइब करें" },
};

/**
 * The channel's long video on this page's subject, as a click-to-play box with VideoObject markup.
 * Renders nothing when no live video fits. `text` is the page's title, tags and keywords.
 */
export async function RelatedVideo({ text, tone = "light", lang = "en", className = "" }: { text: string; tone?: "light" | "dark"; lang?: "en" | "hi"; className?: string }) {
  const v = await videoForPage(text);
  if (!v) return null;
  const t = COPY[lang];
  const watch = `https://www.youtube.com/watch?v=${v.youtubeId}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    thumbnailUrl: [absoluteUrl(v.thumb), `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`],
    uploadDate: v.uploadDate,
    embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
    url: watch,
    inLanguage: "hi-Latn",
    publisher: { "@type": "Organization", name: "Royal Fitness Club", url: absoluteUrl("/") },
  };
  const dark = tone === "dark";
  return (
    <section aria-label={t.kicker} className={`${dark ? "border-white/10 bg-white/[0.03]" : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"} rounded-3xl border p-4 sm:p-5 ${className}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <p className={`text-xs font-bold ${lang === "hi" ? "" : "uppercase tracking-[0.18em]"} ${dark ? "text-brand" : "text-red-700 dark:text-red-400"}`}>{t.kicker}</p>
      <h2 className={`mt-1 text-lg font-bold leading-snug ${dark ? "text-white" : "text-stone-900 dark:text-white"}`}>{v.title}</h2>
      <div className="mt-3">
        <VideoFacade id={v.youtubeId} title={v.title} thumb={v.thumb} />
      </div>
      <p className={`mt-3 text-sm ${dark ? "text-white/65" : "text-stone-600 dark:text-stone-300"}`}>{t.note}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
        <a href={watch} target="_blank" rel="noopener noreferrer" className="rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700">{t.watch} →</a>
        <a href={YOUTUBE_CHANNEL.subscribe} target="_blank" rel="noopener noreferrer" className={`rounded-full border px-4 py-2 ${dark ? "border-white/20 text-white hover:border-brand" : "border-stone-300 text-stone-800 hover:border-red-600 dark:border-stone-600 dark:text-stone-100"}`}>{t.sub}</a>
      </div>
    </section>
  );
}
