import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { nurtureBusiness } from "@/lib/growth/daily";
import { dailyPost } from "@/lib/growth/daily-posts";
import { loadLogo } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

// The day's marketing post as a 1080×1350 JPEG (Instagram's 4:5 feed size; its API takes JPEG
// only). Public on purpose: Instagram downloads it from this URL when the daily cron publishes.
// GET /api/social/post-image/2026-10-12.jpg

export const dynamic = "force-dynamic";

const FONTS = join(process.cwd(), "src/lib/social/fonts");
const font = (f: string) => readFile(join(FONTS, f));

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const date = (await params).file.replace(/\.jpe?g$/i, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return new Response("Not found", { status: 404 });

  const [biz, logo, oswald, inter, interBold, rupee] = await Promise.all([
    nurtureBusiness(),
    loadLogo(),
    font("oswald-bold.ttf"),
    font("inter-medium.ttf"),
    font("inter-extrabold.ttf"),
    font("rupee.ttf"),
  ]);
  const post = dailyPost(date, biz);
  const isTip = post.category !== "Offer";
  const cta = (post.instagram.split("\n\n").find((p) => p.endsWith(" — link in bio.")) ?? "").replace(/ — link in bio\.$/, "");
  const len = post.title.length;
  const hookSize = len > 70 ? 64 : len > 55 ? 72 : len > 40 ? 84 : 100;
  const pointChars = post.points.join("").length;
  const pointSize = pointChars > 260 ? 29 : pointChars > 200 ? 31 : 34;

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          color: "#fff",
          fontFamily: "Inter",
          background:
            "radial-gradient(circle at 85% 10%, rgba(232,57,75,.55), transparent 45%), radial-gradient(circle at 5% 95%, rgba(4,70,109,.9), transparent 55%), linear-gradient(160deg,#06111c,#0a1a2a)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
          <img src={logo} alt="" width={140} height={64} style={{ background: "#fff", borderRadius: 14, padding: 8 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2 }}>ROYAL FITNESS CLUB</div>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,.65)" }}>Gejha, Sector 93, Noida</div>
          </div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 22, fontWeight: 800, color: "#ffcf5a", border: "2px solid rgba(255,207,90,.6)", borderRadius: 999, padding: "8px 20px" }}>
            {isTip ? "SAVE THIS POST" : "FROM COACH AMAN"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: "#ff5b6b", letterSpacing: 3, textTransform: "uppercase", marginBottom: 22 }}>
            {isTip ? `${post.category} · ${post.theme}` : post.theme}
          </div>
          <div style={{ display: "flex", fontFamily: "Oswald", fontSize: hookSize, lineHeight: 1.06, textTransform: "uppercase" }}>{post.title}</div>
          {isTip ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 40 }}>
              {post.points.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                  <div style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 999, background: "#e8394b", fontSize: 26, fontWeight: 800 }}>{i + 1}</div>
                  <div style={{ display: "flex", fontSize: pointSize, lineHeight: 1.35, color: "rgba(255,255,255,.9)" }}>{p}</div>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", marginTop: 8, borderLeft: "8px solid #ffcf5a", background: "rgba(255,207,90,.12)", borderRadius: 14, padding: "18px 26px" }}>
                <div style={{ display: "flex", fontSize: 20, fontWeight: 800, letterSpacing: 2, color: "#ffcf5a" }}>COACH&apos;S TAKEAWAY</div>
                <div style={{ display: "flex", fontSize: 32, fontWeight: 800, marginTop: 6 }}>{post.takeaway}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 34, marginTop: 40 }}>
              <div style={{ display: "flex", fontSize: 36, lineHeight: 1.4, color: "rgba(255,255,255,.85)" }}>{post.points[0]}</div>
              <div style={{ display: "flex", alignSelf: "flex-start", background: "#e8394b", borderRadius: 999, padding: "18px 36px", fontSize: 32, fontWeight: 800 }}>{cta}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "2px solid rgba(255,255,255,.15)", paddingTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>By {biz.coach}</div>
            <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,.75)" }}>{biz.phone}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "rgba(255,255,255,.6)" }}>
            <div style={{ display: "flex" }}>{biz.address || "Gejha Village, Sector 93, Noida"}</div>
            <div style={{ display: "flex" }}>{SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: "Inter", data: inter, weight: 500, style: "normal" },
        { name: "Inter", data: interBold, weight: 800, style: "normal" },
        { name: "Oswald", data: oswald, weight: 700, style: "normal" },
        // Inter and Oswald have no ₹: this one-glyph font fills it in.
        { name: "Rupee", data: rupee, weight: 700, style: "normal" },
      ],
    },
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=3600, s-maxage=86400" },
  });
}
