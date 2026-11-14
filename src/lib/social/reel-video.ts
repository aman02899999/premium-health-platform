import "server-only";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reelMusicPlan, renderMusic, wav } from "@/lib/youtube/music";
import { FADE } from "./reel-scenes";

// Frames → MP4 with ffmpeg: each scene holds with a slow push-in, scenes cross-fade, a gold
// progress bar runs along the top. H.264 + AAC, 1080×1920, 30 fps: what Instagram and Facebook
// Reels ask for. Every Reel gets its own original soundtrack, made at render time by the same
// synth the YouTube Shorts use (owner's rule, 14 Nov 2026: never the same music twice).

const FPS = 30;

export function ffmpegPath(): string | null {
  const candidates = [process.env.FFMPEG_PATH, join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg")];
  return candidates.find((p): p is string => !!p && existsSync(p)) ?? null;
}

/** The ffmpeg filter graph for scenes of these lengths (exported for tests). */
export function filterGraph(seconds: number[], hasMusic: boolean): string {
  const total = seconds.reduce((t, s) => t + s, 0) - FADE * (seconds.length - 1);
  const parts = seconds.map((s, i) => {
    const frames = Math.round(s * FPS);
    // Hold one decoded frame, then push in 4% over the scene.
    return `[${i}:v]format=yuv420p,setsar=1,loop=loop=${frames - 1}:size=1:start=0,setpts=N/${FPS}/TB,scale=w='trunc(1080*(1+0.04*t/${s})/2)*2':h=-2:eval=frame:flags=bilinear,crop=1080:1920[v${i}]`;
  });
  let last = "v0";
  let offset = 0;
  seconds.slice(1).forEach((_, k) => {
    const i = k + 1;
    offset += seconds[i - 1] - FADE;
    const out = `x${i}`;
    parts.push(`[${last}][v${i}]xfade=transition=${i % 2 ? "fade" : "slideleft"}:duration=${FADE}:offset=${offset.toFixed(2)}[${out}]`);
    last = out;
  });
  parts.push(`[${last}]drawbox=x=0:y=0:w='iw*t/${total.toFixed(2)}':h=12:color=0xffcf5a@1:t=fill,format=yuv420p[vout]`);
  const a = seconds.length;
  parts.push(hasMusic ? `[${a}:a]afade=t=in:d=0.5,afade=t=out:st=${Math.max(0, total - 1.2).toFixed(2)}:d=1.2,volume=0.8[aout]` : `[${a}:a]anull[aout]`);
  return parts.join(";");
}

/** Writes this Reel's own track (a few seconds longer than the video) into `dir`. */
async function music(seed: number, seconds: number, dir: string): Promise<string> {
  const path = join(dir, "music.wav");
  await writeFile(path, wav(renderMusic(reelMusicPlan(seed), Math.ceil(seconds) + 2)));
  return path;
}

function run(bin: string, args: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err = (err + d).slice(-2000)));
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("error", (e) => (clearTimeout(timer), reject(e)));
    child.on("close", (code) => (clearTimeout(timer), code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.trim().split("\n").pop()}`))));
  });
}

/** Encodes PNG frames (one per scene, with its length in seconds) into an MP4. */
export async function encodeReel(frames: Buffer[], seconds: number[], seed = 0): Promise<Buffer> {
  const bin = ffmpegPath();
  if (!bin) throw new Error("ffmpeg is not available");
  if (frames.length !== seconds.length || frames.length < 2) throw new Error("A Reel needs at least two scenes");
  const dir = await mkdtemp(join(tmpdir(), "reel-"));
  try {
    await Promise.all(frames.map((f, i) => writeFile(join(dir, `s${i}.png`), f)));
    const total = seconds.reduce((t, s) => t + s, 0) - FADE * (seconds.length - 1);
    const track = await music(seed, total, dir);
    const out = join(dir, "reel.mp4");
    const args = [
      "-y",
      "-loglevel",
      "error",
      ...frames.flatMap((_, i) => ["-i", join(dir, `s${i}.png`)]),
      ...(track ? ["-stream_loop", "-1", "-i", track] : ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]),
      "-filter_complex",
      filterGraph(seconds, !!track),
      "-map",
      "[vout]",
      "-map",
      "[aout]",
      "-t",
      total.toFixed(2),
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "22",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      "-c:a",
      "aac",
      "-ar",
      "48000",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      out,
    ];
    await run(bin, args, 240_000);
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
