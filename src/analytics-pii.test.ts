// Personal data never goes to Google Analytics: GA's terms forbid it, and /privacy says we don't.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(tsx?|jsx?)$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });
}

describe("analytics events", () => {
  it("never carry an email address, phone number or name", () => {
    const offenders: string[] = [];
    for (const file of files(path.join(__dirname))) {
      const text = readFileSync(file, "utf8");
      // Each gtag(...) / dataLayer.push(...) call, up to its closing line.
      for (const m of text.matchAll(/(gtag\(\s*["']event["'][^;]*?\)|dataLayer\.push\([^;]*?\))/g)) {
        if (/\b(e-?mail|phone|mobile|referrer|referred|name)\b\s*:/i.test(m[0]) || /\.(email|phone)\b/.test(m[0])) offenders.push(`${path.relative(__dirname, file)}: ${m[0].slice(0, 120)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
