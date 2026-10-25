import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./content/defaults";
import { applyOffer, OFFERS } from "./offers";
import { faqsWithOffer, llmsTxt } from "./content/ai-facts";
import { businessProfiles, localBusinessJsonLd, personJsonLd } from "./seo";
import { fullAddress, instagramHandle, instagramHref } from "./site";
import { SITE } from "@/health/lib/site";
import { articleJsonLd, blogPostingJsonLd, breadcrumbItemsJsonLd, organizationJsonLd } from "@/health/lib/seo";
import healthSitemap from "@/app/(health)/health/sitemap";

const c = DEFAULT_CONTENT;
const trainer = (over: Partial<(typeof c.trainers)[number]>) => ({ ...c.trainers[0], bio: "", credentials: [], ...over });

describe("Instagram handles pasted as links", () => {
  it("keeps only the handle", () => {
    expect(instagramHandle("https://www.instagram.com/prince_lohia8?srtk=MTBzZzVkZnB3NnV3Yg==")).toBe("prince_lohia8");
    expect(instagramHandle("instagram.com/avrilltj_51/")).toBe("avrilltj_51");
    expect(instagramHandle("@royalfitness93_")).toBe("royalfitness93_");
    expect(instagramHandle("royalfitness93_")).toBe("royalfitness93_");
    expect(instagramHref("https://www.instagram.com/x.y_z?igsh=1")).toBe("https://www.instagram.com/x.y_z/");
  });
});

describe("Gym entity markup", () => {
  it("trainer sameAs is a clean profile URL and a bio is not used as a job title", () => {
    const p = personJsonLd(trainer({ name: "Manish", role: "@goldgymcertified Classic fitness certified TRX certified Trainer Former trainer", instagram: "https://www.instagram.com/avrilltj_51?exln=ZDN" }));
    expect(p.sameAs).toEqual(["https://www.instagram.com/avrilltj_51/"]);
    expect(p.jobTitle).toBe("Trainer");
    expect(p.description).toContain("TRX certified");
    const founder = personJsonLd(trainer({ role: "Founder & Head Coach" }));
    expect(founder.jobTitle).toBe("Founder & Head Coach");
    expect(founder["@id"]).toMatch(/#founder$/);
  });

  it("sameAs lists every profile the admin filled in, and nothing blank", () => {
    expect(businessProfiles(c.business)).toEqual(["https://www.instagram.com/royalfitness93_/", c.business.googleMapsUrl]);
    const b = { ...c.business, justdialUrl: "https://www.justdial.com/Noida/Royal-Fitness-Club", facebookUrl: " ", youtubeUrl: "not a url" };
    expect(localBusinessJsonLd({ ...c, business: b }).sameAs).toContain("https://www.justdial.com/Noida/Royal-Fitness-Club");
    expect(businessProfiles(b)).toHaveLength(3);
  });
});

describe("Prices quoted to search engines and assistants agree", () => {
  it("adds the running offer to the fees answer, and drops it once the offer ends", () => {
    const during = faqsWithOffer(c.faqs, applyOffer(c.plans, "2026-11-01", OFFERS)).find((f) => f.id === "fees")!;
    expect(during.a).toMatch(/Right now: Festive Offer until 31 December 2026: Monthly .* for ₹1,500/);
    const after = faqsWithOffer(c.faqs, applyOffer(c.plans, "2027-01-02", OFFERS)).find((f) => f.id === "fees")!;
    expect(after.a).toBe(c.faqs.find((f) => f.id === "fees")!.a);
    // Other answers are untouched.
    expect(faqsWithOffer(c.faqs, applyOffer(c.plans, "2026-11-01", OFFERS)).filter((f) => f.id !== "fees")).toEqual(c.faqs.filter((f) => f.id !== "fees"));
  });
});

describe("llms.txt", () => {
  const t = llmsTxt(c, applyOffer(c.plans, "2026-11-01", OFFERS), "https://x.in");
  it("covers the health section and who runs it", () => {
    expect(t).toContain("## Bharat Health Guide (https://x.in/health)");
    expect(t).toContain("run by Royal Fitness Club");
    expect(t).toContain("- [Guides in Hindi](https://x.in/hi/health/blog)");
  });
  it("gives the full address with the state, and sends review questions to Google, not an empty page", () => {
    expect(t).toContain("Noida, Uttar Pradesh 201304");
    expect(t).not.toContain("Verified reviews:");
    expect(t).toContain(`Read and write reviews on Google: ${c.business.googleReviewUrl}`);
  });
});

describe("Health portal identity", () => {
  it("is Bharat Health Guide, run by the gym", () => {
    const org = organizationJsonLd();
    expect(org.name).toBe("Bharat Health Guide");
    expect(org.parentOrganization).toMatchObject({ "@id": "https://www.royalfitnesclub.in/#gym", name: "Royal Fitness Club" });
  });

  it("names, address and phone in the health footer match the gym's", () => {
    expect(SITE.operator.name).toBe(c.business.name);
    expect(SITE.operator.address).toBe(fullAddress(c.business));
    expect(SITE.operator.phone).toBe(c.business.phone);
  });

  it("article markup carries no invented dates and points at the publisher", () => {
    const a = articleJsonLd({ title: "Ashwagandha", description: "d", slug: "/health/herbs/ashwagandha" });
    expect(a).not.toHaveProperty("datePublished");
    expect(a).not.toHaveProperty("dateModified");
    expect(a.publisher.parentOrganization["@id"]).toMatch(/#gym$/);
    const b = blogPostingJsonLd({ title: "t", description: "d", slug: "/health/blog/x", image: "i", imageAlt: "a", datePublished: "2026-01-01", dateModified: "2026-02-01", category: "c", author: "Bharat Health Guide Editorial Team", tags: [], readMinutes: 5 });
    expect(b.author.url).toMatch(/\/health\/blog\/author$/);
  });

  it("breadcrumbs from visible crumbs leave the current page without a URL", () => {
    const j = breadcrumbItemsJsonLd([{ label: "Home", href: "/health" }, { label: "Herbs", href: "/health/herbs" }, { label: "Ashwagandha" }]);
    expect(j.itemListElement[1]).toMatchObject({ position: 2, name: "Herbs", item: "https://www.royalfitnesclub.in/health/herbs" });
    expect(j.itemListElement[2]).not.toHaveProperty("item");
  });
});

describe("Health sitemap lastmod", () => {
  it("is never the time of the request", () => {
    const before = Date.now();
    const entries = healthSitemap();
    const stamped = entries.filter((e) => e.lastModified && Math.abs(new Date(e.lastModified).getTime() - before) < 60_000);
    expect(stamped).toEqual([]);
    expect(entries.find((e) => e.url.endsWith("/health/herbs/ashwagandha"))?.lastModified).toBeUndefined();
  });
});
