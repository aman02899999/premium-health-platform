// An original soundtrack for every Short, made fresh at render time from sine, saw and noise
// waves (no samples and no third-party audio, so the gym owns every track and YouTube's Content
// ID has nothing to match). Six styles with their own drums, bass, chords and lead sound: house,
// lo-fi, trap, a dhol-style desi beat, synthwave and reggaeton. The style takes turns with each
// Short, so the three Shorts of a day always sound like three different kinds of music, and the
// key, chord progression, scale and tempo change on top, so no two Shorts share a track.
// Pure (no ffmpeg, no files), so it can be tested.

export const SR = 44100;

export const STYLES = ["house", "lofi", "trap", "desi", "synthwave", "reggaeton"] as const;
export type Style = (typeof STYLES)[number];

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
  [0, -1, 0, 2, -1, 2, 1, -1, 0, -1, 0, 3, -1, 2, 1, -1],
];
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };

/** Each style's sound: tempo range, drum patterns (16 steps a bar, x = hit) and instruments. */
type Kit = {
  bpm: [number, number];
  swing: number;
  kick: string;
  snare: string;
  clap: string;
  hat: string;
  open: string;
  toms: [string, string];
  bass: "offbeat" | "sub808" | "eighths" | "long" | "pluck" | "onkick";
  chords: "saw" | "keys" | "drone" | "none";
  lead: "supersaw" | "keysmelody" | "bell" | "tumbi" | "square" | "pluck";
  leadSteps: string;
  tone: number;
  minor: boolean | null;
};

const KITS: Record<Style, Kit> = {
  house: { bpm: [122, 128], swing: 0, kick: "x...x...x...x...", snare: "................", clap: "....x.......x...", hat: "x.x.x.x.x.x.x.x.", open: "..x...x...x...x.", toms: ["", ""], bass: "offbeat", chords: "saw", lead: "supersaw", leadSteps: "xxxxxxxxxxxxxxxx", tone: 6500, minor: null },
  lofi: { bpm: [78, 88], swing: 0.18, kick: "x.....x...x.....", snare: "....x.......x...", clap: "................", hat: "x.x.x.x.x.x.x.x.", open: "................", toms: ["", ""], bass: "long", chords: "keys", lead: "keysmelody", leadSteps: "x...x.x...x...x.", tone: 3200, minor: null },
  trap: { bpm: [136, 146], swing: 0, kick: "x......x..x.....", snare: "........x.......", clap: "........x.......", hat: "xxxxxxxxxxxxxxxx", open: "................", toms: ["", ""], bass: "sub808", chords: "none", lead: "bell", leadSteps: "x..x..x...x..x..", tone: 7000, minor: true },
  desi: { bpm: [98, 108], swing: 0.08, kick: "................", snare: "................", clap: "....x.......x...", hat: "..x...x...x...x.", open: "................", toms: ["x..x..x.x..x..x.", "..x.x...x.x.x..x"], bass: "pluck", chords: "drone", lead: "tumbi", leadSteps: "x.xx.x.xx.x.x.xx", tone: 7500, minor: null },
  synthwave: { bpm: [96, 108], swing: 0, kick: "x.......x.......", snare: "....x.......x...", clap: "................", hat: "x.x.x.x.x.x.x.x.", open: "................", toms: ["", ""], bass: "eighths", chords: "saw", lead: "square", leadSteps: "x...x...x.x.x...", tone: 5000, minor: true },
  reggaeton: { bpm: [90, 98], swing: 0, kick: "x...x...x...x...", snare: "...x..x....x..x.", clap: "................", hat: "x.x.x.x.x.x.x.x.", open: "................", toms: ["", ""], bass: "onkick", chords: "keys", lead: "pluck", leadSteps: "x..x..x.x..x..x.", tone: 6000, minor: null },
};

export type MusicPlan = { style: Style; root: number; minor: boolean; prog: number[]; bpm: number; arp: number[]; seed: number };

/**
 * The musical recipe for Short number `index`. The style takes turns (index % 6); within a style
 * the key and progression follow on (12 keys × 6 progressions), so the first 432 Shorts all get a
 * different style + key + progression. Tempo and melody pattern are mixed in from the index.
 */
export function musicPlan(index: number): MusicPlan {
  const i = Math.max(0, Math.floor(index));
  const style = STYLES[i % STYLES.length];
  const j = Math.floor(i / STYLES.length);
  const kit = KITS[style];
  const mix = (i * 2654435761) >>> 0;
  return {
    style,
    root: (j * 7) % 12,
    prog: PROGRESSIONS[Math.floor(j / 12) % PROGRESSIONS.length],
    minor: kit.minor ?? (Math.floor(j / 3) % 2 === 0),
    bpm: kit.bpm[0] + (mix % (kit.bpm[1] - kit.bpm[0] + 1)),
    arp: ARPS[(mix >>> 5) % ARPS.length],
    seed: i + 1,
  };
}

/** A short, stable label of what makes a track unique (used by the tests). */
export const planKey = (p: MusicPlan) => `${p.style}:${p.root}:${p.minor ? "m" : "M"}:${p.prog.join("")}`;

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
const saw = (ph: number) => 2 * (ph % 1) - 1;
const sq = (ph: number) => (ph % 1 < 0.5 ? 1 : -1);
const TAU = 2 * Math.PI;

/** Notes (MIDI) of the triad on scale degree `d`. */
function triad(p: MusicPlan, d: number, octave: number): number[] {
  const scale = p.minor ? SCALES.minor : SCALES.major;
  return [0, 2, 4].map((k) => {
    const step = d + k;
    return 12 * (octave + 1) + p.root + scale[step % 7] + 12 * Math.floor(step / 7);
  });
}

function biquad(x: Float32Array, kind: "lp" | "hp" | "bp", f0: number, q = 0.707): Float32Array {
  const w0 = (TAU * f0) / SR;
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

const hit = (pattern: string, s: number) => pattern[s] === "x";

/** Renders `seconds` of the track as interleaved stereo samples in -1..1. */
export function renderMusic(p: MusicPlan, seconds: number): Float32Array {
  const kit = KITS[p.style];
  const rand = rng(p.seed);
  const beat = 60 / p.bpm;
  const bar = 4 * beat;
  const step = beat / 4;
  const n = Math.ceil((seconds + 0.5) * SR);
  const bars = Math.ceil(n / SR / bar);
  const bus = { kick: new Float32Array(n), snare: new Float32Array(n), hat: new Float32Array(n), perc: new Float32Array(n), bass: new Float32Array(n), chords: new Float32Array(n), lead: new Float32Array(n) };
  const put = (b: Float32Array, at: number, len: number, gain: number, f: (t: number) => number) => {
    const i0 = Math.round(at * SR);
    for (let k = 0; k < len && i0 + k < n; k++) b[i0 + k] += f(k / SR) * gain;
  };
  // Sections: intro (chords only, filtered), build (+ drums), drop (everything), a breakdown
  // without kick every 16 bars, then the drop again.
  const section = (bi: number) => {
    const s = bi % 16;
    return bi < 2 ? "intro" : bi < 4 ? "build" : s >= 12 && s < 14 ? "break" : "drop";
  };
  const at = (t0: number, s: number) => t0 + s * step + (s % 2 === 1 ? kit.swing * step : 0);
  const soft = p.style === "lofi";
  for (let bi = 0; bi < bars; bi++) {
    const t0 = bi * bar;
    const sec = section(bi);
    const chord = triad(p, p.prog[bi % p.prog.length], 3);
    const rootHz = midiHz(chord[0] - 12);
    const drums = sec !== "intro";
    for (let s = 0; s < 16; s++) {
      const ts = at(t0, s);
      if (drums && sec !== "break" && hit(kit.kick, s))
        put(bus.kick, ts, Math.round(0.4 * SR), soft ? 0.7 : 0.95, (t) => {
          const ph = TAU * ((soft ? 50 : 45) * t + ((soft ? 60 : 110) / 32) * (1 - Math.exp(-t * 32)));
          return Math.tanh(1.6 * (Math.sin(ph) * Math.exp(-t * (soft ? 10 : 7.5)) + Math.exp(-t * 400) * (soft ? 0.2 : 0.5)));
        });
      if (drums && (sec === "drop" || p.style === "lofi") && hit(kit.snare, s)) {
        const gated = p.style === "synthwave";
        put(bus.snare, ts, Math.round((gated ? 0.32 : 0.2) * SR), soft ? 0.35 : 0.55, (t) => (rand() * 2 - 1) * (gated ? (t < 0.25 ? 0.9 : Math.exp(-(t - 0.25) * 60)) : Math.exp(-t * 22)) + Math.sin(TAU * 190 * t) * Math.exp(-t * 30) * 0.5);
      }
      if (drums && sec === "drop" && hit(kit.clap, s))
        put(bus.snare, ts, Math.round(0.22 * SR), 0.5, (t) => (rand() * 2 - 1) * (Math.exp(-t * 90) + (t > 0.011 ? Math.exp(-(t - 0.011) * 90) : 0) + Math.exp(-t * 18) * 0.5));
      if (drums && hit(kit.hat, s)) {
        const accent = s % 4 === 2 ? 1 : 0.6;
        put(bus.hat, ts, Math.round(0.05 * SR), (soft ? 0.18 : 0.3) * accent, (t) => (rand() * 2 - 1) * Math.exp(-t / 0.014));
        // Trap hat rolls: 32nd notes at the end of every other bar.
        if (p.style === "trap" && sec === "drop" && bi % 2 === 1 && s >= 12) put(bus.hat, ts + step / 2, Math.round(0.03 * SR), 0.22, (t) => (rand() * 2 - 1) * Math.exp(-t / 0.01));
      }
      if (drums && sec === "drop" && hit(kit.open, s)) put(bus.hat, ts, Math.round(0.14 * SR), 0.3, (t) => (rand() * 2 - 1) * Math.exp(-t / 0.06));
      // Dhol-style toms: a deep "dha" and a high "tak", each with a pitch drop.
      for (const [k, f0, g] of [
        [0, 95, 0.9],
        [1, 260, 0.45],
      ] as const)
        if (drums && hit(kit.toms[k], s) && sec !== "break")
          put(bus.perc, ts, Math.round(0.3 * SR), g, (t) => Math.sin(TAU * (f0 * t + (f0 * 0.6 / 18) * (1 - Math.exp(-t * 18)))) * Math.exp(-t * (k ? 16 : 9)) + (rand() * 2 - 1) * Math.exp(-t * 120) * 0.25);
      // Reggaeton rim on the dembow pattern sits on the perc bus too.
      if (p.style === "reggaeton" && drums && hit(kit.snare, s)) put(bus.perc, ts, Math.round(0.05 * SR), 0.3, (t) => Math.sin(TAU * 1700 * t) * Math.exp(-t * 80));
      // Bass.
      const bassGain = sec === "drop" ? 0.9 : 0.45;
      switch (kit.bass) {
        case "offbeat":
          if (s % 4 === 2) put(bus.bass, ts, Math.round(step * 2 * SR), bassGain, (t) => saw(t * rootHz) * Math.min(1, t / 0.003) * Math.exp(-t / 0.12));
          break;
        case "eighths":
          if (s % 2 === 0) put(bus.bass, ts, Math.round(step * 1.8 * SR), bassGain * 0.8, (t) => sq(t * rootHz) * 0.6 * Math.min(1, t / 0.003) * Math.exp(-t / 0.15));
          break;
        case "long":
          if (s === 0 || s === 8) put(bus.bass, ts, Math.round(step * 7.5 * SR), bassGain, (t) => Math.sin(TAU * rootHz * t) * Math.min(1, t / 0.01) * Math.exp(-t / 1.2));
          break;
        case "sub808":
          if (drums && hit(kit.kick, s)) put(bus.bass, ts, Math.round(step * 5 * SR), bassGain * 1.1, (t) => Math.tanh(1.8 * Math.sin(TAU * rootHz * t * (1 + 0.6 * Math.exp(-t * 25))) * Math.exp(-t / 0.9)));
          break;
        case "onkick":
          if (drums && hit(kit.kick, s)) put(bus.bass, ts, Math.round(step * 3 * SR), bassGain, (t) => Math.sin(TAU * rootHz * t) * Math.min(1, t / 0.004) * Math.exp(-t / 0.35));
          break;
        case "pluck":
          if (s % 4 === 0 || s === 6 || s === 14) put(bus.bass, ts, Math.round(step * 2 * SR), bassGain, (t) => (saw(t * rootHz) * 0.6 + Math.sin(TAU * rootHz * t)) * Math.min(1, t / 0.002) * Math.exp(-t / 0.1));
          break;
      }
    }
    // Chords.
    const chordLen = Math.round(bar * SR);
    if (kit.chords === "saw")
      for (const m of chord) {
        const f = midiHz(m);
        put(bus.chords, t0, chordLen, 0.55 / chord.length, (t) => {
          let v = 0;
          for (let d = -2; d <= 2; d++) v += saw(t * f * 2 ** ((d * 9) / 1200) + d * 0.137);
          return (v / 5) * Math.min(1, t / 0.03) * Math.exp(-t / 3.5);
        });
      }
    else if (kit.chords === "keys")
      // An electric-piano feel: soft sines with a little tremolo, struck twice a bar.
      for (const at2 of [0, bar / 2 + (p.style === "lofi" ? step * 0.5 : 0)])
        for (const m of chord) {
          const f = midiHz(m + 12);
          put(bus.chords, t0 + at2, Math.round((bar / 2) * SR), 0.5 / chord.length, (t) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t) * Math.exp(-t * 6)) * (1 + 0.15 * Math.sin(TAU * 5 * t)) * Math.min(1, t / 0.005) * Math.exp(-t / 1.1));
        }
    else if (kit.chords === "drone") {
      // A tanpura-like drone on the key's root and fifth, held the whole bar.
      const base = 12 * 4 + p.root;
      for (const m of [base, base + 7]) {
        const f = midiHz(m);
        put(bus.chords, t0, chordLen, 0.22, (t) => (saw(t * f) * 0.5 + saw(t * f * 1.003 + 0.4) * 0.5) * Math.min(1, t / 0.08) * (0.8 + 0.2 * Math.sin(TAU * 0.5 * t)));
      }
    }
    // Lead: in drops and breakdowns.
    if (sec === "drop" || sec === "break") {
      const tones = chord.map((m) => midiHz(m + 12));
      for (let s = 0; s < 16; s++) {
        if (!hit(kit.leadSteps, s)) continue;
        const deg = p.arp[s];
        if (deg < 0) continue;
        const f = tones[deg % tones.length] * (deg >= tones.length ? 2 : 1);
        const ts = at(t0, s);
        const g = sec === "break" ? 0.22 : 0.3;
        switch (kit.lead) {
          case "supersaw":
            put(bus.lead, ts, Math.round(step * 0.95 * SR), g, (t) => ((saw(t * f) + saw(t * f * 1.004 + 0.3)) / 2) * Math.min(1, t / 0.002) * Math.exp(-t / 0.07));
            break;
          case "pluck":
            put(bus.lead, ts, Math.round(step * 1.5 * SR), g, (t) => (sq(t * f) * 0.5 + Math.sin(TAU * f * t) * 0.5) * Math.min(1, t / 0.002) * Math.exp(-t / 0.05));
            break;
          case "square":
            put(bus.lead, ts, Math.round(step * 3.5 * SR), g * 0.8, (t) => sq(t * f * (1 + 0.004 * Math.sin(TAU * 5 * t))) * 0.6 * Math.min(1, t / 0.01) * Math.exp(-t / 0.5));
            break;
          case "bell":
            // A bell: a sine with a fast-fading metallic partial.
            put(bus.lead, ts, Math.round(step * 4 * SR), g, (t) => (Math.sin(TAU * f * 2 * t + 1.6 * Math.sin(TAU * f * 7 * t) * Math.exp(-t * 8)) * Math.exp(-t / 0.5)) * Math.min(1, t / 0.002));
            break;
          case "tumbi":
            // A tumbi-like twang: bright, very short, with a quick pitch bend.
            put(bus.lead, ts, Math.round(step * 0.9 * SR), g, (t) => sq(t * f * 2 * (1 + 0.03 * Math.exp(-t * 40))) * 0.5 * Math.min(1, t / 0.001) * Math.exp(-t / 0.035));
            break;
          case "keysmelody":
            put(bus.lead, ts, Math.round(step * 3 * SR), g * 0.8, (t) => Math.sin(TAU * f * t) * (1 + 0.2 * Math.sin(TAU * 4 * t)) * Math.min(1, t / 0.005) * Math.exp(-t / 0.6));
            break;
        }
      }
    }
  }
  const bass = biquad(bus.bass, "lp", kit.bass === "sub808" ? 260 : 420, 1.1);
  const chords = biquad(bus.chords, "lp", soft ? 1800 : 4200, 0.8);
  const lead = biquad(bus.lead, "lp", kit.tone, 0.8);
  const hat = biquad(bus.hat, "hp", soft ? 5000 : 7000);
  const snare = biquad(bus.snare, "bp", soft ? 1200 : 1600, 0.9);
  const out = new Float32Array(n * 2);
  const delay = Math.round(beat * 0.75 * SR);
  const pump = p.style === "house" || p.style === "synthwave";
  let peak = 1e-6;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const bi = Math.floor(t / bar);
    const phase = (t % beat) / beat;
    // Sidechain pump under the kick for the dance styles (not in the breakdown, which has no kick).
    const duck = pump && section(bi) !== "break" ? 0.3 + 0.7 * Math.min(1, phase / 0.45) ** 1.5 : 1;
    // The intro starts muffled and opens up.
    const open = bi < 2 ? 0.35 + 0.65 * (t / (2 * bar)) : 1;
    // Lo-fi gets a little vinyl crackle.
    const crackle = soft ? (rand() < 0.0008 ? (rand() * 2 - 1) * 0.15 : (rand() * 2 - 1) * 0.004) : 0;
    const mel = (bass[i] * 0.9 + chords[i] * 0.8 * open + lead[i]) * duck;
    const echo = i >= delay ? lead[i - delay] * 0.25 : 0;
    const dry = bus.kick[i] + snare[i] * 1.6 + hat[i] + bus.perc[i] + mel + crackle;
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
