import "server-only";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { ffmpegPath } from "@/lib/social/reel-video";
import { shortFilterGraph } from "./shorts-graph";

// Frames → MP4 for YouTube Shorts: 1080×1920, 30 fps, H.264 + AAC. The graph itself (punch-in
// zoom, word pops, transitions, progress bar) is in shorts-graph.ts so it can be tested. Music is
// the gym's own tracks in src/lib/social/reel-audio (no third-party audio, so no Content ID claims).

const AUDIO_DIR = join(process.cwd(), "src/lib/social/reel-audio");

async function music(seed: number): Promise<string | null> {
  const files = (await readdir(AUDIO_DIR).catch(() => [] as string[])).filter((f) => f.endsWith(".mp3")).sort();
  return files.length ? join(AUDIO_DIR, files[seed % files.length]) : null;
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

export async function encodeShort(frames: { scene: number; png: Buffer; seconds: number }[], seed = 0): Promise<Buffer> {
  const bin = ffmpegPath();
  if (!bin) throw new Error("ffmpeg is not available");
  const dir = await mkdtemp(join(tmpdir(), "short-"));
  try {
    await Promise.all(frames.map((f, i) => writeFile(join(dir, `f${i}.png`), f.png)));
    const track = await music(seed);
    const { graph, total } = shortFilterGraph(frames, !!track);
    const out = join(dir, "short.mp4");
    const args = [
      "-y",
      "-loglevel",
      "error",
      ...frames.flatMap((_, i) => ["-i", join(dir, `f${i}.png`)]),
      ...(track ? ["-stream_loop", "-1", "-i", track] : ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]),
      "-filter_complex",
      graph,
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
      "20",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-c:a",
      "aac",
      "-ar",
      "48000",
      "-b:a",
      "160k",
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
