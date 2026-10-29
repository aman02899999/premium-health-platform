import { describe, expect, it } from "vitest";
import { readCsv } from "./sheet";
import { campaignDraft, campaignUrl, metaAudienceCsv, offerText, toContacts } from "./audience";
import { emailHtml } from "./email-html";

const biz = { name: "Royal Fitness Club", siteUrl: "https://x.in", coach: "Coach Aman Sharma" };

describe("contacts import", () => {
  it("reads name + mobile and/or email in any column order, and explains every skipped row", () => {
    const out = toContacts(readCsv("S.No,Member Name,E-mail,Mobile No\n1,Rahul Verma,RAHUL@x.in,+91 98765-43210\n2,Priya,,9.87E+09\n3,Neha,neha@x.in,\n4,Dup,,09876543210\n5,,,\n"));
    if (typeof out === "string") throw new Error(out);
    expect(out.columns).toEqual({ name: "Member Name", email: "E-mail", phone: "Mobile No" });
    expect(out.contacts).toEqual([
      { row: 2, name: "Rahul Verma", phone: "9876543210", email: "rahul@x.in" },
      { row: 4, name: "Neha", phone: null, email: "neha@x.in" },
    ]);
    expect(out.errors.map((e) => e.row)).toEqual([3, 5]);
    expect(out.errors[1].message).toMatch(/Same mobile/);
    expect(toContacts(readCsv("Amount,Date\n1,2\n"))).toMatch(/header row/);
  });
});

describe("campaign messages", () => {
  const c = { id: "c1", name: "Diwali Comeback!", channel: "whatsapp" as const, offer: "3 months gym\n+ diet plan for ₹4,000", link: "membership" as const, subject: "" };
  it("WhatsApp: the approved template with one-line params and a tagged link, once per person", () => {
    const d = campaignDraft(c, { name: "Rahul Verma", phone: "9876543210", email: null }, biz)!;
    expect(d).toMatchObject({ channel: "whatsapp", to: "919876543210", kind: "offer-broadcast", template: "rfc_offer_broadcast_v3", dedupeKey: "campaign:c1:919876543210" });
    // The link in the message is the person's tracked link; it redirects to the tagged page.
    expect(d.params.slice(0, 3)).toEqual(["Rahul", "Royal Fitness Club", "3 months gym + diet plan for ₹4,000"]);
    expect(d.params[3]).toMatch(/^https:\/\/x\.in\/r\/[0-9A-Za-z]{9}$/);
    expect(d.link).toEqual({ code: d.params[3].split("/r/")[1], url: "https://x.in/membership?utm_source=whatsapp&utm_medium=campaign&utm_campaign=diwali-comeback" });
    expect(campaignDraft(c, { name: "No Phone", phone: null, email: "a@b.in" }, biz)).toBeNull();
  });
  it("email: a marketing email with the CTA and the unsubscribe handling of nurture emails", () => {
    const d = campaignDraft({ ...c, channel: "email", subject: "Come back this Diwali", link: "trial" }, { name: "Neha", phone: null, email: "Neha@X.in" }, biz)!;
    expect(d).toMatchObject({ channel: "email", to: "neha@x.in", kind: "nurture-campaign", subject: "Come back this Diwali", dedupeKey: "campaign:c1:neha@x.in" });
    expect(d.body).toContain(`[[CTA:Start the ₹49 trial|https://x.in/r/${d.link!.code}]]`);
    expect(d.link!.url).toBe("https://x.in/diet-chart?plan=trial&utm_source=email&utm_medium=campaign&utm_campaign=diwali-comeback#order");
    // The button only renders when the CTA is the last line.
    const html = emailHtml(d.body, { brand: "Royal Fitness Club", footer: "f", style: "newsletter" });
    expect(html).toContain(`href="https://x.in/r/${d.link!.code}"`);
    expect(html).not.toContain("[[CTA");
  });
  it("names the number a person answers, in WhatsApp offers and emails", () => {
    const live = { ...biz, phone: "+91 88518 30081" };
    const w = campaignDraft(c, { name: "Rahul Verma", phone: "9876543210", email: null }, live)!;
    expect(w.params[2]).toBe("3 months gym + diet plan for ₹4,000. Call or WhatsApp +91 88518 30081");
    expect(w.body).toContain("Call or WhatsApp +91 88518 30081\n\nGrab it before it's gone");
    const e = campaignDraft({ ...c, channel: "email" }, { name: "Neha", phone: null, email: "neha@x.in" }, live)!;
    expect(e.body).toContain("Prefer to talk? Call or WhatsApp +91 88518 30081: https://wa.me/918851830081?text=");
  });
  it("cleans offers and links", () => {
    expect(offerText("  Big\toffer \n\n now   ")).toBe("Big offer now");
    expect(campaignUrl("https://x.in", "gymtrial", "A", "email")).toBe("https://x.in/contact?utm_source=email&utm_medium=campaign&utm_campaign=a#trial");
  });
});

describe("Meta ads customer list", () => {
  it("has Meta's column names, the country code, and escapes names", () => {
    expect(metaAudienceCsv([{ name: "Rahul Kumar Verma", phone: "9876543210", email: "r@x.in" }, { name: 'Sam "Big"', phone: null, email: "s@x.in" }])).toBe(
      'email,phone,fn,ln,country\nr@x.in,919876543210,Rahul,Kumar Verma,in\ns@x.in,,Sam,"""Big""",in\n',
    );
    expect(metaAudienceCsv([{ name: '=HYPERLINK("x") Kumar', phone: "9876543210", email: null }])).toBe(`email,phone,fn,ln,country\n,919876543210,"'=HYPERLINK(""x"")",Kumar,in\n`);
  });
});

describe("playbook", async () => {
  const { playbook } = await import("./audience");
  const { applyOffer, OFFERS } = await import("@/lib/offers");
  const { planMonths } = await import("@/lib/content/plans");
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  it("quotes today's offer prices during an offer and standard prices after it", () => {
    const during = playbook(applyOffer(DEFAULT_CONTENT.plans, "2026-11-01", OFFERS), planMonths);
    expect(during.map((p) => p.segment)).toEqual(["ex-recent", "ex-old", "expiring", "current", "leads"]);
    expect(during[0].offer).toBe("Festive Offer: restart with 1 month + 5 bonus days for ₹1,500 till 31/12/2026");
    expect(during[2].offer).toContain("₹14,000");
    const after = playbook(applyOffer(DEFAULT_CONTENT.plans, "2027-01-15", OFFERS), planMonths);
    expect(after[0].offer).toBe("your spot is still here. Restart this month, plans from ₹1,067 a month");
    expect(after[2].offer).toBe("renew before your plan ends. Annual works out to ₹1,167 a month");
    for (const p of [...during, ...after]) {
      expect(p.offer.length).toBeLessThanOrEqual(160);
      if (p.channel === "whatsapp") expect(p.link).not.toBe("shop");
    }
  });
});
