// The ffmpeg filter graph for a Short. Pure, so it can be tested without ffmpeg.
// - Inside a scene, its caption frames play back to back (the word-by-word pop).
// - Each scene opens with a quick zoom "punch" that settles, then drifts in slowly.
// - Scenes change with alternating transitions (slide up, white flash, slide left, zoom).
// - A gold progress bar runs along the top; the music fades in and out.
import { FADE } from "./shorts-core";

export const FPS = 30;
const TRANSITIONS = ["slideup", "fadewhite", "slideleft", "zoomin"] as const;

export function shortFilterGraph(frames: { scene: number; seconds: number }[], hasMusic: boolean): { graph: string; total: number; transitions: string[] } {
  const scenes: { inputs: number[]; frames: number[] }[] = [];
  frames.forEach((f, i) => {
    (scenes[f.scene] ??= { inputs: [], frames: [] }).inputs.push(i);
    scenes[f.scene].frames.push(Math.max(1, Math.round(f.seconds * FPS)));
  });
  const parts: string[] = [];
  const lengths: number[] = [];
  scenes.forEach((s, k) => {
    s.inputs.forEach((input, j) => parts.push(`[${input}:v]format=yuv420p,setsar=1,loop=loop=${s.frames[j] - 1}:size=1:start=0,setpts=N/${FPS}/TB[s${k}p${j}]`));
    const joined = s.inputs.length > 1 ? `${s.inputs.map((_, j) => `[s${k}p${j}]`).join("")}concat=n=${s.inputs.length}:v=1:a=0,setpts=PTS-STARTPTS` : `[s${k}p0]null`;
    const len = s.frames.reduce((a, b) => a + b, 0) / FPS;
    lengths.push(len);
    // Punch: starts 7% zoomed and settles in about half a second, then a slow 3% push-in.
    parts.push(`${joined},scale=w='trunc(1080*(1+0.07*exp(-7*t)+0.03*t/${len.toFixed(2)})/2)*2':h=-2:eval=frame:flags=bicubic,crop=1080:1920,setsar=1,settb=1/${FPS},fps=${FPS}[v${k}]`);
  });
  let last = "v0";
  let offset = 0;
  const transitions: string[] = [];
  for (let k = 1; k < scenes.length; k++) {
    offset += lengths[k - 1] - FADE;
    const t = TRANSITIONS[(k - 1) % TRANSITIONS.length];
    transitions.push(t);
    parts.push(`[${last}][v${k}]xfade=transition=${t}:duration=${FADE}:offset=${offset.toFixed(3)}[x${k}]`);
    last = `x${k}`;
  }
  const total = lengths.reduce((a, b) => a + b, 0) - FADE * (scenes.length - 1);
  parts.push(`[${last}]drawbox=x=0:y=0:w='iw*t/${total.toFixed(2)}':h=14:color=0xffcf5a@1:t=fill,format=yuv420p[vout]`);
  const a = frames.length;
  parts.push(hasMusic ? `[${a}:a]afade=t=in:d=0.3,afade=t=out:st=${Math.max(0, total - 1).toFixed(2)}:d=1,volume=0.85[aout]` : `[${a}:a]anull[aout]`);
  return { graph: parts.join(";"), total, transitions };
}
