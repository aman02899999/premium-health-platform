import "server-only";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { ffmpegPath } from "@/lib/social/reel-video";
import { musicPlan, renderMusic, wav } from "./music";
import { clipFilterGraph, END_CARD_LINES, MAX_CLIP_SECONDS, probe, type ClipInput } from "./clips-core";

// Renders the owner's phone clip into a finished Short: 1080×1920, captions, an original music bed
// (music.ts, so no copyright claims), the gym's end card. Text is drawn with sharp (Pango), which
// shapes Hinglish and Devanagari correctly. Runs on the GitHub runner, never on the website.

const FONTS = join(process.cwd(), "src/lib/social/fonts");
const markup = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

async function textPng(text: string, size: number, color: string, width: number): Promise<{ png: Buffer; w: number; h: number }> {
  const fontfile = hasDevanagari(text) ? join(FONTS, "noto-sans-devanagari-700.woff") : join(FONTS, "inter-extrabold.ttf");
  const font = hasDevanagari(text) ? `Noto Sans Devanagari Bold ${size}` : `Inter ExtraBold ${size}`;
  const png = await sharp({ text: { text: `<span foreground="${color}">${markup(text)}</span>`, font, fontfile, rgba: true, dpi: 150, width, align: "centre" } }).png().toBuffer();
  const m = await sharp(png).metadata();
  return { png, w: m.width ?? width, h: m.height ?? size };
}

/** Text on a rounded box, as a PNG to overlay. */
async function boxed(text: string, size: number, fg: string, bg: string): Promise<Buffer> {
  const t = await textPng(text, size, fg, 880);
  const w = t.w + 60;
  const h = t.h + 40;
  const box = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="22" fill="${bg}"/></svg>`);
  return sharp(box).composite([{ input: t.png, left: 30, top: 20 }]).png().toBuffer();
}

async function endCard(): Promise<Buffer> {
  const lines = await Promise.all(END_CARD_LINES.map((l, i) => textPng(l, i === 2 ? 40 : 32, i === 2 ? "#ffcf5a" : "#ffffff", 960)));
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#06111c" fill-opacity="0.92"/></svg>`);
  let y = 760;
  const layers = lines.map((l) => {
    const layer = { input: l.png, left: Math.round((1080 - l.w) / 2), top: y };
    y += l.h + 40;
    return layer;
  });
  return sharp(bg).composite(layers).png().toBuffer();
}

function run(bin: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => (err = (err + d).slice(-8000)));
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("error", (e) => (clearTimeout(timer), reject(e)));
    child.on("close", (code) => (clearTimeout(timer), code === 0 ? resolve(err) : reject(Object.assign(new Error(`ffmpeg exited ${code}: ${err.trim().split("\n").pop()}`), { stderr: err }))));
  });
}

/** The finished MP4. `index` picks this clip's own music (CLIP_INDEX_BASE + its number). */
export async function renderClip(raw: Buffer, c: ClipInput, index: number): Promise<Buffer> {
  const bin = ffmpegPath();
  if (!bin) throw new Error("ffmpeg is not available");
  const dir = await mkdtemp(join(tmpdir(), "clip-"));
  try {
    const src = join(dir, "raw");
    await writeFile(src, raw);
    // ffmpeg -i with no output exits 1 but prints the file's details, which is all we need.
    const info = await run(bin, ["-hide_banner", "-i", src], 30_000).catch((e: Error & { stderr?: string }) => e.stderr ?? "");
    const p = probe(info);
    if (!p) throw new Error("Couldn't read the video (is it an MP4 or MOV?)");
    const seconds = Math.min(p.seconds, MAX_CLIP_SECONDS);
    const [hook, end, ...caps] = await Promise.all([boxed(c.hook, 40, "#0b0b0b", "#ffcf5a"), endCard(), ...c.captions.map((l) => boxed(l, 34, "#ffffff", "#000000b3"))]);
    const files = ["hook.png", "end.png", ...caps.map((_, i) => `cap${i}.png`)];
    await Promise.all([hook, end, ...caps].map((png, i) => writeFile(join(dir, files[i]), png)));
    await writeFile(join(dir, "music.wav"), wav(renderMusic(musicPlan(index), seconds + 1)));
    const out = join(dir, "final.mp4");
    await run(
      bin,
      [
        "-y", "-loglevel", "error",
        "-i", src,
        ...files.flatMap((f) => ["-loop", "1", "-i", join(dir, f)]),
        "-i", join(dir, "music.wav"),
        "-filter_complex", clipFilterGraph(seconds, caps.length, p.hasAudio),
        "-map", "[vout]", "-map", "[aout]",
        "-t", seconds.toFixed(2),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-ar", "48000", "-b:a", "160k",
        "-movflags", "+faststart",
        out,
      ],
      300_000,
    );
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
