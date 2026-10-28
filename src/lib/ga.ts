/**
 * Google Analytics 4 for the gym site (property 559893674, web stream "My website").
 * Its main job is to show which links bring visitors, using their UTM tags: the Google Business
 * Profile website button (utm_campaign=gbp-listing), the weekly profile posts (gbp-weekly) and
 * Instagram. Vercel Web Analytics on the Hobby plan hides UTM reports, so GA4 fills that gap.
 *
 * A measurement ID is public by design (it ships in every page), so the fallback is safe to commit.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-KHL1G8CN5W";

/** Owner, coach and member-only areas: never counted, so our own visits don't skew the numbers. */
const PRIVATE_PREFIXES = ["/admin", "/account"];

export function isPrivatePath(path: string | null | undefined): boolean {
  if (!path) return false;
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function isValidGaId(id: string | undefined): id is string {
  return !!id && /^G-[A-Z0-9]{6,12}$/.test(id);
}

/**
 * Production only. NODE_ENV keeps local dev out; NEXT_PUBLIC_VERCEL_ENV (exposed by Vercel for
 * Next.js) keeps preview deployments out when it is available.
 */
export function gaEnabled(env: { nodeEnv?: string; vercelEnv?: string } = {
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
}): boolean {
  if (env.nodeEnv !== "production") return false;
  if (env.vercelEnv && env.vercelEnv !== "production") return false;
  return true;
}
