import "server-only";
import { dailyPost, type PostBiz } from "@/lib/growth/daily-posts";
import { reelFrames } from "./reel-frames";
import { reelScenes } from "./reel-scenes";
import { encodeReel } from "./reel-video";

const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);

/** The day's Reel as an MP4: the day's post, scene by scene. */
export async function renderReel(date: string, biz: PostBiz): Promise<Buffer> {
  const scenes = reelScenes(dailyPost(date, biz));
  const frames = await reelFrames(scenes, biz);
  return encodeReel(
    frames,
    scenes.map((s) => s.seconds),
    dayNumber(date),
  );
}
