import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { isDbConfigured } from "@/health/db";
import { YOUTUBE_CHANNEL } from "@/lib/site";
import { shareByCode } from "@/lib/challenge/store";
import { VideoFacade } from "@/components/youtube/VideoFacade";
import { VisitBeacon } from "@/components/challenge/VisitBeacon";

// A video a player shared for the watch-and-share task. Opening it (and staying a few seconds)
// counts toward their retry; the page also invites the visitor to the quiz with the sharer's code.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Watch: Royal Fitness Club video", robots: { index: false, follow: false } };

export default async function SharedVideoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const share = isDbConfigured ? await shareByCode(code) : null;
  if (!share) notFound();
  return (
    <section className="mx-auto max-w-3xl px-4 pb-10 pt-28 sm:px-6 sm:pt-36">
      <VisitBeacon code={code} />
      <p className="text-sm text-sky">{share.firstName} shared this with you</p>
      <h1 className="mt-1 font-display text-3xl text-white">Royal Fitness Club on YouTube</h1>
      <div className="mt-5">
        <VideoFacade id={share.videoId} title="Royal Fitness Club video" thumb={`https://i.ytimg.com/vi/${share.videoId}/hqdefault.jpg`} />
      </div>
      <a href={YOUTUBE_CHANNEL.subscribe} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 font-semibold text-white">Subscribe on YouTube</a>
      <div className="mt-8 rounded-2xl bg-brand/10 p-5 ring-1 ring-brand/30">
        <h2 className="flex items-center gap-2 font-display text-xl text-white"><Trophy className="h-5 w-5 text-amber-300" aria-hidden /> Royal Knowledge Challenge</h2>
        <p className="mt-1 text-sm text-white/80">Free fitness quiz. Get a certificate and badges, and top scores win up to 3 months free gym in Sector 93, Noida.</p>
        <Link prefetch={false} href={`/challenge?ref=${share.referralCode}`} className="btn-brand mt-3 inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold">Take the quiz</Link>
      </div>
    </section>
  );
}
