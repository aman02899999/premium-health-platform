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
        background: "radial-gradient(circle at 80% 20%, rgba(212,169,74,.45), transparent 50%), linear-gradient(135deg,#07070a,#15120a)",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only */}
        <img src={logoSrc} alt="" width={176} height={80} style={{ background: "#fff", borderRadius: 16, padding: 8 }} />
        <div style={{ fontSize: 28, color: "#f2d88f", letterSpacing: 4, textTransform: "uppercase" }}>{kicker}</div>
      </div>
      <div style={{ display: "flex", fontSize: title.length > 50 ? 64 : 84, fontWeight: 800, lineHeight: 1.05, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,.75)" }}>{subtitle}</div>
    </div>
  );
}
