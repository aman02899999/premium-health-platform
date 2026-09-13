#!/usr/bin/env node
/**
 * Syncs the public-apis catalogue into src/data/public-apis.ts.
 *
 * Source: https://github.com/public-apis/public-apis (MIT) — a community list of
 * free, public APIs. We keep the health-relevant categories so the developer
 * directory can show what exists, what we already integrate, and what is still
 * available to add.
 *
 * Usage:  node scripts/sync-public-apis.mjs
 *
 * Why the GitHub Contents API instead of raw.githubusercontent.com: many CI
 * sandboxes (including the one this project is developed in) allowlist
 * api.github.com and github.com but block raw.githubusercontent.com. The
 * Contents API returns the same bytes base64-encoded.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO = "public-apis/public-apis";
const README_PATH = "README.md";
const OUT = path.resolve(fileURLToPath(new URL("../src/data/public-apis.ts", import.meta.url)));

/** Categories that are relevant to a health/nutrition platform. */
const CATEGORIES = [
  "Health",
  "Food & Drink",
  "Science & Math",
  "Open Data",
  "Government",
  "Environment",
];

/** Providers already integrated in src/services/health/providers (by display name). */
const INTEGRATED = new Set([
  "Open Food Facts",
  "Open-Meteo",
  "Clinical Trials Directory",
  "Purple Air",
  "USDA FoodData Central",
]);

/** The curated set wired up by the developer API (see src/lib/saas/endpoints.ts). */
const VETTED = new Map([
  ["Europe PMC", "literature/search"],
  ["OpenAlex", "scholarly/search"],
  ["Fruityvice", "nutrition/fruit"],
  ["Open-Meteo", "air-quality (CAMS)"],
  ["Open Food Facts", "food/search"],
  ["Clinical Trials Directory", "clinical-trials"],
]);

/**
 * Fetches JSON, preferring Node's fetch and falling back to curl.
 *
 * Node ships its own CA bundle, so in a TLS-intercepting environment (a CI
 * sandbox with a corporate proxy) `fetch` can fail with
 * UNABLE_TO_VERIFY_LEAF_SIGNATURE while curl — which uses the system trust
 * store — succeeds. Set NODE_EXTRA_CA_CERTS to the system bundle to avoid the
 * fallback entirely.
 */
async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "bhg-catalogue-sync" },
    });
    if (res.ok) return await res.json();
    throw new Error(`HTTP ${res.status}`);
  } catch (directError) {
    const { execFileSync } = await import("node:child_process");
    try {
      const out = execFileSync(
        "curl",
        ["-sS", "-L", "--max-time", "60", "-H", "Accept: application/vnd.github+json", url],
        { encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 }
      );
      return JSON.parse(out);
    } catch {
      throw new Error(
        `Could not reach the GitHub API (${directError.message}). ` +
          `Set NODE_EXTRA_CA_CERTS to your system CA bundle, ensure curl is installed, or run this where api.github.com is reachable.`
      );
    }
  }
}

async function fetchReadme() {
  const json = await fetchJson(`https://api.github.com/repos/${REPO}/contents/${README_PATH}`);
  if (!json.content) throw new Error("GitHub response contained no file content");
  return Buffer.from(json.content, "base64").toString("utf-8");
}

/**
 * Extracts one `### Category` section.
 *
 * Note on the sentinel: a naive `(?=^### |\Z)` lookahead is a bug in JavaScript —
 * `\Z` is not "end of input", it is an identity escape matching a literal "Z",
 * so the section silently truncated at the first capital Z in the data (which is
 * exactly what happened to the Government table at "Prague(CZ)"). Appending an
 * explicit end marker removes the need for any end-of-input escape.
 */
const SECTION_END = "\n### __END_OF_README__\n";

function section(markdown, category) {
  const escaped = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const padded = `${markdown}${SECTION_END}`;
  const match = new RegExp(`^### ${escaped}\\n([\\s\\S]*?)(?=^### )`, "m").exec(padded);
  return match ? match[1] : "";
}

function stripMd(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstUrl(value) {
  const match = /\((https?:\/\/[^)]+)\)/.exec(value);
  return match ? match[1] : "";
}

function parseRows(block, category) {
  const rows = [];
  for (const line of block.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    if (/^\|\s*:?-{2,}/.test(line)) continue; // separator row
    const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
    if (cells.length < 5) continue;
    const [apiCell, descCell, authCell, httpsCell, corsCell] = cells;
    const name = stripMd(apiCell);
    if (!name || name.toLowerCase() === "api") continue;
    if (name.startsWith("---")) continue;

    rows.push({
      name,
      description: stripMd(descCell).slice(0, 160),
      auth: stripMd(authCell) || "Unknown",
      https: /^yes$/i.test(stripMd(httpsCell)),
      cors: stripMd(corsCell) || "Unknown",
      category,
      url: firstUrl(apiCell),
    });
  }
  return rows;
}

function tsString(value) {
  return JSON.stringify(value ?? "");
}

const markdown = await fetchReadme();
const entries = [];

for (const category of CATEGORIES) {
  const block = section(markdown, category);
  if (!block) {
    console.warn(`  ! category not found: ${category}`);
    continue;
  }
  entries.push(...parseRows(block, category));
}

const totalCategories = [...markdown.matchAll(/^### (.+)$/gm)].length;

const deduped = [];
const seen = new Set();
for (const entry of entries) {
  const key = `${entry.category}:${entry.name}`.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(entry);
}

const noAuth = deduped.filter((e) => /^no$/i.test(e.auth) && e.https).length;
const body = `/**
 * Public API catalogue — GENERATED FILE, DO NOT EDIT BY HAND.
 *
 * Regenerate with:  node scripts/sync-public-apis.mjs
 *
 * Source: https://github.com/public-apis/public-apis (MIT licensed list of free
 * public APIs). This file keeps the health-relevant categories only
 * (${CATEGORIES.join(", ")}).
 *
 * The upstream list covers ${totalCategories} categories in total — see the link above for all of them.
 * Generated: ${new Date().toISOString().slice(0, 10)}
 * Entries: ${deduped.length} (${noAuth} keyless + HTTPS)
 */

export type PublicApiEntry = {
  name: string;
  description: string;
  /** "No" | "apiKey" | "OAuth" | … as listed upstream. */
  auth: string;
  https: boolean;
  cors: string;
  category: string;
  /** Homepage / docs link from the upstream list. */
  url: string;
  /** True when this platform already integrates the source. */
  integrated: boolean;
  /** Endpoint path when the source is wired into /api/v1 (curated set). */
  apiPath?: string;
};

export const PUBLIC_APIS: readonly PublicApiEntry[] = [
${deduped
  .map((e) => {
    const integrated = INTEGRATED.has(e.name);
    const apiPath = VETTED.get(e.name);
    return (
      `  { name: ${tsString(e.name)}, description: ${tsString(e.description)}, auth: ${tsString(e.auth)}, ` +
      `https: ${e.https}, cors: ${tsString(e.cors)}, category: ${tsString(e.category)}, url: ${tsString(e.url)}, ` +
      `integrated: ${integrated}${apiPath ? `, apiPath: ${tsString(apiPath)}` : ""} },`
    );
  })
  .join("\n")}
];

export const PUBLIC_API_CATEGORIES: readonly string[] = ${JSON.stringify(CATEGORIES)};

export const PUBLIC_API_SOURCE = {
  repository: "https://github.com/${REPO}",
  licence: "MIT (list); each API keeps its own terms",
  totalCategoriesUpstream: ${totalCategories},
  syncedCategories: ${JSON.stringify(CATEGORIES)},
  generatedAt: ${JSON.stringify(new Date().toISOString())},
} as const;

/** Keyless + HTTPS entries — the ones that can be consumed without onboarding. */
export function keylessPublicApis(): PublicApiEntry[] {
  return PUBLIC_APIS.filter((a) => /^no$/i.test(a.auth) && a.https);
}

export function publicApisByCategory(category: string): PublicApiEntry[] {
  return PUBLIC_APIS.filter((a) => a.category === category);
}
`;

await writeFile(OUT, body, "utf-8");
console.log(`Synced ${deduped.length} APIs (${noAuth} keyless+HTTPS) from ${CATEGORIES.length} categories → ${path.relative(process.cwd(), OUT)}`);
