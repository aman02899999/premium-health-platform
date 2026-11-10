import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FESTIVE_2026 } from "@/lib/offers";
import { addDays } from "./dates";
import { dailyPost } from "./daily-posts";
import { GALLERY, PLANS, cardNote, cardPost, monthDay, reelPhoto, secondReelPost } from "./month-plan";

const biz = { name: "Royal Fitness Club", phone: "+91 88518 30081", siteUrl: "https://www.royalfitnesclub.in", coach: "Coach Aman Sharma", membershipFrom: 1500, address: "Main Road, Gejha Village, Sector 93, Noida 201304" };
const FIRST = PLANS[0].start;
const last = PLANS[PLANS.length - 1];
const END = addDays(last.start, last.days); // the first day after the last plan
const CARDS = PLANS.flatMap((p) => p.cards);
const days = PLANS.flatMap((p) => Array.from({ length: p.days }, (_, i) => addDays(p.start, i)));
const all = days.flatMap((d) => (["am", "pm"] as const).map((s) => cardPost(d, s, biz, [FESTIVE_2026])!));

describe("month plan", () => {
  it("runs every day of every plan: two cards and a second Reel a day, nothing before or after", () => {
    expect(monthDay(addDays(FIRST, -1))).toBeNull();
    expect(monthDay(END)).toBeNull();
    expect(cardPost(addDays(FIRST, -1), "am", biz, [])).toBeNull();
    expect(cardPost(END, "pm", biz, [])).toBeNull();
    expect(secondReelPost(END, biz)).toBeNull();
    expect(all.every(Boolean)).toBe(true);
    expect(days.every((d) => secondReelPost(d, biz))).toBe(true);
  });

  it("plans follow each other with no gap or overlap", () => {
    for (let i = 1; i < PLANS.length; i++) expect(PLANS[i].start).toBe(addDays(PLANS[i - 1].start, PLANS[i - 1].days));
  });

  it("December runs 1–31 Dec 2026 and starts on its own first card", () => {
    expect(PLANS.map((p) => [p.start, p.days])).toContainEqual(["2026-12-01", 31]);
    expect(cardPost("2026-12-01", "am", biz, [])!.card.id).toBe("winter-warm-up");
    expect(cardPost("2026-12-31", "pm", biz, [])!.card.id).toBe("first-week-january");
    expect(monthDay("2026-12-31")).toBe(30);
  });

  it("uses every card exactly once, across all months", () => {
    for (const p of PLANS) expect(p.cards, p.start).toHaveLength(p.days * 2);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
    expect(new Set(all.map((p) => p.card.id)).size).toBe(CARDS.length);
  });

  it("every card fits its layout and carries a lesson", () => {
    for (const c of CARDS) {
      expect(c.sections.length === 1 || (c.sections.length >= 2 && c.sections.length <= 6)).toBe(true);
      if (c.sections.length > 1) for (const s of c.sections) expect(s.head, c.id).toBeTruthy();
      for (const s of c.sections) expect(s.rows.length, c.id).toBeLessThanOrEqual(c.sections.length === 1 ? 7 : 4);
      expect(c.footer.length, c.id).toBeLessThanOrEqual(80);
      expect(c.title.every((t) => t.length <= 19), c.id).toBe(true);
    }
  });

  it("health rules: medical cards carry the note, no supplement or medicine doses, no cure claims", () => {
    for (const p of all) {
      const text = `${p.instagram}\n${JSON.stringify(p.card.sections)}`;
      expect(text, p.card.id).not.toMatch(/\bcures?\b|guarantee/i);
      expect(text, p.card.id).not.toMatch(/\d\s*(mg|mcg|iu)\b/i);
      if (p.card.medical) expect(p.instagram).toContain("not medical advice");
    }
    const supp = CARDS.find((c) => c.id === "supplement-truth")!;
    expect(JSON.stringify(supp.sections)).toContain("as advised by your doctor");
  });

  it("numbers that are health facts name a source", () => {
    for (const c of CARDS.filter((c) => /SCIENCE|HEALTH CHECK/.test(c.series))) expect(c.source, c.id).toBeTruthy();
  });

  it("the card's small print shows its source and medical note, and never a food note on a training card", () => {
    for (const c of CARDS) {
      const note = cardNote(c);
      if (c.source) expect(note, c.id).toContain(`Source: ${c.source}`);
      if (c.medical) expect(note, c.id).toContain("not medical advice");
      if (c.goal !== "diet") expect(note, c.id).not.toMatch(/portions/i);
    }
  });

  it("calls to action: the festive offer while it runs, the diet trial, and the calls number", () => {
    const join = all.find((p) => p.card.goal === "join")!;
    expect(join.cta.headline).toBe("Festive Offer: bonus days on every plan");
    expect(join.cta.sub).toContain("88518 30081");
    expect(join.links.facebook).toBe(`https://www.royalfitnesclub.in/membership?utm_source=facebook&utm_medium=social&utm_campaign=month-plan&utm_content=${join.date}-${join.slot}`);
    const diet = all.find((p) => p.card.goal === "diet")!;
    expect(diet.cta.headline).toContain("₹49");
    expect(diet.links.instagram).toMatch(/\/diet-chart\?plan=trial&utm_source=instagram.*#order$/);
    // Once the offer is over, membership cards fall back to the free trial session.
    const after = cardPost(join.date, join.slot, biz, [{ ...FESTIVE_2026, endsOn: addDays(join.date, -1) }])!;
    expect(after.cta.headline).toMatch(/free trial session/i);
    for (const p of all) {
      expect(p.instagram).toContain("link in bio");
      expect(p.instagram).not.toMatch(/https?:\/\//); // links don't work in Instagram captions
      expect(p.instagram).toContain("88518 30081");
      expect(p.instagram).not.toContain("92668"); // the bot number never goes in posts
      expect(p.facebook).toContain(p.links.facebook);
      expect(p.instagram.length).toBeLessThanOrEqual(2200);
      expect((p.instagram.match(/#\w+/g) ?? []).length).toBeLessThanOrEqual(30);
    }
  });

  it("photos: only the coach's gallery, a different one for the two cards of a day", () => {
    for (const f of GALLERY) expect(existsSync(join(process.cwd(), "public/gallery", f)), f).toBe(true);
    for (let i = 0; i < all.length; i += 2) expect(all[i].photo).not.toBe(all[i + 1].photo);
    for (const d of days) expect(GALLERY).toContain(reelPhoto(d));
  });

  it("the second Reel never repeats the evening Reel's content during the month, and is tagged with today", () => {
    for (const p of PLANS) {
      const month = Array.from({ length: p.days }, (_, i) => addDays(p.start, i));
      // Shop posts repeat the same product title week to week by design (the evening Reel does
      // too), so only tips and offers count as repeats.
      const evening = new Set(month.map((d) => dailyPost(d, biz)).filter((x) => x.category !== "Shop").map((x) => x.title));
      for (const d of month) {
        const r = secondReelPost(d, biz)!;
        if (r.category !== "Shop") expect(evening.has(r.title), d).toBe(false);
      }
    }
    for (const d of days) {
      const r = secondReelPost(d, biz)!;
      expect(r.date).toBe(d);
      expect(r.facebook).not.toMatch(/daily-\d{4}-\d{2}-\d{2}(?!-reel2)/);
    }
  });

  it("every daily caption (both cards and both Reels) has a description, CTA, keywords and 10–15 hashtags", () => {
    const captions = days.flatMap((d) => {
      const r2 = secondReelPost(d, biz)!;
      const evening = dailyPost(d, biz);
      const cards = all.filter((p) => p.date === d);
      return [...cards, r2, evening].flatMap((p) => [
        { id: `${d} ${p.theme} ig`, text: p.instagram, ig: true },
        { id: `${d} ${p.theme} fb`, text: p.facebook, ig: false },
      ]);
    });
    expect(captions).toHaveLength(days.length * 8);
    for (const c of captions) {
      const tags = (c.text.match(/(?:^|\s)#\w+/g) ?? []).map((t) => t.trim()); // not the "#order" in links
      expect(tags.length, c.id).toBeGreaterThanOrEqual(10);
      expect(tags.length, c.id).toBeLessThanOrEqual(15);
      expect(new Set(tags.map((t) => t.toLowerCase())).size, c.id).toBe(tags.length);
      expect(c.text, c.id).toMatch(/^.+\n\n.{30,}/); // hook, then a real description
      expect(c.text, c.id).toMatch(/👉 .{10,}/);
      expect(c.text, c.id).toMatch(/🔎 .*Gym in Sector 93 Noida/);
      expect(c.text, c.id).toContain("88518 30081");
      expect(c.text.length, c.id).toBeLessThanOrEqual(2200);
      if (c.ig) expect(c.text, c.id).toContain("link in bio");
      else expect(c.text, c.id).toMatch(/🔗 https:\/\/www\.royalfitnesclub\.in\/.*utm_source=facebook/);
    }
  });
});
