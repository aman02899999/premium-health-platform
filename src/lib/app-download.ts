// The Royal Fitness Android app (android/ in this repo) is a Trusted Web Activity: Chrome opens
// this site full screen, so the app and the website share one login, one database and one set
// of features. The .github/workflows/android.yml build publishes each APK as a GitHub release.

export const ANDROID_PACKAGE = "in.royalfitnesclub.app";

/** Always the newest release's file (GitHub redirects to it). */
export const APK_URL = "https://github.com/aman02899999/premium-health-platform/releases/latest/download/royal-fitness-club.apk";

/**
 * SHA-256 fingerprints of the key that signs the app (public, printed by every build). Listing
 * them in assetlinks.json lets the app open the site without a browser address bar. Set
 * ANDROID_CERT_SHA256 (comma-separated) or add the value here after the first build.
 */
const CERT_SHA256: string[] = [];

export function certFingerprints(env = process.env.ANDROID_CERT_SHA256): string[] {
  const all = [...CERT_SHA256, ...(env ?? "").split(",")]
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  return [...new Set(all)];
}

/** The Digital Asset Links statement Android checks before trusting the app with this site. */
export function assetLinks(fingerprints: string[]) {
  if (!fingerprints.length) return [];
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: fingerprints },
    },
  ];
}

/** True once a build has been published, so the page never shows a download that 404s. */
export async function apkPublished(): Promise<boolean> {
  try {
    const res = await fetch(APK_URL, { method: "HEAD", redirect: "follow", next: { revalidate: 3600 } });
    return res.ok;
  } catch {
    return false;
  }
}
