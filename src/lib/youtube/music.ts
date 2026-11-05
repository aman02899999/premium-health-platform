// An original soundtrack for every Short, made fresh at render time from sine, saw and noise
// waves (a TypeScript port of scripts/make-reel-music.py, which makes the Reel tracks). No samples
// and no third-party audio, so the gym owns every track and YouTube's Content ID has nothing to
// match. Each Short's place in the bank picks a different key, chord progression and scale, so
// no two Shorts share a track; tempo, melody pattern, lead sound and drums vary on top of that.
// Pure (no ffmpeg, no files), so it can be tested.

export const SR = 44100;

const PROGRESSIONS = [
  [0, 5, 2, 6],
  [0, 3, 5, 4],
  [0, 6, 5, 6],
  [5, 3, 0, 4],
  [0, 4, 5, 3],
  [0, 2, 5, 4],
];
const ARPS = [
  [0, 1, 2, 3, 2, 1, 0, 2, 0, 1, 2, 3, 2, 1, 2, -1],
  [0, -1, 2, 1, 0, -1, 2, 3, 0, -1, 2, 1, 3, 2, 1, -1],
  [0, 2, 1, 2, 0, 2, 1, 3, 0, 2, 1, 2, 3, 2, 1, 0],
  [0, 1, 2, 1, 3, 1, 2, 1, 0, 1, 2, 1, 3, 2, 3, -1],
  [0, -1, 0, 2, -1, 2, 1, -1, 0, -1, 0, 3, -1, 2, 1, -1],
  [3, 2, 1, 0, 3, 2, 1, 0, 2, 1, 0, 1, 2, 3, 2, -1],
];
const BPMS = [118, 120, 122, 124, 126, 128, 130, 132];
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const LEADS = ["supersaw", "pluck", "square"] as const;

export type MusicPlan = { root: number; minor: boolean; prog: number[]; bpm: number; arp: number[]; lead: (typeof LEADS)[number]; hats: 0 | 1 | 2; seed: number };

/**
 * The musical recipe for Short number `index`. Key, progression and scale come straight from the
 * index (12 × 6 × 2 = 144 different combinations before any repeats); the rest is mixed in.
 */
export function musicPlan(index: number): MusicPlan {
  const i = Math.max(0, Math.floor(index));
  const j = Math.floor(i / 12);
  const mix = (i * 2654435761) >>> 0;
  return {
    root: (i * 7) % 12,
    prog: PROGRESSIONS[j % PROGRESSIONS.length],
    minor: Math.floor(j / PROGRESSIONS.length) % 2 === 0,
    bpm: BPMS[mix % BPMS.length],
    arp: ARPS[(mix >>> 3) % ARPS.length],
    lead: LEADS[(mix >>> 7) % LEADS.length],
    hats: ((mix >>> 11) % 3) as 0 | 1 | 2,
    seed: i + 1,
  };
}

/** A short, stable label of what makes a track unique (used by the tests). */
export const planKey = (p: MusicPlan) => `${p.root}:${p.minor ? "m" : "M"}:${p.prog.join("")}`;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** Notes (MIDI) of the triad on scale degree `d`. */
function triad(p: MusicPlan, d: number, octave: number): number[] {
  const scale = p.minor ? SCALES.minor : SCALES.major;
  return [0, 2, 4].map((k) => {
    const step = d + k;
    return 12 * (octave + 1) + p.root + scale[step % 7] + 12 * Math.floor(step / 7);
  });
}

function biquad(x: Float32Array, kind: "lp" | "hp" | "bp", f0: number, q = 0.707): Float32Array {
  const w0 = (2 * Math.PI * f0) / SR;
  const alpha = Math.sin(w0) / (2 * q);
  const cw = Math.cos(w0);
  const b = kind === "lp" ? [(1 - cw) / 2, 1 - cw, (1 - cw) / 2] : kind === "hp" ? [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2] : [alpha, 0, -alpha];
  const a0 = 1 + alpha;
  const [b0, b1, b2] = b.map((c) => c / a0);
  const a1 = (-2 * cw) / a0;
  const a2 = (1 - alpha) / a0;
  const y = new Float32Array(x.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
    y[i] = yi;
  }
  return y;
}

/** Renders `seconds` of the track as interleaved stereo samples in -1..1. */
export function renderMusic(p: MusicPlan, seconds: number): Float32Array {
  const rand = rng(p.seed);
  const beat = 60 / p.bpm;
  const bar = 4 * beat;
  const step = beat / 4;
  const n = Math.ceil((seconds + 0.5) * SR);
  const bars = Math.ceil(n / SR / bar);
  const bus = { kick: new Float32Array(n), clap: new Float32Array(n), hat: new Float32Array(n), bass: new Float32Array(n), pad: new Float32Array(n), lead: new Float32Array(n) };
  const put = (b: Float32Array, at: number, len: number, gain: number, f: (k: number, t: number) => number) => {
    const i0 = Math.round(at * SR);
    for (let k = 0; k < len && i0 + k < n; k++) b[i0 + k] += f(k, k / SR) * gain;
  };
  // Sections: intro (filtered pad and kick), build (+ hats), drop, breakdown (no kick), drop, and so on.
  const section = (bi: number) => {
    const s = bi % 16;
    return bi < 2 ? "intro" : bi < 4 ? "build" : s >= 12 && s < 14 ? "break" : "drop";
  };
  const kickLen = Math.round(0.42 * SR);
  for (let bi = 0; bi < bars; bi++) {
    const t0 = bi * bar;
    const sec = section(bi);
    const chord = triad(p, p.prog[bi % p.prog.length], 3);
    for (let b = 0; b < 4; b++) {
      const tb = t0 + b * beat;
      if (sec !== "break")
        put(bus.kick, tb, kickLen, 0.95, (_, t) => {
          const ph = 2 * Math.PI * (45 * t + (110 / 32) * (1 - Math.exp(-t * 32)));
          return Math.tanh(1.6 * (Math.sin(ph) * Math.exp(-t * 7.5) + Math.exp(-t * 400) * 0.5));
        });
      if (sec === "drop" && (b === 1 || b === 3))
        put(bus.clap, tb, Math.round(0.22 * SR), 0.5, (_, t) => (rand() * 2 - 1) * (Math.exp(-t * 90) + (t > 0.011 ? Math.exp(-(t - 0.011) * 90) : 0) + Math.exp(-t * 18) * 0.5));
      if (sec !== "intro") {
        put(bus.hat, tb + beat / 2, Math.round(0.1 * SR), 0.4, (_, t) => (rand() * 2 - 1) * Math.exp(-t / 0.05));
        if (sec === "drop" && p.hats > 0)
          for (const s of p.hats === 2 ? [1, 3] : [3]) put(bus.hat, tb + s * step, Math.round(0.04 * SR), 0.2, (_, t) => (rand() * 2 - 1) * Math.exp(-t / 0.016));
      }
      // Off-beat bass on the chord root.
      const bf = midiHz(chord[0] - 12);
      put(bus.bass, tb + beat / 2, Math.round((beat / 2) * SR), sec === "drop" ? 0.9 : 0.45, (_, t) => (2 * ((t * bf) % 1) - 1) * Math.min(1, t / 0.003) * Math.exp(-t / 0.12));
    }
    // Pad: the bar's chord held, as a detuned saw stack.
    const padLen = Math.round(bar * SR);
    for (const m of chord) {
      const f = midiHz(m);
      put(bus.pad, t0, padLen, 0.55 / chord.length, (_, t) => {
        let v = 0;
        for (let d = -2; d <= 2; d++) v += 2 * ((t * f * 2 ** ((d * 9) / 1200) + d * 0.137) % 1) - 1;
        return (v / 5) * Math.min(1, t / 0.03) * Math.exp(-t / 3.5);
      });
    }
    // Lead arp, an octave up, in the drops and breakdowns.
    if (sec === "drop" || sec === "break") {
      const tones = chord.map((m) => midiHz(m + 12));
      for (let s = 0; s < 16; s++) {
        const deg = p.arp[s];
        if (deg < 0) continue;
        const f = tones[deg % tones.length] * (deg >= tones.length ? 2 : 1);
        const len = Math.round(step * SR * 0.95);
        put(bus.lead, t0 + s * step, len, sec === "break" ? 0.22 : 0.3, (_, t) => {
          const env = Math.min(1, t / 0.002) * Math.exp(-t / (p.lead === "pluck" ? 0.04 : 0.07));
          const w = p.lead === "square" ? Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.6 : (2 * ((t * f) % 1) - 1 + (2 * ((t * f * 1.004 + 0.3) % 1) - 1)) / 2;
          return w * env;
        });
      }
    }
  }
  const bass = biquad(bus.bass, "lp", 420, 1.1);
  const pad = biquad(bus.pad, "lp", 4200, 0.8);
  const lead = biquad(bus.lead, "lp", 6500, 0.8);
  const hat = biquad(bus.hat, "hp", 7000);
  const clap = biquad(bus.clap, "bp", 1500, 1.2);
  const out = new Float32Array(n * 2);
  const delay = Math.round(beat * 0.75 * SR);
  let peak = 1e-6;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const bi = Math.floor(t / bar);
    const phase = (t % beat) / beat;
    // Sidechain pump under each kick (not in the breakdown, which has no kick).
    const duck = section(bi) === "break" ? 1 : 0.3 + 0.7 * Math.min(1, phase / 0.45) ** 1.5;
    // The intro's pad starts muffled and opens up.
    const open = bi < 2 ? 0.35 + 0.65 * (t / (2 * bar)) : 1;
    const mel = (bass[i] * 0.9 + pad[i] * 0.8 * open + lead[i]) * duck;
    const echo = i >= delay ? lead[i - delay] * 0.25 : 0;
    const dry = bus.kick[i] + clap[i] * 1.6 + hat[i] + mel;
    const l = Math.tanh((dry + echo * 0.9 + hat[i] * 0.1) * 1.15);
    const r = Math.tanh((dry + echo * 0.3 - hat[i] * 0.1) * 1.15);
    out[2 * i] = l;
    out[2 * i + 1] = r;
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
  }
  const g = 0.89 / peak;
  for (let i = 0; i < out.length; i++) out[i] *= g;
  return out;
}

/** Interleaved stereo samples as a 16-bit PCM WAV file. */
export function wav(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
