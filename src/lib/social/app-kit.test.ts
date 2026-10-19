import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { applyOffer } from "@/lib/offers";
import { businessAppKit } from "./app-kit";

describe("WhatsApp Business app kit", () => {
  const b = DEFAULT_CONTENT.business;
  const offerPlans = applyOffer(DEFAULT_CONTENT.plans, "2026-10-20");
  const plainPlans = applyOffer(DEFAULT_CONTENT.plans, "2027-02-01");

  it("builds greeting, away and quick replies from the plans as sold today", () => {
    const kit = businessAppKit(b, offerPlans, "https://example.in");
    expect(kit.map((k) => k.id)).toEqual(["greeting", "away", "offer", "fees", "timing", "trial", "diet", "renew", "number"]);
    for (const k of kit) expect(k.text.length, k.id).toBeLessThan(700);
    const offer = kit.find((k) => k.id === "offer")!.text;
    for (const p of offerPlans.filter((x) => x.price > 0)) expect(offer).toContain(`₹${p.price.toLocaleString("en-IN")}`);
    expect(kit.find((k) => k.id === "greeting")!.text).toContain("wa.me/919266840289");
  });

  it("drops the offer lines once the offer has ended", () => {
    const kit = businessAppKit(b, plainPlans, "https://example.in");
    expect(kit.find((k) => k.id === "offer")!.text).toMatch(/^Our membership plans/);
    expect(kit.map((k) => k.text).join("\n")).not.toMatch(/Festive/i);
  });
});
