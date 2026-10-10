import { inflateSync } from "zlib";
import { describe, expect, it } from "vitest";
import { DEFAULT_COACH, DEFAULT_PROFILE } from "./defaults";
import { targets } from "./engine";
import { lifestyle, supplements, training } from "./guidance";
import { planLabels } from "./labels";
import { planDays } from "./meals";
import { buildPlanPdf, type PlanPdfInput } from "./pdf-core";

const client = { ...DEFAULT_PROFILE, name: "Test Client", weightKg: 80, targetWeightKg: 70 };
const T = targets(client);
const input = (trial: boolean): PlanPdfInput => ({
  client,
  t: T,
  days: planDays(T, client, 7),
  training: training({ ...client, goal: T.goal }),
  supplements: supplements(client),
  lifestyle: lifestyle(client),
  business: { name: "Royal Fitness Club", phone: "+91 90000 00000", address: "", instagram: "", site: "example.in" },
  coach: { name: "Aman Sharma", ...DEFAULT_COACH, photo: "" },
  coachNote: "",
  extras: { roadmap: false, grocery: false, tracker: false },
  bodyImage: null,
  labels: planLabels(client, T),
  trial,
});
/** Page content streams are compressed: inflate each one so the drawn text can be searched. */
const text = (doc: Awaited<ReturnType<typeof buildPlanPdf>>["doc"]) => {
  const raw = Buffer.from(doc.output("arraybuffer"));
  const bin = raw.toString("latin1");
  let out = "";
  for (let at = bin.indexOf("stream\n"); at !== -1; at = bin.indexOf("stream\n", at + 1)) {
    const start = at + 7;
    const end = bin.indexOf("endstream", start);
    try {
      out += inflateSync(raw.subarray(start, end)).toString("latin1");
    } catch {
      // not a Flate stream
    }
  }
  return out;
};
const assets = { logo: null, mark: null, photo: null };

describe("7-day trial PDF", () => {
  it("is watermarked, locks herb doses and sells the full programme", async () => {
    const { doc, filename } = await buildPlanPdf(input(true), assets);
    const out = text(doc);
    expect(filename).toMatch(/^royal-fitness-7-day-trial-test-client-/);
    expect(out).toContain("7-DAY TRIAL PLAN");
    expect(out).toContain("What the full programme adds");
    expect(out).toContain("Rs 2,999");
    expect(out).toContain("7-day trial tracker"); // roadmap page is forced on for trials
    expect(out).not.toContain("Check-in log");
  }, 30_000);

  it("leaves the paid plan unchanged", async () => {
    const { doc, filename } = await buildPlanPdf(input(false), assets);
    const out = text(doc);
    expect(filename).toMatch(/^royal-fitness-plan-/);
    expect(out).not.toContain("TRIAL");
    expect(out).not.toContain("What the full programme adds");
  }, 30_000);
});
