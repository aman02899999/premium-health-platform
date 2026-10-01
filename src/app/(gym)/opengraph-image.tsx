import { ImageResponse } from "next/og";
import { getContent } from "@/lib/content/store";
import { OgCard, loadLogo } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Royal Fitness Club";

export default async function Image() {
  const c = await getContent();
  return new ImageResponse(<OgCard logoSrc={await loadLogo()} kicker={c.hero.eyebrow} title={c.business.name} subtitle={c.business.tagline} />, size);
}
