import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { applyOffer, OFFERS } from "@/lib/offers";
import { heroOffer } from "./hero-offer";

const plans = DEFAULT_CONTENT.plans;

describe("heroOffer", () => {
  it("shows the running offer's monthly price, bonus and end date", () => {
    const card = heroOffer(applyOffer(plans, "2026-10-28", OFFERS));
    expect(card).toEqual({
      title: "Festive Offer",
      price: "₹1,500",
      per: "month",
      gets: "1 month + 5 bonus days",
      until: "31 Dec",
      extra: "Annual ₹14,000: 14 months",
    });
  });

  it("shows nothing when no offer is running", () => {
    expect(heroOffer(applyOffer(plans, "2027-01-01", OFFERS))).toBeNull();
    expect(heroOffer(plans)).toBeNull();
  });

  it("leaves out the annual line when the annual plan has no offer", () => {
    const card = heroOffer(applyOffer(plans, "2026-10-28", OFFERS).map((p) => (p.id === "yearly" ? { ...p, offer: undefined } : p)));
    expect(card?.extra).toBeUndefined();
  });
});
