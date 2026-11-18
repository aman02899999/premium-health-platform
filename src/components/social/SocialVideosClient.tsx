"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { InstagramIcon, YouTubeIcon } from "@/components/ui/BrandIcons";
import { instagramEmbedUrl, tidyTitle } from "@/lib/social/feed-format";
import type { InstaItem, ShortItem } from "@/lib/social/site-feed-core";

export type LongCard = { youtubeId: string; title: string; thumb: string };
export type Tone = "dark" | "light";

type Props = {
  tone: Tone;
  long: LongCard[];
  shorts: ShortItem[];
  instagram: InstaItem[];
  channelUrl: string;
  subscribeUrl: string;
  instagramHandle: string;
};

// Everything here is a picture and a button until it is clicked. The YouTube player and the
// Instagram embed (each about 1 MB of scripts) load only after a tap, so the home page's speed
// (LCP, CLS) is unchanged. youtube-nocookie.com sets no tracking cookies before play.

const ytEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const IFRAME_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

const T = {
  dark: {
    panel: "glass rounded-3xl border border-white/10 p-4 sm:p-6",
    head: "text-white",
    sub: "text-white/60",
    chip: "border-white/15 text-white/80 hover:border-brand hover:text-white",
    chipOn: "border-brand bg-brand/15 text-white",
    ghost: "border-white/20 text-white hover:border-brand",
    dialog: "bg-[#06111c] text-white",
  },
  light: {
    panel: "rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 dark:border-stone-700 dark:bg-stone-900",
    head: "text-stone-900 dark:text-white",
    sub: "text-stone-600 dark:text-stone-300",
    chip: "border-stone-200 text-stone-700 hover:border-red-500 dark:border-stone-700 dark:text-stone-200",
    chipOn: "border-red-600 bg-red-50 text-stone-900 dark:bg-red-950/40 dark:text-white",
    ghost: "border-stone-300 text-stone-800 hover:border-red-600 dark:border-stone-600 dark:text-stone-100",
    dialog: "bg-white text-stone-900 dark:bg-stone-900 dark:text-white",
  },
} as const;

function PlayBadge({ small = false }: { small?: boolean }) {
  return (
    <span aria-hidden className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-red-600/90 shadow-lg transition group-hover:scale-110 group-hover:bg-red-500 ${small ? "h-9 w-12" : "h-12 w-[4.25rem]"}`}>
      <svg viewBox="0 0 24 24" className={`ml-0.5 fill-white ${small ? "h-5 w-5" : "h-7 w-7"}`}><path d="M8 5v14l11-7z" /></svg>
    </span>
  );
}

type Popup = { kind: "short"; item: ShortItem } | { kind: "insta"; item: InstaItem } | null;

/** A modal player for a Short or an Instagram post; the iframe exists only while it is open. */
function PlayerDialog({ popup, onClose, tone }: { popup: Popup; onClose: () => void; tone: Tone }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (popup && !d.open) d.showModal();
    if (!popup && d.open) d.close();
  }, [popup]);
  const title = popup ? (popup.kind === "short" ? popup.item.title : tidyTitle(popup.item.title)) : "";
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label={title || "Video player"}
      className={`m-auto w-[min(92vw,400px)] overflow-hidden rounded-3xl p-0 shadow-2xl backdrop:bg-black/80 ${T[tone].dialog}`}
    >
      {popup && (
        <div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="line-clamp-1 text-sm font-bold">{title}</p>
            <button type="button" onClick={onClose} className="shrink-0 rounded-full px-3 py-1 text-sm font-bold ring-1 ring-current/30 hover:opacity-80" aria-label="Close video">
              ✕
            </button>
          </div>
          {popup.kind === "short" ? (
            <div className="relative mx-auto aspect-[9/16] max-h-[78svh] w-full bg-black">
              <iframe src={ytEmbed(popup.item.youtubeId)} title={popup.item.title} allow={IFRAME_ALLOW} allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full border-0" />
            </div>
          ) : (
            <div className="relative h-[min(78svh,640px)] w-full bg-white">
              <p aria-hidden className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-stone-500">Loading from Instagram…</p>
              <iframe src={instagramEmbedUrl(popup.item)} title={tidyTitle(popup.item.title)} allow={IFRAME_ALLOW} allowFullScreen loading="eager" className="relative h-full w-full border-0" />
            </div>
          )}
          <div className="flex justify-end px-4 py-3">
            <a
              href={popup.kind === "short" ? `https://www.youtube.com/shorts/${popup.item.youtubeId}` : popup.item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold underline underline-offset-4"
            >
              Open in {popup.kind === "short" ? "YouTube" : "Instagram"} →
            </a>
          </div>
        </div>
      )}
    </dialog>
  );
}

export function SocialVideosClient({ tone, long, shorts, instagram, channelUrl, subscribeUrl, instagramHandle }: Props) {
  const t = T[tone];
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [popup, setPopup] = useState<Popup>(null);
  const featured = long[current];
  const igProfile = `https://www.instagram.com/${instagramHandle}/`;
  // An even number of cards, so the two-column grid never ends with a gap.
  const posts = instagram.length > 1 ? instagram.slice(0, instagram.length - (instagram.length % 2)) : instagram;

  const pick = (i: number) => {
    setCurrent(i);
    setPlaying(true);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
      {/* ---------- YouTube column ---------- */}
      <div className={t.panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className={`flex items-center gap-2 text-lg font-bold ${t.head}`}>
            <YouTubeIcon className="h-6 w-6 text-red-600" /> Royal Fitness TV
          </p>
          <a href={subscribeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
            Subscribe free
          </a>
        </div>

        {featured ? (
          <>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
              {playing ? (
                <iframe key={featured.youtubeId} src={ytEmbed(featured.youtubeId)} title={featured.title} allow={IFRAME_ALLOW} allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full border-0" />
              ) : (
                <button type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${featured.title}`} className="group absolute inset-0 h-full w-full cursor-pointer">
                  <Image src={featured.thumb} alt="" fill loading="lazy" sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
                  <PlayBadge />
                </button>
              )}
            </div>
            <p className={`mt-3 line-clamp-2 font-bold leading-snug ${t.head}`}>{featured.title}</p>

            {long.length > 1 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="More long videos">
                {long.map((v, i) =>
                  i === current ? null : (
                    <li key={v.youtubeId}>
                      <button type="button" onClick={() => pick(i)} className="group block w-full text-left" aria-label={`Play video: ${v.title}`}>
                        <span className="relative block aspect-video overflow-hidden rounded-xl bg-black">
                          <Image src={v.thumb} alt="" fill loading="lazy" sizes="(min-width: 1024px) 18vw, 45vw" className="object-cover transition duration-300 group-hover:scale-105" />
                          <PlayBadge small />
                        </span>
                        <span className={`mt-1.5 line-clamp-2 text-xs font-semibold leading-snug ${t.sub}`}>{v.title}</span>
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}
          </>
        ) : (
          <a href={channelUrl} target="_blank" rel="noopener noreferrer" className={`flex aspect-video items-center justify-center rounded-2xl border text-center font-bold ${t.ghost}`}>
            Watch free fitness videos on YouTube →
          </a>
        )}

        {shorts.length > 0 && (
          <div className="mt-6">
            <p className={`mb-2 text-sm font-bold ${t.head}`}>Shorts: 1-minute myth busters</p>
            <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]" aria-label="YouTube Shorts">
              {shorts.map((s) => (
                <li key={s.youtubeId} className="w-[38%] shrink-0 snap-start sm:w-[24%]">
                  <button type="button" onClick={() => setPopup({ kind: "short", item: s })} className="group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black text-left" aria-label={`Play Short: ${s.title}`}>
                    <Image src={ytThumb(s.youtubeId)} alt="" fill unoptimized loading="lazy" sizes="160px" className="object-cover transition duration-300 group-hover:scale-105" />
                    <span aria-hidden className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8">
                      <span className="line-clamp-3 text-xs font-bold leading-snug text-white">{s.title}</span>
                    </span>
                    <PlayBadge small />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <a href={channelUrl} target="_blank" rel="noopener noreferrer" className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-bold ${t.ghost}`}>
          See all videos on YouTube →
        </a>
      </div>

      {/* ---------- Instagram column ---------- */}
      <div className={t.panel}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className={`flex items-center gap-2 text-lg font-bold ${t.head}`}>
            <InstagramIcon className="h-6 w-6 text-pink-500" /> @{instagramHandle}
          </p>
          <a href={igProfile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 py-2 text-sm font-bold text-white hover:opacity-90">
            Follow
          </a>
        </div>
        {posts.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3" aria-label="Latest Instagram posts">
            {posts.map((p, i) => (
              <li key={p.code}>
                <button
                  type="button"
                  onClick={() => setPopup({ kind: "insta", item: p })}
                  aria-label={`${p.kind === "reel" ? "Watch Reel" : "View post"}: ${tidyTitle(p.title)}`}
                  className={`group relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-2xl p-3 text-left text-white ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl ${
                    ["bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]", "bg-gradient-to-br from-[#8134af] via-[#dd2a7b] to-[#feda77]", "bg-gradient-to-br from-[#515bd4] via-[#8134af] to-[#dd2a7b]"][i % 3]
                  }`}
                >
                  <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15" />
                  <span className="relative inline-flex w-fit items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {p.kind === "reel" ? "▶ Reel" : "Post"}
                  </span>
                  <span className="relative line-clamp-4 text-base font-extrabold leading-tight drop-shadow sm:text-lg">{tidyTitle(p.title)}</span>
                  <span className="relative flex items-center justify-between text-[11px] font-semibold text-white/85">
                    {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                    <span className="rounded-full bg-white/20 px-2 py-0.5 transition group-hover:bg-white/35">{p.kind === "reel" ? "Watch" : "View"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <a href={igProfile} target="_blank" rel="noopener noreferrer" className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] p-6 text-center font-bold text-white">
            <InstagramIcon className="h-10 w-10" />
            Daily tips, Reels and gym life on Instagram →
          </a>
        )}
        <p className={`mt-4 text-sm ${t.sub}`}>Tap a card to watch it here. New tips, Reels and workouts every day.</p>
      </div>

      <PlayerDialog popup={popup} onClose={() => setPopup(null)} tone={tone} />
    </div>
  );
}
