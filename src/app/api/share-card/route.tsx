import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content/store";
import { loadLogo } from "@/lib/og";
import { cardFor, parseCardQuery } from "@/lib/share-card";
import { SITE_URL } from "@/lib/site";

// A calculator result as a 1080×1920 PNG (Instagram/WhatsApp Story size), for people to share.
// GET /api/share-card?k=one-rep-max&w=60&r=6. The result is recomputed from the inputs, so the
// image only ever shows numbers our own formulas produce. Inputs outside the slider ranges 404.

const FONTS = join(process.cwd(), "src/lib/social/fonts");
const font = (f: string) => readFile(join(FONTS, f));

export async function GET(req: Request) {
  const input = parseCardQuery(new URL(req.url).searchParams);
  if (!input) return new Response("Not found", { status: 404 });
  const card = cardFor(input);

  const [c, logo, oswald, inter, interBold] = await Promise.all([getContent(), loadLogo(), font("oswald-bold.ttf"), font("inter-medium.ttf"), font("inter-extrabold.ttf")]);
  const b = c.business;
  const valueSize = card.value.length > 7 ? 200 : card.value.length > 5 ? 240 : 300;

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "150px 90px 170px",
          color: "#fff",
          fontFamily: "Inter",
          background:
            "radial-gradient(circle at 85% 12%, rgba(232,57,75,.55), transparent 45%), radial-gradient(circle at 8% 92%, rgba(4,70,109,.9), transparent 55%), linear-gradient(160deg,#06111c,#0a1a2a)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
          <img src={logo} alt="" width={176} height={80} style={{ background: "#fff", borderRadius: 16, padding: 8 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: 44, letterSpacing: 1 }}>{b.name.toUpperCase()}</div>
            <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,.65)" }}>{b.address?.locality || "Sector 93, Noida"}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 50, fontWeight: 800, color: "#ffcf5a", letterSpacing: 1 }}>{card.headline}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <div style={{ display: "flex", fontFamily: "Oswald", fontSize: valueSize, lineHeight: 1 }}>{card.value}</div>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "rgba(255,255,255,.8)" }}>{card.unit}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
            {card.lines.map((l) => (
              <div key={l} style={{ display: "flex", fontSize: 40, color: "rgba(255,255,255,.85)" }}>
                {l}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, borderTop: "2px solid rgba(255,255,255,.18)", paddingTop: 40 }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>Work out yours free</div>
          <div style={{ display: "flex", fontSize: 36, color: "#7cc0ee" }}>{`${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}/tools`}</div>
          <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,.5)" }}>An estimate from standard formulas, not medical advice.</div>
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
      ],
    },
  );
  return new Response(png.body, {
    headers: { "content-type": "image/png", "cache-control": "public, max-age=86400, s-maxage=604800", "x-robots-tag": "noindex" },
  });
}
