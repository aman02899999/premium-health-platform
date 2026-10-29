import type { Theme } from "./types";

export type Look = NonNullable<Theme["look"]>;

const LOOKS: readonly Look[] = ["classic", "mono", "gold"];

/** Which palette the gym site renders. Anything unrecognised falls back to Royal Black & Gold. */
export function lookOf(theme: Partial<Theme> | undefined): Look {
  const look = theme?.look;
  return look && LOOKS.includes(look) ? look : "gold";
}
