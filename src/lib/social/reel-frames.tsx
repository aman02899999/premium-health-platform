import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { PostBiz } from "@/lib/growth/daily-posts";
import { loadLogo } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { coverDataUrl } from "./cover";
import type { Scene } from "./reel-scenes";

// One 1080×1920 PNG per Reel scene, drawn with Satori like the post and Story cards. Text stays
// inside Instagram's safe area: clear of the top bar, the caption at the bottom and the buttons
// on the right.

const W = 1080;
const H = 1920;
const FONTS = join(process.cwd(), "src/lib/social/fonts");
const GOLD = "#ffcf5a";
const RED = "#e8394b";

type Assets = { logo: string; fonts: { name: string; data: Buffer; weight: 500 | 700 | 800; style: "normal" }[] };

async function assets(): Promise<Assets> {
  const font = (f: string) => readFile(join(FONTS, f));
  const [logo, oswald, inter, interBold, rupee] = await Promise.all([
    loadLogo(),
    font("oswald-bold.ttf"),
    font("inter-medium.ttf"),
    font("inter-extrabold.ttf"),
    font("rupee.ttf"),
  ]);
  return {
    logo,
    fonts: [
      { name: "Inter", data: inter, weight: 500, style: "normal" },
      { name: "Inter", data: interBold, weight: 800, style: "normal" },
      { name: "Oswald", data: oswald, weight: 700, style: "normal" },
      // Inter and Oswald have no ₹: this one-glyph font fills it in.
      { name: "Rupee", data: rupee, weight: 700, style: "normal" },
    ],
  };
}

const sizeFor = (text: string, steps: [number, number][], min: number) => steps.find(([len]) => text.length <= len)?.[1] ?? min;

function Tick() {
  return <div style={{ display: "flex", width: 18, height: 36, marginTop: 8, marginRight: 10, flexShrink: 0, borderRight: `7px solid ${GOLD}`, borderBottom: `7px solid ${GOLD}`, transform: "rotate(45deg) translate(-4px, -4px)" }} />;
}

function Body({ scene, cover }: { scene: Scene; cover: string | null }) {
  switch (scene.kind) {
    case "hook":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          <div style={{ display: "flex", alignSelf: "flex-start", background: RED, borderRadius: 999, padding: "12px 30px", fontSize: 30, fontWeight: 800, letterSpacing: 3 }}>{scene.kicker}</div>
          <div style={{ display: "flex", fontFamily: "Oswald", fontSize: sizeFor(scene.text, [[28, 170], [45, 142], [65, 120], [85, 104]], 92), lineHeight: 1.05, textTransform: "uppercase" }}>{scene.text}</div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, letterSpacing: 2, color: GOLD }}>SAVE THIS · SEND IT TO A FRIEND</div>
        </div>
      );
    case "point":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 260, lineHeight: 1, color: GOLD }}>{`0${scene.n}`}</div>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 64, color: "rgba(255,255,255,.35)" }}>{`/ 0${scene.of}`}</div>
          </div>
          <div style={{ display: "flex", fontSize: sizeFor(scene.text, [[55, 92], [85, 80], [115, 70]], 64), fontWeight: 800, lineHeight: 1.25 }}>{scene.text}</div>
        </div>
      );
    case "takeaway":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: 4, color: GOLD }}>COACH&apos;S TAKEAWAY</div>
          <div style={{ display: "flex", borderLeft: `12px solid ${GOLD}`, background: "rgba(255,207,90,.12)", borderRadius: 24, padding: "44px 44px" }}>
            <div style={{ display: "flex", fontSize: sizeFor(scene.text, [[60, 90], [100, 76]], 66), fontWeight: 800, lineHeight: 1.25 }}>{scene.text}</div>
          </div>
          {scene.note && <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,.6)" }}>{scene.note}</div>}
        </div>
      );
    case "product":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only
            <img src={cover} alt="" width={540} height={756} style={{ borderRadius: 26, objectFit: "cover", boxShadow: "0 40px 100px rgba(0,0,0,.65)" }} />
          ) : (
            <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: 4, color: GOLD }}>ROYAL FITNESS CLUB</div>
          )}
          <div style={{ display: "flex", textAlign: "center", fontSize: sizeFor(scene.title, [[30, 76], [50, 64]], 56), fontWeight: 800, lineHeight: 1.15 }}>{scene.title}</div>
        </div>
      );
    case "bullets":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: 4, color: GOLD }}>WHAT YOU GET</div>
          {scene.items.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 18, fontSize: sizeFor(b, [[45, 62], [80, 56]], 50), fontWeight: 800, lineHeight: 1.25 }}>
              <Tick />
              <div style={{ display: "flex", flex: 1 }}>{b}</div>
            </div>
          ))}
        </div>
      );
    case "price": {
      const [now, was] = scene.text.replace(/\)$/, "").split(" (instead of ");
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, letterSpacing: 4, color: GOLD }}>PRICE</div>
          <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 220, lineHeight: 1 }}>{now}</div>
          {was && <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: "rgba(255,255,255,.55)", textDecoration: "line-through" }}>{was}</div>}
          {scene.note && <div style={{ display: "flex", marginTop: 20, fontSize: 28, color: "rgba(255,255,255,.6)" }}>{scene.note}</div>}
        </div>
      );
    }
    case "body":
      return <div style={{ display: "flex", fontSize: sizeFor(scene.text, [[120, 78], [180, 68]], 60), fontWeight: 800, lineHeight: 1.3 }}>{scene.text}</div>;
    case "cta":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
          <div style={{ display: "flex", textAlign: "center", fontFamily: "Oswald", fontSize: sizeFor(scene.text, [[24, 140], [40, 116], [60, 96]], 84), lineHeight: 1.08, textTransform: "uppercase" }}>{scene.text}</div>
          <div style={{ display: "flex", background: RED, borderRadius: 999, padding: "34px 80px", fontSize: 62, fontWeight: 800 }}>LINK IN BIO</div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: GOLD }}>Follow for a new tip every day</div>
        </div>
      );
  }
}

function Frame({ scene, index, biz, logo, cover, photo }: { scene: Scene; index: number; biz: PostBiz; logo: string; cover: string | null; photo: string | null }) {
  // The coach's photo fills the opening and closing screens, darkened so the words stay readable.
  const withPhoto = photo && (scene.kind === "hook" || scene.kind === "cta");
  // The glow moves a little from scene to scene so cuts feel alive without distracting.
  const glow = [
    [82, 10],
    [18, 14],
    [76, 22],
    [24, 8],
    [70, 16],
  ][index % 5];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        padding: "150px 90px 0",
        color: "#fff",
        fontFamily: "Inter",
        background: `radial-gradient(circle at ${glow[0]}% ${glow[1]}%, rgba(232,57,75,.55), transparent 42%), radial-gradient(circle at ${100 - glow[0]}% 88%, rgba(4,70,109,.95), transparent 55%), linear-gradient(170deg,#06111c,#0a1a2a)`,
      }}
    >
      {withPhoto && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only
        <img src={photo} alt="" width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} />
      )}
      {withPhoto && <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: "linear-gradient(180deg, rgba(5,8,13,.55) 0%, rgba(5,8,13,.72) 45%, rgba(5,8,13,.92) 100%)" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
        <img src={logo} alt="" width={132} height={60} style={{ background: "#fff", borderRadius: 14, padding: 8 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 2 }}>ROYAL FITNESS CLUB</div>
          <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,.65)" }}>{`By ${biz.coach}`}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: 1150 }}>
        <Body scene={scene} cover={cover} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "2px solid rgba(255,255,255,.15)", paddingTop: 22, fontSize: 26, color: "rgba(255,255,255,.7)" }}>
        <div style={{ display: "flex" }}>{`${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")} · ${biz.phone}`}</div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,.5)" }}>{biz.address || "Gejha Village, Sector 93, Noida"}</div>
      </div>
    </div>
  );
}

/** The scenes as PNG frames, in order. */
export async function reelFrames(scenes: Scene[], biz: PostBiz, photo: string | null = null): Promise<Buffer[]> {
  const { logo, fonts } = await assets();
  const productCover = scenes.find((s) => s.kind === "product")?.cover ?? null;
  const cover = productCover ? await coverDataUrl(productCover, 540) : null;
  return Promise.all(
    scenes.map(async (scene, index) => {
      const res = new ImageResponse(<Frame scene={scene} index={index} biz={biz} logo={logo} cover={cover} photo={photo} />, { width: W, height: H, fonts });
      return Buffer.from(await res.arrayBuffer());
    }),
  );
}
