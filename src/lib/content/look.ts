import type { Theme } from "./types";

export type Look = NonNullable<Theme["look"]>;

const LOOKS: readonly Look[] = ["royal", "classic", "mono", "gold"];

/** Which palette the gym site renders. Anything unrecognised falls back to the premium logo red and navy. */
export function lookOf(theme: Partial<Theme> | undefined): Look {
  const look = theme?.look;
  return look && LOOKS.includes(look) ? look : "royal";
}
