import { describe, expect, it } from "vitest";
import { parseHealthLead } from "./lead-intake";

const ok = { name: " Priya Sharma ", email: "Priya@Example.com", phone: "+91 98111 22233", service: "diet-consultation", message: "Need a PCOS-friendly plan", consent: true, page: "/health/consultation" };

describe("parseHealthLead", () => {
  it("turns a consultation form into a lead for Admin → Leads", () => {
    expect(parseHealthLead(ok)).toEqual({
      name: "Priya Sharma",
      phone: "9811122233",
      email: "priya@example.com",
      goal: "Diet consultation",
      interest: "diet",
      source: "health-diet-consultation",
      message: "Need a PCOS-friendly plan · from /health/consultation",
    });
    expect(parseHealthLead({ ...ok, service: "corporate-wellness" })).toMatchObject({ goal: "Corporate wellness", interest: "other", source: "health-corporate-wellness" });
    expect(parseHealthLead({ ...ok, service: "fitness-consultation" })).toMatchObject({ interest: "pt" });
    expect(parseHealthLead({ ...ok, email: "" })).toMatchObject({ email: null });
  });

  it("needs a name, a 10-digit mobile, consent and a known service", () => {
    expect(parseHealthLead({ ...ok, name: "A" })).toBe("Please enter your name.");
    expect(parseHealthLead({ ...ok, phone: "" })).toBe("Please enter a valid 10-digit mobile number so we can call you back.");
    expect(parseHealthLead({ ...ok, phone: "12345 67890" })).toBe("Please enter a valid 10-digit mobile number so we can call you back.");
    expect(parseHealthLead({ ...ok, email: "not-an-email" })).toBe("Please enter a valid email, or leave it blank.");
    expect(parseHealthLead({ ...ok, consent: false })).toBe("Please tick the box so we can contact you.");
    expect(parseHealthLead({ ...ok, service: "anything" })).toMatchObject({ source: "health-general", goal: "General enquiry" });
    expect(parseHealthLead(null)).toBe("Invalid request");
  });

  it("keeps within the leads table's limits", () => {
    const long = parseHealthLead({ ...ok, name: "x".repeat(200), message: "m".repeat(2000), page: "/p".repeat(200) });
    expect(typeof long === "object" && long.name.length).toBe(80);
    expect(typeof long === "object" && long.message.length).toBeLessThanOrEqual(600);
  });
});
