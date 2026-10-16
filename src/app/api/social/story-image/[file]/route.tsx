import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { nurtureBusiness } from "@/lib/growth/daily";
import { MEDICAL_NOTE, priceLine, saleCta, saleHook, storyItem } from "@/lib/growth/sales-catalog";
import { loadLogo } from "@/lib/og";
import { coverDataUrl } from "@/lib/social/cover";
import { SITE_URL } from "@/lib/site";

// The day's Instagram Story: one product from the catalogue (diet plan, workout programme, book
// or combo) as a 1080×1920 JPEG. Public on purpose: Instagram downloads it when the cron publishes.
// GET /api/social/story-image/2026-10-16.jpg

export const dynamic = "force-dynamic";

const FONTS = join(process.cwd(), "src/lib/social/fonts");
const font = (f: string) => readFile(join(FONTS, f));
const DAY_MS = 86_400_000;

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const date = (await params).file.replace(/\.jpe?g$/i, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return new Response("Not found", { status: 404 });

  const item = storyItem(date);
  const [biz, logo, cover, oswald, inter, interBold, rupee] = await Promise.all([
    nurtureBusiness(),
    loadLogo(),
    coverDataUrl(item.cover, 560),
    font("oswald-bold.ttf"),
    font("inter-medium.ttf"),
    font("inter-extrabold.ttf"),
    font("rupee.ttf"),
  ]);
  const hook = saleHook(item, Math.floor(Date.parse(date) / DAY_MS));
  const hookSize = hook.length > 60 ? 68 : hook.length > 40 ? 80 : 96;
  const kind = { diet: "PERSONAL DIET PLAN", workout: "WORKOUT PROGRAMME", book: "PREMIUM LIBRARY", combo: "BOOK BUNDLE" }[item.kind];

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "120px 80px 140px",
          color: "#fff",
          fontFamily: "Inter",
          background:
            "radial-gradient(circle at 80% 8%, rgba(232,57,75,.6), transparent 45%), radial-gradient(circle at 10% 90%, rgba(4,70,109,.95), transparent 55%), linear-gradient(170deg,#06111c,#0a1a2a)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
          <img src={logo} alt="" width={140} height={64} style={{ background: "#fff", borderRadius: 14, padding: 8 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2 }}>ROYAL FITNESS CLUB</div>
            <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,.65)" }}>{`By ${biz.coach}`}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", gap: 36 }}>
          <div style={{ display: "flex", alignSelf: "flex-start", fontSize: 26, fontWeight: 800, letterSpacing: 3, color: "#ffcf5a", border: "2px solid rgba(255,207,90,.6)", borderRadius: 999, padding: "10px 24px" }}>{kind}</div>
          <div style={{ display: "flex", fontFamily: "Oswald", fontSize: hookSize, lineHeight: 1.06, textTransform: "uppercase" }}>{hook}</div>
          {cover && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
              <img src={cover} alt="" width={420} height={588} style={{ borderRadius: 22, objectFit: "cover", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }} />
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: cover ? 18 : 28,
              ...(cover ? {} : { background: "rgba(255,255,255,.06)", border: "2px solid rgba(255,207,90,.35)", borderRadius: 32, padding: "48px 44px" }),
            }}
          >
            {!cover && <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 3, color: "#ffcf5a" }}>WHAT YOU GET</div>}
            <div style={{ display: "flex", fontSize: cover ? 42 : 52, fontWeight: 800 }}>{item.title}</div>
            {item.bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 16, fontSize: cover ? 32 : 38, lineHeight: 1.3, color: "rgba(255,255,255,.9)" }}>
                <div style={{ display: "flex", width: 15, height: 30, marginTop: 6, flexShrink: 0, borderRight: "5px solid #ffcf5a", borderBottom: "5px solid #ffcf5a", transform: "rotate(45deg) translate(-4px, -4px)" }} />
                <div style={{ display: "flex", flex: 1 }}>{b}</div>
              </div>
            ))}
            {item.medical && <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,.6)" }}>{MEDICAL_NOTE}</div>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>{priceLine(item)}</div>
          <div style={{ display: "flex", background: "#e8394b", borderRadius: 999, padding: "24px 56px", fontSize: 40, fontWeight: 800 }}>{saleCta(item)} · link in bio</div>
          <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,.7)" }}>
            {`${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}${item.kind === "diet" ? "/diet-chart" : "/library"} · ${biz.phone}`}
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
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
