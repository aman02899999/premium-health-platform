import "server-only";
import { dailyPost, type DailyPost, type PostBiz } from "@/lib/growth/daily-posts";
import { galleryDataUrl } from "./cover";
import { reelFrames } from "./reel-frames";
import { reelScenes } from "./reel-scenes";
import { encodeReel } from "./reel-video";

const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);

/** The day's Reel as an MP4: the day's post, scene by scene. */
export async function renderReel(date: string, biz: PostBiz): Promise<Buffer> {
  return renderReelPost(dailyPost(date, biz), dayNumber(date), null, biz);
}

/**
 * Any post as a Reel. `seed` picks the music track; `photo` (a public/gallery file) goes behind
 * the opening and closing screens.
 */
export async function renderReelPost(post: DailyPost, seed: number, photo: string | null, biz: PostBiz): Promise<Buffer> {
  const scenes = reelScenes(post);
  const frames = await reelFrames(scenes, biz, photo ? await galleryDataUrl(photo, 1080, 1920) : null);
  return encodeReel(
    frames,
    scenes.map((s) => s.seconds),
    seed,
  );
}
