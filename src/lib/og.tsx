import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Shared layout for generated Open Graph images (Satori subset of CSS).
export async function loadLogo() {
  const data = await readFile(join(process.cwd(), "public/brand/logo-mark.png"));
  return `data:image/png;base64,${data.toString("base64")}`;
}

export function OgCard({ kicker, title, subtitle, logoSrc }: { kicker: string; title: string; subtitle: string; logoSrc: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "radial-gradient(circle at 80% 20%, rgba(232,57,75,.45), transparent 50%), radial-gradient(circle at 10% 90%, rgba(4,70,109,.8), transparent 55%), linear-gradient(135deg,#06111c,#0a1a2a)",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
        <img src={logoSrc} alt="" width={176} height={80} style={{ background: "#fff", borderRadius: 16, padding: 8 }} />
        <div style={{ fontSize: 28, color: "#7cc0ee", letterSpacing: 4, textTransform: "uppercase" }}>{kicker}</div>
      </div>
      <div style={{ display: "flex", fontSize: title.length > 50 ? 64 : 84, fontWeight: 800, lineHeight: 1.05, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,.75)" }}>{subtitle}</div>
    </div>
  );
}
