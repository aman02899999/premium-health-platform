import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { entityDescription, seoDescription, seoTitle } from "./seo";
import { UniquePageSEO } from "@/health/components/seo/UniquePageSEO";

describe("health meta helpers", () => {
  it("never adds the brand (the layout template does) and cuts long titles at a word", () => {
    expect(seoTitle("Heart Health Guides")).toBe("Heart Health Guides");
    const t = seoTitle("Thali Builder — Build a Balanced Indian Thali for Diabetes and Weight Loss");
    expect(t).not.toContain("Bharat Health Guide");
    expect(t.length).toBeLessThanOrEqual(38);
    expect(t).not.toMatch(/[\s—]$/);
    expect("Thali Builder — Build a Balanced Indian Thali for Diabetes".startsWith(t)).toBe(true);
  });

  it("caps descriptions at 155 characters on a word boundary", () => {
    const d = seoDescription("word ".repeat(60));
    expect(d.length).toBeLessThanOrEqual(155);
    expect(d.endsWith("word…")).toBe(true);
    expect(seoDescription("Short one.")).toBe("Short one.");
  });

  it("gives short reference summaries a line about what the page covers", () => {
    expect(entityDescription("Burning in the chest", "Symptoms, causes and diet.")).toBe("Burning in the chest. Symptoms, causes and diet.");
    const long = "x".repeat(120);
    expect(entityDescription(long, "Symptoms.")).toBe(long);
  });
});

describe("UniquePageSEO", () => {
  const faqs = [{ q: "Is it free?", a: "Yes." }];
  const html = (props: Parameters<typeof UniquePageSEO>[0]) => renderToStaticMarkup(createElement(UniquePageSEO, props));

  it("emits FAQ markup only when the page shows those FAQs", () => {
    expect(html({ faqs })).not.toContain("FAQPage");
    expect(html({ faqs, faqsVisible: true })).toContain("FAQPage");
  });

  it("never emits retired HowTo markup", () => {
    expect(html({ howTo: { name: "How to", steps: ["a", "b"] } })).not.toContain("HowTo");
  });

  it("still emits breadcrumbs", () => {
    expect(html({ breadcrumbs: [{ name: "Home", item: "/health" }] })).toContain("BreadcrumbList");
  });
});
