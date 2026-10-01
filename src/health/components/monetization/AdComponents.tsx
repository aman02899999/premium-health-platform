import type { AdPlacement } from "@/health/lib/monetization/types";

// These used to render dashed "Advertisement · placeholder" boxes. Real ads now
// come from Google AdSense Auto ads (loaded in the /health layout), which picks
// placements itself, so the fixed slots render nothing. Kept as no-ops so the
// pages that place them still compile; swap in <ins class="adsbygoogle"> units
// here if you later create manual ad units in AdSense.
type AdProps = { placement?: AdPlacement; page?: string };

export function AdBanner(_: AdProps) {
  return null;
}
export function AdRectangle(_: AdProps) {
  return null;
}
export function AdInArticle(_: AdProps) {
  return null;
}
export function AdSidebar(_: AdProps) {
  return null;
}
