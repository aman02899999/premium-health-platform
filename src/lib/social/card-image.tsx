import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { PostBiz } from "@/lib/growth/daily-posts";
import type { CardPost } from "@/lib/growth/month-plan";
import { loadLogo } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { galleryDataUrl } from "./cover";

// A month-plan card as a 1080×1350 JPEG (Instagram's 4:5 feed size; its API takes JPEG only):
// the coach's photo top right, a two-line title, the cheat-sheet table, the source and the call
// to action. Dark and gold like the rest of the gym's posts.

const W = 1080;
const H = 1350;
const FONTS = join(process.cwd(), "src/lib/social/fonts");
const GOLD = "#ffcf5a";
const RED = "#e8394b";
const BG = "#05080d";
const PHOTO_W = 600;
const PHOTO_H = 640;

/** The bundled fonts are Latin subsets: swap the few symbols they lack for ones they have. */
export const glyphs = (s: string) => s.replace(/≈\s?/g, "~").replace(/−/g, "–").replace(/\s?→\s?/g, " to ");

const titleSize = (lines: string[]) => {
  const n = Math.max(...lines.map((l) => l.length));
  return n <= 9 ? 118 : n <= 11 ? 100 : n <= 13 ? 88 : n <= 15 ? 78 : n <= 18 ? 66 : 58;
};

function Table({ post }: { post: CardPost }) {
  const { card } = post;
  const rows = card.sections[0].rows;
  const long = rows.some(([a, b]) => a.length + b.length > 44);
  const size = rows.length > 6 || long ? 27 : rows.length > 4 ? 30 : 33;
  return (
    <div style={{ display: "flex", flexDirection: "column", background: "rgba(12,17,26,.92)", border: "2px solid rgba(255,207,90,.38)", borderRadius: 24, padding: "14px 30px 10px" }}>
      {card.columns && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, fontWeight: 800, letterSpacing: 3, color: GOLD, padding: "8px 0 10px", borderBottom: "2px solid rgba(255,207,90,.25)" }}>
          <div style={{ display: "flex" }}>{glyphs(card.columns[0])}</div>
          <div style={{ display: "flex" }}>{glyphs(card.columns[1])}</div>
        </div>
      )}
      {rows.map(([a, b], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: `${rows.length > 6 ? 11 : rows.length > 5 ? 14 : rows.length > 4 ? 18 : 22}px 0`, borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
          <div style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 9, background: RED, fontSize: 22, fontWeight: 800 }}>{i + 1}</div>
          <div style={{ display: "flex", flex: 1, fontSize: size, fontWeight: 800, lineHeight: 1.2 }}>{glyphs(a)}</div>
          <div style={{ display: "flex", maxWidth: 400, justifyContent: "flex-end", textAlign: "right", fontSize: size, fontWeight: 800, color: GOLD, lineHeight: 1.2 }}>{glyphs(b)}</div>
        </div>
      ))}
    </div>
  );
}

function Grid({ post }: { post: CardPost }) {
  const { sections } = post.card;
  const most = Math.max(...sections.map((s) => s.rows.length));
  const size = most <= 2 ? 27 : most <= 3 ? 25 : 23;
  const pad = most <= 2 ? 16 : most <= 3 ? 12 : 9;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18 }}>
      {sections.map((s, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", width: 465, background: "rgba(12,17,26,.92)", border: "2px solid rgba(255,207,90,.32)", borderRadius: 22, padding: `0 0 ${pad + 4}px`, overflow: "hidden" }}>
          <div style={{ display: "flex", background: `linear-gradient(90deg, ${RED}, rgba(232,57,75,.35))`, padding: "10px 22px", fontFamily: "Oswald", fontSize: 30, letterSpacing: 1 }}>{glyphs(s.head ?? "")}</div>
          {s.rows.map(([a, b], j) => (
            <div key={j} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: `${pad}px 22px 0`, fontSize: size, fontWeight: 800, lineHeight: 1.2 }}>
              <div style={{ display: "flex", flex: 1 }}>{glyphs(a)}</div>
              <div style={{ display: "flex", color: GOLD, textAlign: "right" }}>{glyphs(b)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CardView({ post, biz, logo, photo }: { post: CardPost; biz: PostBiz; logo: string; photo: string | null }) {
  const { card, cta } = post;
  const size = titleSize(card.title);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: BG, color: "#fff", fontFamily: "Inter" }}>
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only
        <img src={photo} alt="" width={PHOTO_W} height={PHOTO_H} style={{ position: "absolute", top: 0, right: 0, width: PHOTO_W, height: PHOTO_H, objectFit: "cover" }} />
      )}
      {/* Fades the photo into the background on the left and bottom, with a red glow. */}
      <div style={{ position: "absolute", top: 0, right: 0, width: PHOTO_W, height: PHOTO_H, display: "flex", background: `linear-gradient(90deg, ${BG} 0%, rgba(5,8,13,.55) 30%, rgba(5,8,13,0) 60%)` }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: PHOTO_W, height: PHOTO_H, display: "flex", background: `linear-gradient(180deg, rgba(5,8,13,0) 55%, ${BG} 100%)` }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", background: "radial-gradient(circle at 10% 0%, rgba(232,57,75,.28), transparent 40%), radial-gradient(circle at 100% 100%, rgba(255,207,90,.10), transparent 45%)" }} />

      <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, display: "flex", flexDirection: "column", padding: "48px 54px 44px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
          <img src={logo} alt="" width={110} height={50} style={{ background: "#fff", borderRadius: 12, padding: 6 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 3 }}>ROYAL FITNESS CLUB</div>
            <div style={{ display: "flex", fontSize: 19, color: "rgba(255,255,255,.65)" }}>{`By ${biz.coach} · Sector 93, Noida`}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: 660, marginTop: 34 }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 800, letterSpacing: 6, color: GOLD }}>{card.series}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 10, fontFamily: "Oswald", fontSize: size, lineHeight: 1.02 }}>
            <div style={{ display: "flex", color: "#f4f6fa" }}>{glyphs(card.title[0])}</div>
            <div style={{ display: "flex", color: GOLD }}>{glyphs(card.title[1])}</div>
          </div>
          <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 16, borderLeft: `6px solid ${RED}`, background: "rgba(255,255,255,.07)", padding: "8px 16px", fontSize: 23, fontWeight: 800, color: "rgba(255,255,255,.9)" }}>
            {glyphs(card.subtitle)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", marginTop: 22 }}>
          {card.sections.length === 1 ? <Table post={post} /> : <Grid post={post} />}
        </div>

        <div style={{ display: "flex", justifyContent: "center", textAlign: "center", marginTop: 14, fontSize: 25, fontWeight: 800, color: "#fff" }}>{glyphs(card.footer)}</div>
        <div style={{ display: "flex", justifyContent: "center", textAlign: "center", marginTop: 6, fontSize: 16, color: "rgba(255,255,255,.55)" }}>
          {glyphs([card.source ? `Source: ${card.source}` : "", card.medical ? "General information, not medical advice." : ""].filter(Boolean).join(" · ") || post.card.goal === "diet" ? "A general guide. Portions depend on your body and goal." : "A starting point: adjust to your level, or ask a coach.")}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16, borderRadius: 22, background: `linear-gradient(90deg, ${RED}, #b3192b)`, padding: "16px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: cta.headline.length > 40 ? 30 : 34, lineHeight: 1.1, textTransform: "uppercase" }}>{glyphs(cta.headline)}</div>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 800, marginTop: 4, color: "rgba(255,255,255,.9)" }}>{glyphs(cta.sub)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", color: BG, borderRadius: 14, padding: "10px 18px" }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 800 }}>LINK IN BIO</div>
            <div style={{ display: "flex", fontSize: 16, fontWeight: 800, color: RED }}>{SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The card as a JPEG, ready for Instagram and Facebook. */
export async function renderCard(post: CardPost, biz: PostBiz): Promise<Buffer> {
  const font = (f: string) => readFile(join(FONTS, f));
  const [logo, photo, oswald, inter, interBold, rupee] = await Promise.all([
    loadLogo(),
    galleryDataUrl(post.photo, PHOTO_W, PHOTO_H),
    font("oswald-bold.ttf"),
    font("inter-medium.ttf"),
    font("inter-extrabold.ttf"),
    font("rupee.ttf"),
  ]);
  const png = new ImageResponse(<CardView post={post} biz={biz} logo={logo} photo={photo} />, {
    width: W,
    height: H,
    fonts: [
      { name: "Inter", data: inter, weight: 500, style: "normal" },
      { name: "Inter", data: interBold, weight: 800, style: "normal" },
      { name: "Oswald", data: oswald, weight: 700, style: "normal" },
      // Inter and Oswald have no ₹: this one-glyph font fills it in.
      { name: "Rupee", data: rupee, weight: 700, style: "normal" },
    ],
  });
  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}
