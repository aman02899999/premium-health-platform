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
  const body = post.instagram.split("\n\n")[1] ?? "";
  const cta = (post.instagram.split("\n\n")[2] ?? "").replace(/ — link in bio\.$/, "");
  const hookSize = post.title.length > 60 ? 76 : post.title.length > 40 ? 88 : 104;

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          color: "#fff",
          fontFamily: "Inter",
          background:
            "radial-gradient(circle at 85% 12%, rgba(232,57,75,.55), transparent 45%), radial-gradient(circle at 5% 95%, rgba(4,70,109,.9), transparent 55%), linear-gradient(160deg,#06111c,#0a1a2a)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
          <img src={logo} alt="" width={154} height={70} style={{ background: "#fff", borderRadius: 14, padding: 8 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2 }}>ROYAL FITNESS CLUB</div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,.65)" }}>Gejha, Sector 93, Noida</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#ff5b6b", letterSpacing: 3, textTransform: "uppercase", marginBottom: 28 }}>{post.theme}</div>
          <div style={{ display: "flex", fontFamily: "Oswald", fontSize: hookSize, lineHeight: 1.08, textTransform: "uppercase" }}>{post.title}</div>
          <div style={{ display: "flex", fontSize: 36, lineHeight: 1.4, color: "rgba(255,255,255,.82)", marginTop: 40 }}>{body}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", alignSelf: "flex-start", background: "#e8394b", borderRadius: 999, padding: "20px 40px", fontSize: 34, fontWeight: 800 }}>{cta}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "rgba(255,255,255,.7)" }}>
            <div style={{ display: "flex" }}>{SITE_URL.replace(/^https?:\/\//, "")}</div>
            <div style={{ display: "flex" }}>{biz.phone}</div>
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
