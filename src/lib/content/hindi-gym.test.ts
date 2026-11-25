import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "./defaults";
import { HI_GYM, hiGymLanguages, hindiHours } from "./hindi-gym";

describe("Hindi gym page", () => {
  it("writes the opening hours in Hindi from the saved hours, so an admin change shows up", () => {
    expect(hindiHours(DEFAULT_CONTENT.business.hours)).toBe("सोमवार से शनिवार: सुबह 5:30 से 11:00 बजे, शाम 4:00 से रात 10:00 बजे। रविवार बंद।");
    const later = [{ label: "Morning", days: "Monday – Saturday", open: "06:00", close: "11:00" }];
    expect(hindiHours(later)).toBe("सोमवार से शनिवार: सुबह 6:00 से 11:00 बजे। रविवार बंद।");
  });

  it("falls back to the English days when they aren't Monday to Saturday", () => {
    const all = [{ label: "All day", days: "Monday – Sunday", open: "05:00", close: "23:00" }];
    expect(hindiHours(all)).toBe("Monday – Sunday: सुबह 5:00 से रात 11:00 बजे।");
  });

  it("links the English home page and the Hindi page as language versions", () => {
    expect(hiGymLanguages()).toEqual({
      "en-IN": "https://www.royalfitnesclub.in/",
      "hi-IN": "https://www.royalfitnesclub.in/hi/gym",
      "x-default": "https://www.royalfitnesclub.in/",
    });
  });

  it("only makes promises the English plans already make", () => {
    const text = JSON.stringify(HI_GYM);
    // No result, cure or guarantee language on a gym page.
    expect(text).not.toMatch(/गारंटी|guarantee|पक्का रिज़ल्ट|100%/i);
  });
});
