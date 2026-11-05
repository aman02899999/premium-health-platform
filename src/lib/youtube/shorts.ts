import "server-only";
import type { PostBiz } from "@/lib/growth/daily-posts";
import { GALLERY } from "@/lib/growth/month-plan";
import { galleryDataUrl } from "@/lib/social/cover";
import type { Short } from "./shorts-bank";
import { shortScenes, shortSeconds } from "./shorts-core";
import { musicPlan, renderMusic, wav } from "./music";
import { shortFrames } from "./shorts-frames";
import { encodeShort } from "./shorts-video";

/** The coach's photo behind the opening and closing screens, a different one for each Short. */
export const shortPhoto = (index: number) => GALLERY[index % GALLERY.length];

/** A Short as an MP4. `index` is its place in the bank: it picks the photo and its own music. */
export async function renderShort(short: Short, index: number, biz: PostBiz): Promise<Buffer> {
  const timed = shortScenes(short);
  const frames = await shortFrames(timed, biz, await galleryDataUrl(shortPhoto(index), 1080, 1920));
  const music = wav(renderMusic(musicPlan(index), shortSeconds(timed) + 1));
  return encodeShort(frames, music);
}
