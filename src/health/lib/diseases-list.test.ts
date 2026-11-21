import { describe, expect, it, vi } from "vitest";
import BUNDLE from "@/health/data/disease-drafts.generated.json";

vi.mock("server-only", () => ({}));
const approved = vi.hoisted(() => ({ slugs: [] as string[] }));
vi.mock("@/health/lib/disease-reviews", () => ({ approvedDiseaseSlugs: async () => approved.slugs }));

import DiseasesPage from "@/app/(health)/health/diseases/page";
import { diseaseIndexable } from "./content-quality";

const listed = async () => ((await DiseasesPage()).props as { diseases: { slug: string }[] }).diseases.map((d) => d.slug);
const draftSlug = Object.keys(BUNDLE)[0]!;

describe("Diseases list", () => {
  it("shows only hand-written guides while nothing is approved", async () => {
    approved.slugs = [];
    const slugs = await listed();
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs.every((s) => diseaseIndexable(s))).toBe(true);
    expect(slugs).not.toContain(draftSlug);
  });

  it("adds a draft once a doctor approves it", async () => {
    approved.slugs = [draftSlug];
    expect(await listed()).toContain(draftSlug);
  });
});
