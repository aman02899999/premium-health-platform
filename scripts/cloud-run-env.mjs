// Turns the APP_ENV GitHub secret (one KEY=value per line, copied from the owner's notes) into:
//   <out>/appenv.sh   shell-safe exports, used only during the Docker build (never kept in the image)
//   <out>/env.yaml    the Cloud Run service's environment (gcloud run deploy --env-vars-file)
// Blank lines and lines starting with # are skipped. Values are taken literally: no quotes needed.
// Usage: node scripts/cloud-run-env.mjs <out-dir>   (reads the secret from $APP_ENV)
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export function parseEnv(text) {
  const out = {};
  // Errors name the line number only: the deploy log is public, so no part of a value may appear.
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) throw new Error(`APP_ENV line ${i + 1} is not NAME=value (check for a missing "=")`);
    const key = line.slice(0, eq).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) throw new Error(`APP_ENV line ${i + 1}: the name must be capital letters, digits and _`);
    let value = line.slice(eq + 1).trim();
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

// Cloud Run sets these itself or they must not be overridden.
const RESERVED = new Set(["PORT", "K_SERVICE", "K_REVISION", "K_CONFIGURATION"]);

export const toShell = (env) => Object.entries(env).map(([k, v]) => `export ${k}='${v.replace(/'/g, `'\\''`)}'`).join("\n") + "\n";
export const toYaml = (env) =>
  Object.entries(env).filter(([k]) => !RESERVED.has(k)).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n") + "\n";

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const dir = process.argv[2];
  if (!dir) throw new Error("usage: node scripts/cloud-run-env.mjs <out-dir>");
  const env = parseEnv(process.env.APP_ENV ?? "");
  // Always production on Cloud Run: keeps demo payment routes switched off.
  env.VERCEL_ENV = "production";
  for (const need of ["DATABASE_URL", "CRON_SECRET"]) if (!env[need]) throw new Error(`APP_ENV is missing ${need}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "appenv.sh"), toShell(env), { mode: 0o600 });
  writeFileSync(path.join(dir, "env.yaml"), toYaml(env), { mode: 0o600 });
  console.log(`APP_ENV: ${Object.keys(env).length} values (names only): ${Object.keys(env).sort().join(", ")}`);
}
