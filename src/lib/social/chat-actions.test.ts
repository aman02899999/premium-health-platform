import { describe, expect, it } from "vitest";
import { manualTemplates, type ContactFacts } from "./chat-actions";

const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://x.in" };
const base: ContactFacts = { peer: "919876543210", name: "Pratibha Singh", optedOut: false, lead: null, member: null };

describe("templates for a closed window", () => {
  it("fits the customer: open lead, active member, lapsed member", () => {
    expect(manualTemplates({ ...base, lead: { status: "new", interest: "", source: "", createdAt: "" } }, biz).map((t) => t.kind)).toEqual(["lead-2", "trial-offer", "call-followup"]);
    const active = manualTemplates({ ...base, member: { planName: "Quarterly", expiresOn: "2026-11-01", active: true, renewToken: "tok" } }, biz);
    expect(active.map((t) => t.kind)).toEqual(["renew-7", "call-followup"]);
    expect(active[0].preview).toContain("Hi Pratibha, your *Quarterly* membership at Royal Fitness Club ends on *1 Nov 2026*.");
    expect(active[0].preview).toContain("👉 https://x.in/join?renew=tok");
    expect(manualTemplates({ ...base, member: { planName: "Monthly", expiresOn: "2026-09-01", active: false, renewToken: "tok" } }, biz)[0]).toMatchObject({ kind: "comeback", name: "rfc_comeback_offer_v3", marketing: true });
  });
  it("leaves promotions out after Stop promotions", () => {
    expect(manualTemplates({ ...base, optedOut: true }, biz)).toEqual([]);
    expect(manualTemplates({ ...base, optedOut: true, member: { planName: "Monthly", expiresOn: "2026-11-01", active: true, renewToken: "t" } }, biz).map((t) => t.kind)).toEqual(["renew-7"]);
  });
  it("leaves promotions out for a register member who hasn't agreed to offers", () => {
    const m = { planName: "Monthly", expiresOn: "2026-11-01", active: true, renewToken: "t", offersOk: false };
    expect(manualTemplates({ ...base, member: m }, biz).map((t) => t.kind)).toEqual(["renew-7"]);
    expect(manualTemplates({ ...base, member: { ...m, active: false } }, biz)).toEqual([]);
  });
});
