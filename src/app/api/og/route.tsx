import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || `${SITE.name} — ${SITE.tagline}`;
  const category = searchParams.get("category") || "Health Guide";
  const type = searchParams.get("type") || "article";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b5c3f 0%, #0f766e 50%, #78350f 100%)",
          padding: "60px",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: "#0b5c3f", fontWeight: 900, fontSize: "24px" }}>♥</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 800 }}>{SITE.name}</span>
              <span style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.8 }}>Modern · Ayurveda · Nutrition</span>
            </div>
            <span style={{ marginLeft: "20px", background: "rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{category}</span>
            <span style={{ background: "#f59e0b", color: "#000", padding: "6px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: 800 }}>{type}</span>
          </div>
          <div style={{ fontSize: "48px", fontWeight: 900, lineHeight: 1.1, maxWidth: "900px", marginTop: "20px" }}>{title.length > 90 ? title.slice(0, 87) + "..." : title}</div>
          <div style={{ fontSize: "18px", opacity: 0.85, maxWidth: "700px", marginTop: "12px" }}>{SITE.heroSubtitle}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", fontSize: "13px", opacity: 0.7 }}>
          <span>{SITE.url} · Evidence-informed · India-specific</span>
          <span>© 2026 {SITE.name}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
