// Fails if ad code can reach a page outside the ad-allowed sections (/health, /blog, /hi).
// Gym pages must never load adsbygoogle.js or render an ad unit. Runs before every build.
//   npm run check:ads
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

// Where ad code may be used or imported.
const ALLOWED = [
  "src/app/(health)/", // /health/** and /hi/** (the Hindi health root layout lives here too)
  "src/app/(gym)/(site)/blog/", // /blog/**
  "src/health/", // health-site components, only used by the routes above
  "src/components/HealthAd.tsx",
  "src/components/ads/",
  "src/lib/adsense.ts",
];
// Anything that loads the script or renders an ad unit.
const AD_CODE = /\b(HealthAd|PremiumAwareAd|AdsenseScript|ADSENSE_SRC|ADSENSE_IN_ARTICLE_SLOT)\b|adsbygoogle|googlesyndication|@\/health\/components\/(ads|posts)\//;

function* files(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) yield p;
  }
}

const bad = [];
for (const f of files(SRC)) {
  const rel = path.relative(ROOT, f).split(path.sep).join("/");
  if (ALLOWED.some((a) => rel === a || rel.startsWith(a))) continue;
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((l, i) => {
    if (AD_CODE.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l)) bad.push(`${rel}:${i + 1}: ${l.trim().slice(0, 120)}`);
  });
}

// src/health/** must not be pulled into gym pages through a shared component.
const GYM = path.join(SRC, "app/(gym)");
for (const f of files(GYM)) {
  const rel = path.relative(ROOT, f).split(path.sep).join("/");
  if (rel.startsWith("src/app/(gym)/(site)/blog/")) continue;
  const s = fs.readFileSync(f, "utf8");
  if (/from\s+["']@\/health\/components\/(ads|posts)\//.test(s)) bad.push(`${rel}: imports health ad/post components on a gym page`);
}

// Public assets: ads.txt must stay as it is.
const adsTxt = fs.readFileSync(path.join(ROOT, "public/ads.txt"), "utf8");
if (!adsTxt.includes("google.com, pub-3250882336328071, DIRECT, f08c47fec0942fa0")) bad.push("public/ads.txt: the AdSense line changed");

if (bad.length) {
  console.error(`Ad code outside /health, /blog and /hi:\n  ${bad.join("\n  ")}`);
  process.exit(1);
}
console.log("check:ads OK: ad code only in /health, /blog and /hi");
