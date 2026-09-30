// Shared layout for generated Open Graph images (Satori subset of CSS).
export function OgCard({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
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
        <svg width="72" height="72" viewBox="0 0 48 48">
          <rect x="1" y="1" width="46" height="46" rx="12" fill="#0b0b0f" stroke="#d4a94a" strokeWidth="2" />
          <path d="M10 32 8 15l9 8 7-11 7 11 9-8-2 17Z" fill="#d4a94a" />
          <rect x="10" y="34" width="28" height="4" rx="2" fill="#d4a94a" />
        </svg>
        <div style={{ fontSize: 28, color: "#f2d88f", letterSpacing: 4, textTransform: "uppercase" }}>{kicker}</div>
      </div>
      <div style={{ display: "flex", fontSize: title.length > 50 ? 64 : 84, fontWeight: 800, lineHeight: 1.05, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,.75)" }}>{subtitle}</div>
    </div>
  );
}
