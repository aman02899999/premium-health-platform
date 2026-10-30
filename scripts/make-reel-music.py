#!/usr/bin/env python3
"""Writes the Reel soundtracks in src/lib/social/reel-audio: short, loopable EDM beds made from
scratch (sine/saw/noise synthesis, no samples, no third-party audio). Because every sound is
generated here, the gym owns the tracks outright and Instagram/Facebook have nothing to match
against a copyright database.

  python3 scripts/make-reel-music.py        (needs numpy and ffmpeg on PATH)

Same input, same output: the random noise is seeded, so re-running gives identical files.
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "social", "reel-audio")

NOTES = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def hz(name: str, octave: int) -> float:
    return 440.0 * 2 ** ((NOTES[name] + 12 * (octave + 1) - 69) / 12)


def biquad(x: np.ndarray, kind: str, f0: float, q: float = 0.707) -> np.ndarray:
    """RBJ cookbook low/high/band-pass filter (fixed cutoff)."""
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    cw = np.cos(w0)
    if kind == "lp":
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]
    elif kind == "hp":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
    else:
        b = [alpha, 0, -alpha]
    a = [1 + alpha, -2 * cw, 1 - alpha]
    b = [c / a[0] for c in b]
    a1, a2 = a[1] / a[0], a[2] / a[0]
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    b0, b1, b2 = b
    for i in range(len(x)):
        xi = x[i]
        yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, xi, y1, yi
        y[i] = yi
    return y


def sweep_lp(x: np.ndarray, start: float, end: float, steps: int = 32) -> np.ndarray:
    """A low-pass whose cutoff opens from start to end Hz (in blocks, cross-faded)."""
    out = np.zeros_like(x)
    edges = np.linspace(0, len(x), steps + 1).astype(int)
    for k in range(steps):
        f = start * (end / start) ** (k / max(1, steps - 1))
        a, b = edges[k], edges[k + 1]
        pad = min(a, 2048)
        out[a:b] = biquad(x[a - pad : b], "lp", f, 0.9)[pad:]
    return out


def saw(f: float, n: int, phase: float = 0.0) -> np.ndarray:
    t = np.arange(n) / SR
    return 2 * ((t * f + phase) % 1.0) - 1


def env(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def kick(n: int) -> np.ndarray:
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = np.exp(-t * 400) * 0.5
    return np.tanh(1.6 * (body + click))


def clap(n: int, rng: np.random.Generator) -> np.ndarray:
    noise = rng.uniform(-1, 1, n)
    t = np.arange(n) / SR
    e = np.zeros(n)
    for off in (0.0, 0.011, 0.022):
        e += np.where(t >= off, np.exp(-(t - off) * 90), 0)
    e += np.exp(-t * 18) * 0.5
    return biquad(noise * e, "bp", 1500, 1.2) * 1.8


def hat(n: int, rng: np.random.Generator, decay: float = 0.035) -> np.ndarray:
    return biquad(rng.uniform(-1, 1, n), "hp", 7500) * env(n, 0.001, decay)


def supersaw(f: float, n: int, voices: int = 7, detune: float = 0.18) -> np.ndarray:
    out = np.zeros(n)
    for v in range(voices):
        cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune * 100
        out += saw(f * 2 ** (cents / 1200), n, phase=v * 0.137)
    return out / voices


def track(seed: int, bpm: float, root: str, prog: list[list[tuple[str, int]]], arp_pattern: list[int], bars: int = 16) -> np.ndarray:
    rng = np.random.default_rng(seed)
    beat = 60.0 / bpm
    n_total = int(round(bars * 4 * beat * SR))
    step = beat / 4  # 16th note
    mix = {k: np.zeros(n_total) for k in ("kick", "clap", "hat", "bass", "pad", "lead")}

    def put(name: str, at: float, sig: np.ndarray, gain: float = 1.0) -> None:
        i = int(round(at * SR))
        j = min(n_total, i + len(sig))
        if i < n_total:
            mix[name][i:j] += sig[: j - i] * gain

    k = kick(int(0.45 * SR))
    for bar in range(bars):
        chord = prog[bar % len(prog)]
        t0 = bar * 4 * beat
        intro = bar < 2
        for b in range(4):
            put("kick", t0 + b * beat, k, 0.95)
            if not intro and b in (1, 3):
                put("clap", t0 + b * beat, clap(int(0.25 * SR), rng), 0.55)
            # Off-beat open-ish hat, plus 16th ticks once the drop is in.
            put("hat", t0 + b * beat + beat / 2, hat(int(0.12 * SR), rng, 0.06), 0.42)
            if not intro:
                for s in (1, 3):
                    put("hat", t0 + b * beat + s * step, hat(int(0.05 * SR), rng, 0.018), 0.22)
        # Off-beat bass on the chord root.
        rname, roct = chord[0]
        for b in range(4):
            n = int(beat / 2 * SR)
            sig = saw(hz(rname, roct - 1), n) * env(n, 0.003, 0.12)
            put("bass", t0 + b * beat + beat / 2, sig, 0.9 if not intro else 0.5)
        # Pad: the bar's chord, held.
        n = int(4 * beat * SR)
        pad = sum(supersaw(hz(nm, o), n) for nm, o in chord) / len(chord)
        pad *= env(n, 0.02, 3.5)
        put("pad", t0, pad, 0.55)
        # Lead arp: 16ths over the chord tones, an octave up, from bar 3.
        if not intro:
            tones = [hz(nm, o + 1) for nm, o in chord]
            for s in range(16):
                deg = arp_pattern[s % len(arp_pattern)]
                if deg < 0:
                    continue
                f = tones[deg % len(tones)] * (2 if deg >= len(tones) else 1)
                ln = int(step * SR * 0.95)
                sig = (supersaw(f, ln, voices=3, detune=0.08) * 0.7 + np.sign(np.sin(2 * np.pi * f * np.arange(ln) / SR)) * 0.3) * env(ln, 0.002, 0.07)
                put("lead", t0 + s * step, sig, 0.32)

    # Sidechain pump: everything melodic ducks under each kick.
    t = np.arange(n_total) / SR
    phase = (t % beat) / beat
    duck = 0.25 + 0.75 * np.clip(phase / 0.45, 0, 1) ** 1.5

    pad = mix["pad"]
    pad = np.concatenate([sweep_lp(pad[: int(2 * 4 * beat * SR)], 350, 5200), biquad(pad[int(2 * 4 * beat * SR) :], "lp", 5200, 0.8)])
    bass = biquad(mix["bass"], "lp", 420, 1.1)
    lead = biquad(mix["lead"], "lp", 6500, 0.8)
    hats = mix["hat"]
    out = mix["kick"] + mix["clap"] + hats + (bass * 0.9 + pad * 0.8 + lead) * duck

    # Simple stereo: lead and hats panned a little, a short delay on the lead for width.
    d = int(beat * 0.75 * SR)
    lead_d = np.concatenate([np.zeros(d), lead[:-d] * duck[:-d]]) * 0.28
    left = out + lead_d * 0.9 + hats * 0.1
    right = out - lead_d * 0.4 + lead_d * 0.6 - hats * 0.1
    st = np.stack([left, right], axis=1)
    st = np.tanh(st * 1.2)  # soft clip glue
    st /= np.max(np.abs(st)) / 0.89
    return st


TRACKS = [
    # name, seed, bpm, chords (4-bar loop), arp pattern (chord degrees, -1 rest)
    ("royal-drive-128", 1, 128, [[("A", 3), ("C", 4), ("E", 4)], [("F", 3), ("A", 3), ("C", 4)], [("C", 3), ("E", 3), ("G", 3)], [("G", 3), ("B", 3), ("D", 4)]], [0, 1, 2, 3, 2, 1, 0, 2, 0, 1, 2, 3, 2, 1, 2, -1]),
    ("iron-pulse-126", 2, 126, [[("D", 3), ("F", 3), ("A", 3)], [("A#", 2), ("D", 3), ("F", 3)], [("F", 3), ("A", 3), ("C", 4)], [("C", 3), ("E", 3), ("G", 3)]], [0, -1, 2, 1, 0, -1, 2, 3, 0, -1, 2, 1, 3, 2, 1, -1]),
    ("gold-rush-124", 3, 124, [[("E", 3), ("G", 3), ("B", 3)], [("C", 3), ("E", 3), ("G", 3)], [("G", 3), ("B", 3), ("D", 4)], [("D", 3), ("F#", 3), ("A", 3)]], [0, 2, 1, 2, 0, 2, 1, 3, 0, 2, 1, 2, 3, 2, 1, 0]),
    ("night-shift-128", 4, 128, [[("F#", 3), ("A", 3), ("C#", 4)], [("D", 3), ("F#", 3), ("A", 3)], [("A", 2), ("C#", 3), ("E", 3)], [("E", 3), ("G#", 3), ("B", 3)]], [0, 1, 2, 1, 3, 1, 2, 1, 0, 1, 2, 1, 3, 2, 3, -1]),
]


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    for name, seed, bpm, prog, arp in TRACKS:
        if only and name not in only:
            continue
        st = track(seed, bpm, prog[0][0][0], prog, arp)
        pcm = (st * 32767).astype("<i2")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            path = tmp.name
        with wave.open(path, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        mp3 = os.path.join(OUT, f"{name}.mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", "loudnorm=I=-14:TP=-1.5:LRA=7", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "160k", "-map_metadata", "-1", "-metadata", f"title={name}", "-metadata", "artist=Royal Fitness Club", "-metadata", "copyright=Original, made in-house for Royal Fitness Club", mp3], check=True)
        os.unlink(path)
        print(f"wrote {mp3} ({len(st) / SR:.1f}s)")


if __name__ == "__main__":
    main()
