import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { PostBiz } from "@/lib/growth/daily-posts";
import { loadLogo } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import type { Scene, Timed, Tone } from "./shorts-core";

// The Short's frames: one 1080×1920 PNG per caption step, drawn with Satori. Every word of a
// scene is laid out from the first step (the words still to come are transparent), so the
// caption pops in word by word without the lines jumping. The newest words light up gold.
// Text stays inside YouTube's Shorts safe area: clear of the top bar, the title and channel name
// at the bottom and the like/comment buttons down the right side.

const W = 1080;
const H = 1920;
const FONTS = join(process.cwd(), "src/lib/social/fonts");
const GOLD = "#ffcf5a";
const RED = "#ff4d5e";
const GREEN = "#38d39f";
const TONE: Record<Tone, string> = { red: RED, green: GREEN, gold: GOLD, plain: "#ffffff" };

type Font = { name: string; data: Buffer; weight: 500 | 700 | 800; style: "normal" };

async function assets(): Promise<{ logo: string; fonts: Font[] }> {
  const font = (f: string) => readFile(join(FONTS, f));
  const [logo, oswald, inter, interBold, rupee] = await Promise.all([loadLogo(), font("oswald-bold.ttf"), font("inter-medium.ttf"), font("inter-extrabold.ttf"), font("rupee.ttf")]);
  return {
    logo,
    fonts: [
      { name: "Inter", data: inter, weight: 500, style: "normal" },
      { name: "Inter", data: interBold, weight: 800, style: "normal" },
      { name: "Oswald", data: oswald, weight: 700, style: "normal" },
      { name: "Rupee", data: rupee, weight: 700, style: "normal" },
    ],
  };
}

const sizeFor = (text: string, steps: [number, number][], min: number) => steps.find(([len]) => text.length <= len)?.[1] ?? min;

/** The caption with the first `shown` pieces visible; the newest piece in gold. */
function Reveal({ parts, shown, size, font = "Inter", upper = false, color = "#fff" }: { parts: string[]; shown: number; size: number; font?: string; upper?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontFamily: font, fontSize: size, fontWeight: 800, lineHeight: font === "Oswald" ? 1.08 : 1.22, textTransform: upper ? "uppercase" : "none" }}>
      {parts.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            marginRight: size * 0.28,
            opacity: i < shown ? 1 : 0,
            color: i === shown - 1 && shown < parts.length ? GOLD : color,
            textShadow: "0 6px 24px rgba(0,0,0,.55)",
          }}
        >
          {p}
        </div>
      ))}
    </div>
  );
}

function Label({ text, color }: { text: string; color: string }) {
  return <div style={{ display: "flex", alignSelf: "flex-start", background: color, color: "#0a0f17", borderRadius: 999, padding: "12px 30px", fontSize: 32, fontWeight: 800, letterSpacing: 3 }}>{text}</div>;
}

function Body({ scene, parts, shown }: { scene: Scene; parts: string[]; shown: number }) {
  switch (scene.kind) {
    case "hook":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <Label text={scene.kicker} color={GOLD} />
          <Reveal parts={parts} shown={shown} size={sizeFor(scene.text, [[26, 164], [40, 140], [55, 122]], 106)} font="Oswald" upper />
          <div style={{ display: "flex", width: 220, height: 14, borderRadius: 8, background: RED }} />
        </div>
      );
    case "card":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <Label text={scene.label} color={TONE[scene.tone]} />
          <div style={{ display: "flex", borderLeft: `14px solid ${TONE[scene.tone]}`, paddingLeft: 40 }}>
            <Reveal parts={parts} shown={shown} size={sizeFor(scene.text, [[40, 112], [70, 98], [100, 86]], 76)} />
          </div>
          {scene.sub && <div style={{ display: "flex", fontSize: 32, fontWeight: 500, color: "rgba(255,255,255,.7)" }}>{scene.sub}</div>}
        </div>
      );
    case "swap":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          <Label text="INSTEAD OF" color={RED} />
          <div style={{ display: "flex", fontSize: sizeFor(scene.from, [[30, 76], [50, 64]], 56), fontWeight: 800, color: "rgba(255,255,255,.6)", textDecoration: "line-through" }}>{scene.from}</div>
          <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 120, color: GOLD, lineHeight: 1 }}>↓</div>
          <Label text="TRY THIS" color={GREEN} />
          <Reveal parts={parts} shown={shown} size={sizeFor(scene.to, [[30, 104], [55, 88], [90, 72]], 64)} />
        </div>
      );
    case "number":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 300, lineHeight: 1, color: RED }}>{`#${scene.n}`}</div>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 64, color: "rgba(255,255,255,.35)" }}>{`of ${scene.of}`}</div>
          </div>
          <Reveal parts={parts} shown={shown} size={sizeFor(scene.text, [[40, 104], [70, 92], [100, 80]], 72)} />
        </div>
      );
    case "move":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <Label text={`MOVE ${scene.n} OF ${scene.of}`} color={GOLD} />
          <Reveal parts={parts} shown={shown} size={sizeFor(scene.name, [[20, 118], [35, 96], [50, 80]], 70)} font="Oswald" upper />
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 260, lineHeight: 1, color: GREEN }}>{String(scene.seconds)}</div>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 80, color: "rgba(255,255,255,.7)" }}>SEC</div>
          </div>
        </div>
      );
    case "plan":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <Label text={scene.title} color={GOLD} />
          {scene.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, opacity: i < shown ? 1 : 0 }}>
              <div style={{ display: "flex", width: 74, height: 74, borderRadius: 999, background: i === shown - 1 ? GOLD : "rgba(255,255,255,.14)", color: i === shown - 1 ? "#0a0f17" : "#fff", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 800 }}>{String(i + 1)}</div>
              <div style={{ display: "flex", flex: 1, fontSize: sizeFor(item, [[24, 58], [36, 50]], 44), fontWeight: 800 }}>{item}</div>
            </div>
          ))}
          <div style={{ display: "flex", marginTop: 16, fontSize: 36, fontWeight: 800, color: GREEN }}>{scene.foot}</div>
        </div>
      );
    case "big":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          <Label text={scene.label} color={GOLD} />
          <Reveal parts={parts} shown={shown} size={sizeFor(scene.text, [[22, 150], [35, 124], [50, 104]], 90)} font="Oswald" upper color={GREEN} />
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, letterSpacing: 4, color: "rgba(255,255,255,.6)" }}>{scene.sub}</div>
        </div>
      );
    case "end":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <Reveal parts={parts} shown={shown} size={112} font="Oswald" upper />
          <div style={{ display: "flex", alignSelf: "flex-start", background: RED, borderRadius: 999, padding: "26px 56px", fontSize: 50, fontWeight: 800 }}>FREE TRIAL · LINK BELOW</div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, color: GOLD }}>Royal Fitness Club · Sector 93 Noida</div>
          {scene.note && <div style={{ display: "flex", fontSize: 28, fontWeight: 500, color: "rgba(255,255,255,.65)" }}>{scene.note}</div>}
        </div>
      );
  }
}

const WATERMARK: Record<string, string> = { red: "DON'T", green: "DO IT", gold: "COACH", plain: "ROYAL", swap: "SWAP", number: "AVOID", move: "MOVE", plan: "PLAN", big: "FACT" };
const ACCENT: Record<Scene["kind"], string> = { hook: RED, card: GOLD, swap: GREEN, number: RED, move: GREEN, plan: GOLD, big: GREEN, end: RED };

function Frame({ timed, index, shown, biz, logo, photo }: { timed: Timed; index: number; shown: number; biz: PostBiz; logo: string; photo: string | null }) {
  const scene = timed.scene;
  const withPhoto = photo && (scene.kind === "hook" || scene.kind === "end");
  const accent = scene.kind === "card" ? TONE[scene.tone] : ACCENT[scene.kind];
  const glow = [[85, 12], [15, 18], [80, 30], [20, 10]][index % 4];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        padding: "170px 150px 0 80px",
        color: "#fff",
        fontFamily: "Inter",
        background: `radial-gradient(circle at ${glow[0]}% ${glow[1]}%, ${accent}66, transparent 45%), radial-gradient(circle at ${100 - glow[0]}% 85%, rgba(4,70,109,.9), transparent 55%), linear-gradient(165deg,#05080d,#0b1726)`,
      }}
    >
      {withPhoto && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only
        <img src={photo} alt="" width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} />
      )}
      {withPhoto && <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: "linear-gradient(180deg, rgba(5,8,13,.25) 0%, rgba(5,8,13,.55) 35%, rgba(5,8,13,.88) 75%, rgba(5,8,13,.96) 100%)" }} />}
      {!withPhoto && (
        <div style={{ position: "absolute", left: -20, bottom: 230, display: "flex", fontFamily: "Oswald", fontSize: 330, lineHeight: 1, color: accent, opacity: 0.08, letterSpacing: -4 }}>{WATERMARK[scene.kind === "card" ? scene.tone : scene.kind] ?? "ROYAL"}</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
        <img src={logo} alt="" width={120} height={54} style={{ background: "#fff", borderRadius: 12, padding: 6 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, letterSpacing: 2 }}>ROYAL FITNESS CLUB</div>
          <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,.65)" }}>{`${biz.coach} · ${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}`}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: 1240 }}>
        <Body scene={scene} parts={timed.chunks} shown={shown} />
      </div>
    </div>
  );
}

/** Every frame of the Short in play order, and how long each one shows. */
export async function shortFrames(timed: Timed[], biz: PostBiz, photo: string | null): Promise<{ scene: number; png: Buffer; seconds: number }[]> {
  const { logo, fonts } = await assets();
  const jobs = timed.flatMap((t, scene) => t.steps.map((seconds, step) => ({ t, scene, shown: step + 1, seconds })));
  return Promise.all(
    jobs.map(async ({ t, scene, shown, seconds }) => {
      const res = new ImageResponse(<Frame timed={t} index={scene} shown={shown} biz={biz} logo={logo} photo={photo} />, { width: W, height: H, fonts });
      return { scene, png: Buffer.from(await res.arrayBuffer()), seconds };
    }),
  );
}
