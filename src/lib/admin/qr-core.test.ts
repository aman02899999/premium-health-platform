import { describe, expect, it } from "vitest";
import { OPTIN_TEXT, allowedTarget, buildTarget, newQrCode, refFromText, refLine } from "./qr-core";

const biz = { siteUrl: "https://www.royalfitnesclub.in", botNumber: "919266840289", deskNumber: "+91 88518 30081", reviewUrl: "https://g.page/r/abc/review" };

describe("QR targets", () => {
  it("bot and desk open WhatsApp with the ref at the end", () => {
    const t = buildTarget({ kind: "bot", label: "Reception" }, "Ab3dE6fG", biz);
    expect("target" in t && t.target.startsWith("https://wa.me/919266840289?text=")).toBe(true);
    const text = decodeURIComponent((t as { target: string }).target.split("text=")[1]);
    expect(refFromText(text)).toBe("Ab3dE6fG");
    const d = buildTarget({ kind: "desk", label: "Desk", text: "Hello" }, "Ab3dE6fG", biz) as { target: string };
    expect(d.target).toBe(`https://wa.me/918851830081?text=${encodeURIComponent(`Hello ${refLine("Ab3dE6fG")}`)}`);
  });

  it("opt-in pre-types exactly START PROMOTIONS (what the bot understands)", () => {
    const t = buildTarget({ kind: "optin", label: "Lift" }, "Ab3dE6fG", biz) as { target: string };
    expect(decodeURIComponent(t.target.split("text=")[1])).toBe(OPTIN_TEXT);
  });

  it("pages carry utm tags and keep the #anchor last", () => {
    const t = buildTarget({ kind: "page", label: "Flyer", page: "/contact#trial" }, "Ab3dE6fG", biz) as { target: string };
    expect(t.target).toBe("https://www.royalfitnesclub.in/contact?utm_source=qr&utm_medium=print&utm_campaign=Ab3dE6fG#trial");
    expect(buildTarget({ kind: "page", label: "x", page: "https://evil.example" }, "Ab3dE6fG", biz)).toEqual({ error: "Pick a page." });
  });

  it("asks for what is missing", () => {
    expect(buildTarget({ kind: "bot", label: " " }, "c", biz)).toHaveProperty("error");
    expect(buildTarget({ kind: "nope", label: "x" }, "c", biz)).toHaveProperty("error");
    expect(buildTarget({ kind: "review", label: "x" }, "c", { ...biz, reviewUrl: "" })).toHaveProperty("error");
  });

  it("a scan only follows this site, the gym's two numbers and its review link", () => {
    expect(allowedTarget("https://www.royalfitnesclub.in/membership?utm_source=qr", biz)).toBe(true);
    expect(allowedTarget("https://wa.me/918851830081?text=hi", biz)).toBe(true);
    expect(allowedTarget("https://wa.me/919999999999?text=hi", biz)).toBe(false);
    expect(allowedTarget("https://g.page/r/abc/review", biz)).toBe(true);
    expect(allowedTarget("https://g.page/r/other/review", biz)).toBe(false);
    expect(allowedTarget("http://www.royalfitnesclub.in/", biz)).toBe(false);
    expect(allowedTarget("not a url", biz)).toBe(false);
  });

  it("codes are 8 unambiguous characters", () => {
    for (let i = 0; i < 50; i++) expect(newQrCode()).toMatch(/^[A-HJ-NP-Za-km-z2-9]{8}$/);
  });

  it("ref is read only from the end of the message", () => {
    expect(refFromText("Hi (ref Ab3dE6fG)")).toBe("Ab3dE6fG");
    expect(refFromText("(ref Ab3dE6fG) and more")).toBeNull();
    expect(refFromText("hello")).toBeNull();
  });
});
