import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { isDbConfigured } from "@/health/db";
import { loadLogo } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { levelName, monthLabel, scorePct } from "@/lib/challenge/levels";
import { certificate } from "@/lib/challenge/store";

// The Certificate of Achievement as a PNG (A4 landscape ratio) people can download and share.
// The QR opens the public verify page, so an edited image can be checked against our record.
// Wording: "Certificate of Achievement", never "certified" (no accreditation).
const FONTS = join(process.cwd(), "src/lib/social/fonts");
const font = (f: string) => readFile(join(FONTS, f));

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!isDbConfigured) return new Response("Not found", { status: 404 });
  const cert = await certificate(code);
  if (!cert) return new Response("Not found", { status: 404 });
  const verifyUrl = `${SITE_URL}/challenge/certificate/${cert.code}`;
  const [logo, qr, oswald, inter, interBold] = await Promise.all([loadLogo(), QRCode.toDataURL(verifyUrl, { margin: 1, width: 300 }), font("oswald-bold.ttf"), font("inter-medium.ttf"), font("inter-extrabold.ttf")]);
  const issued = new Date(cert.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 40, background: "#06111c", fontFamily: "Inter", color: "#fff" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "60px 80px", border: "6px solid #c9a24a", borderRadius: 24, background: "radial-gradient(circle at 85% 10%, rgba(232,57,75,.35), transparent 45%), radial-gradient(circle at 10% 95%, rgba(4,70,109,.7), transparent 55%), linear-gradient(160deg,#0a1a2a,#06111c)" }}>
          <div style={{ display: "flex", width: 220, height: 100, backgroundImage: `url(${logo})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundColor: "#fff", borderRadius: 16 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontFamily: "Oswald", fontSize: 76, letterSpacing: 6, color: "#e9c46a", textTransform: "uppercase" }}>Certificate of Achievement</div>
            <div style={{ fontSize: 30, color: "rgba(255,255,255,.75)", marginTop: 14 }}>This is to recognise that</div>
            <div style={{ fontWeight: 800, fontSize: 92, marginTop: 10 }}>{cert.name}</div>
            <div style={{ fontSize: 32, color: "rgba(255,255,255,.85)", marginTop: 14, textAlign: "center" }}>
              passed the {levelName(cert.level)} level of the Royal Knowledge Challenge with {scorePct(cert.correct)}%
            </div>
            <div style={{ fontSize: 26, color: "#7cc0ee", marginTop: 10 }}>{monthLabel(cert.month)}</div>
          </div>
          <div style={{ display: "flex", width: "100%", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 22, color: "rgba(255,255,255,.75)" }}>
              <div style={{ fontFamily: "Oswald", fontSize: 30, color: "#fff" }}>Aman Sharma</div>
              <div>Founder and Head Coach, Royal Fitness Club</div>
              <div>Sector 93, Noida · Issued {issued}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: 18, color: "rgba(255,255,255,.7)" }}>
              <div style={{ display: "flex", width: 150, height: 150, backgroundImage: `url(${qr})`, backgroundSize: "cover", borderRadius: 8 }} />
              <div style={{ marginTop: 8 }}>Verify: {cert.code}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1754,
      height: 1240,
      fonts: [
        { name: "Oswald", data: oswald, weight: 700 },
        { name: "Inter", data: inter, weight: 500 },
        { name: "Inter", data: interBold, weight: 800 },
      ],
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}
