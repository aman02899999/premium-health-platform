import { describe, expect, it } from "vitest";
import BUNDLE from "@/health/data/disease-drafts.generated.json";
import { DISEASES } from "@/health/data/diseases-index";
import { DISEASE_REWRITES } from "@/health/data/diseases-rewrites";
import { INDEXED_DISEASES } from "./content-quality";
import { draftHash, draftWords, parseApproval, parseChangeNote, publicReviewLine, reviewState, type DraftEntry, type ReviewRow } from "./disease-review-core";

const drafts = BUNDLE as unknown as Record<string, DraftEntry>;
const [slug, entry] = Object.entries(drafts)[0]!;
const row = (over: Partial<ReviewRow> = {}): ReviewRow => ({ slug, status: "approved", draftHash: draftHash(entry.draft), reviewerName: "Dr Asha Verma", reviewerQualification: "MBBS, MD", note: "", reviewedAt: "2026-11-21T05:00:00Z", ...over });

describe("the bundled drafts", () => {
  it("are real disease pages that are not already hand-written or indexed", () => {
    const known = new Set(DISEASES.map((d) => d.slug));
    for (const s of Object.keys(drafts)) {
      expect([s, known.has(s)]).toEqual([s, true]);
      expect([s, s in DISEASE_REWRITES || INDEXED_DISEASES.has(s)]).toEqual([s, false]);
    }
  });

  it("each has sources, safety sections and enough text for a reviewer", () => {
    for (const [s, e] of Object.entries(drafts)) {
      expect([s, e.draft.references.length >= 3]).toEqual([s, true]);
      expect([s, e.draft.emergencySigns.length >= 3 && e.draft.whenToSeeDoctor.length >= 3]).toEqual([s, true]);
      expect([s, draftWords(e.draft) >= 1200]).toEqual([s, true]);
    }
  });
});

describe("review state", () => {
  it("is waiting with no review, approved while the text matches, and outdated once the text changes", () => {
    expect(reviewState(entry, undefined)).toBe("waiting");
    expect(reviewState(entry, row())).toBe("approved");
    expect(reviewState(entry, row({ status: "changes" }))).toBe("changes");
    const edited = { ...entry, draft: { ...entry.draft, definition: `${entry.draft.definition} Extra.` } };
    expect(reviewState(edited, row())).toBe("outdated");
  });
});

describe("approval input", () => {
  const good = { reviewerName: "Dr Asha Verma", reviewerQualification: "MBBS, MD", reviewerRegistration: "DMC/12345", confirm: true };
  it("needs a doctor's name, qualification, registration and the confirmation tick", () => {
    expect(parseApproval(good)).toEqual({ ok: true, value: { reviewerName: "Dr Asha Verma", reviewerQualification: "MBBS, MD", reviewerRegistration: "DMC/12345" } });
    expect(parseApproval({ ...good, reviewerName: "Asha Verma" }).ok).toBe(false);
    expect(parseApproval({ ...good, reviewerQualification: "" }).ok).toBe(false);
    expect(parseApproval({ ...good, reviewerRegistration: "1" }).ok).toBe(false);
    expect(parseApproval({ ...good, confirm: "yes" }).ok).toBe(false);
    expect(parseApproval({ ...good, reviewerName: `Dr ${"x".repeat(90)}` }).ok).toBe(false);
  });
  it("needs a note to ask for changes", () => {
    expect(parseChangeNote({ note: "  " }).ok).toBe(false);
    expect(parseChangeNote({ note: "Remove the line about fasting." })).toEqual({ ok: true, note: "Remove the line about fasting." });
  });
  it("shows the name and qualification publicly, never the registration number", () => {
    expect(publicReviewLine(row())).toBe("Medically reviewed by Dr Asha Verma, MBBS, MD on 21 Nov 2026");
  });
});
