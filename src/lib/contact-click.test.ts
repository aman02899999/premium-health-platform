import { describe, expect, it } from "vitest";
import { contactMethod } from "./contact-click";

describe("contactMethod", () => {
  it("spots phone links", () => {
    expect(contactMethod("tel:+918851830081")).toBe("call");
    expect(contactMethod(" TEL:08851830081")).toBe("call");
  });

  it("spots WhatsApp links in every form the site uses", () => {
    expect(contactMethod("https://wa.me/919266840289?text=Hi")).toBe("whatsapp");
    expect(contactMethod("https://api.whatsapp.com/send?phone=919266840289")).toBe("whatsapp");
    expect(contactMethod("whatsapp://send?phone=919266840289")).toBe("whatsapp");
  });

  it("ignores everything else", () => {
    expect(contactMethod("/join")).toBeNull();
    expect(contactMethod("mailto:hello@example.com")).toBeNull();
    expect(contactMethod("https://www.instagram.com/royalfitness93_")).toBeNull();
    expect(contactMethod("https://evil.example/wa.me/91")).toBeNull();
    expect(contactMethod("https://wa.me.evil.example/91")).toBeNull();
    expect(contactMethod("")).toBeNull();
    expect(contactMethod(null)).toBeNull();
  });
});
