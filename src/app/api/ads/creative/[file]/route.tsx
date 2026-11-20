import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { adCreatives, CREATIVE_SIZES, parseCreativeFile, type Creative, type CreativeSize } from "@/lib/ads/creatives";
import { getContent } from "@/lib/content/store";
import { todayIST } from "@/lib/growth/dates";
import { loadLogo } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

// An ad image, drawn on request from the live plans, offers and business details, so it always
// matches what the join page charges. Admin → Ads lists them with download buttons.
// GET /api/ads/creative/offer-prices-feed.jpg  (sizes: feed 4:5, story 9:16, square 1:1)
// Public on purpose: it shows only public prices, and Ads Manager can fetch it by URL.
// An offer creative 404s once its offer has ended, so a stale price can't be downloaded.

export const dynamic = "force-dynamic";

const FONTS = join(process.cwd(), "src/lib/social/fonts");
const font = (f: string) => readFile(join(FONTS, f));
const GOLD = "#ffcf5a";
const RED = "#e8394b";

function Art({ c, size, logo, phone }: { c: Creative; size: CreativeSize; logo: string; phone: string }) {
  const tall = size === "story";
  const square = size === "square";
  const pad = tall ? "150px 72px 220px" : square ? "52px 64px" : "64px 72px";
  const hl = c.headline.length;
  const headSize = (square ? 0.82 : 1) * (hl > 30 ? 78 : hl > 22 ? 92 : 108);
  const rows = square ? c.rows.slice(0, 3) : c.rows;
  const priced = rows.some((r) => r.price);
  const rowSize = square ? 30 : 34;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: pad,
        color: "#fff",
        fontFamily: "Inter",
        background:
          "radial-gradient(circle at 85% 10%, rgba(232,57,75,.55), transparent 45%), radial-gradient(circle at 5% 95%, rgba(4,70,109,.9), transparent 55%), linear-gradient(160deg,#06111c,#0a1a2a)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <div style={{ display: "flex", width: 140, height: 64, borderRadius: 14, backgroundColor: "#fff", backgroundImage: `url(${logo})`, backgroundSize: "124px 48px", backgroundPosition: "8px 8px", backgroundRepeat: "no-repeat" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2 }}>ROYAL FITNESS CLUB</div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,.65)" }}>Gejha, Sector 93, Noida</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
        <div style={{ display: "flex", alignSelf: "flex-start", fontSize: 26, fontWeight: 800, color: GOLD, border: `2px solid rgba(255,207,90,.6)`, borderRadius: 999, padding: "8px 22px", marginBottom: 26, textTransform: "uppercase", letterSpacing: 2 }}>
          {c.kicker}
        </div>
        <div style={{ display: "flex", fontFamily: "Oswald", fontSize: headSize, lineHeight: 1.04, textTransform: "uppercase" }}>{c.headline}</div>
        <div style={{ display: "flex", fontSize: square ? 30 : 36, lineHeight: 1.3, color: "rgba(255,255,255,.85)", marginTop: 18 }}>{c.sub}</div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: square ? 26 : 40, background: "rgba(12,17,26,.85)", border: "2px solid rgba(255,207,90,.35)", borderRadius: 24, padding: "10px 30px" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: `${square ? 12 : 18}px 0`, borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,.1)" : "none" }}>
              {!priced && <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: RED, flexShrink: 0 }} />}
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", fontSize: rowSize, fontWeight: 800, lineHeight: 1.2 }}>{r.label.replace(/★/g, "/5")}</div>
                {r.note && <div style={{ display: "flex", fontSize: rowSize - 10, color: "rgba(255,255,255,.65)", marginTop: 4 }}>{r.note}</div>}
              </div>
              {r.was && <div style={{ display: "flex", fontSize: rowSize - 6, color: "rgba(255,255,255,.5)", textDecoration: "line-through" }}>{r.was}</div>}
              {r.price && <div style={{ display: "flex", fontSize: rowSize + 4, fontWeight: 800, color: GOLD }}>{r.price}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignSelf: "flex-start", marginTop: square ? 26 : 40, background: RED, borderRadius: 999, padding: "18px 36px", fontSize: square ? 30 : 34, fontWeight: 800 }}>{c.cta}</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid rgba(255,255,255,.15)", paddingTop: 22, fontSize: 24, color: "rgba(255,255,255,.75)" }}>
        <div style={{ display: "flex" }}>{phone}</div>
        <div style={{ display: "flex" }}>{SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}</div>
      </div>
    </div>
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const parsed = parseCreativeFile((await params).file);
  if (!parsed) return new Response("Not found", { status: 404 });
  const content = await getContent();
  const creative = adCreatives(content, todayIST()).find((c) => c.id === parsed.id);
  if (!creative) return new Response("Not found", { status: 404 });

  const [logo, oswald, inter, interBold, rupee] = await Promise.all([loadLogo(), font("oswald-bold.ttf"), font("inter-medium.ttf"), font("inter-extrabold.ttf"), font("rupee.ttf")]);
  const { w, h } = CREATIVE_SIZES[parsed.size];
  const png = new ImageResponse(<Art c={creative} size={parsed.size} logo={logo} phone={`Call / WhatsApp ${content.business.phone}`} />, {
    width: w,
    height: h,
    fonts: [
      { name: "Inter", data: inter, weight: 500, style: "normal" },
      { name: "Inter", data: interBold, weight: 800, style: "normal" },
      { name: "Oswald", data: oswald, weight: 700, style: "normal" },
      // Inter and Oswald have no ₹ or ★: this font fills in the ₹.
      { name: "Rupee", data: rupee, weight: 700, style: "normal" },
    ],
  });
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=600, s-maxage=3600" },
  });
}
