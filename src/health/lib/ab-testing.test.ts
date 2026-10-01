import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  assignVariant,
  readVariant,
  trackABEvent,
  getABStats,
  getAllABStats,
  getExperiment,
  CTA_EXPERIMENTS,
  subscribeABVariant,
  type ABVariant,
} from "./ab-testing";

/** Minimal in-memory localStorage so the node test env can emulate a browser. */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string): string | null {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, String(v));
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  clear(): void {
    this.map.clear();
  }
}

let store: MemoryStorage;

function installBrowser(): void {
  store = new MemoryStorage();
  (globalThis as unknown as { window: unknown }).window = { localStorage: store };
}

function uninstallBrowser(): void {
  delete (globalThis as unknown as { window?: unknown }).window;
}

beforeEach(() => {
  installBrowser();
});

afterEach(() => {
  uninstallBrowser();
  vi.restoreAllMocks();
});

describe("ab-testing config", () => {
  it("defines 3 CTA experiments with A/B/C variants", () => {
    expect(CTA_EXPERIMENTS).toHaveLength(3);
    expect(CTA_EXPERIMENTS.map((e) => e.id)).toEqual(["cta-disease", "cta-nutrition", "cta-blog"]);
    for (const exp of CTA_EXPERIMENTS) {
      expect(exp.variants.map((v) => v.id)).toEqual(["A", "B", "C"]);
      const total = Object.values(exp.trafficSplit).reduce((a, b) => a + b, 0);
      expect(total).toBe(100);
    }
  });
});

describe("assignVariant", () => {
  it("is deterministic on the server (always control variant A)", () => {
    uninstallBrowser();
    // Even with randomness that would pick B/C, SSR must not randomise.
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(assignVariant("cta-disease")).toBe("A");
    expect(assignVariant("cta-nutrition")).toBe("A");
  });

  it("never writes to storage during SSR", () => {
    uninstallBrowser();
    assignVariant("cta-disease");
    installBrowser();
    expect(readVariant("cta-disease")).toBeNull();
  });

  it("respects the weighted traffic split (34/33/33)", () => {
    const pick = (random: number): ABVariant => {
      store.clear();
      vi.spyOn(Math, "random").mockReturnValue(random);
      return assignVariant("cta-disease");
    };
    expect(pick(0.1)).toBe("A"); // roll 10  -> A (0-34)
    expect(pick(0.5)).toBe("B"); // roll 50  -> B (34-67)
    expect(pick(0.9)).toBe("C"); // roll 90  -> C (67-100)
  });

  it("is sticky — a second call returns the bucketed variant", () => {
    store.clear();
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const first = assignVariant("cta-blog");
    // Even with randomness that would now choose A, the stored variant wins.
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    expect(assignVariant("cta-blog")).toBe(first);
    expect(readVariant("cta-blog")).toBe(first);
  });

  it("returns control for an unknown experiment", () => {
    expect(assignVariant("does-not-exist")).toBe("A");
    expect(getExperiment("does-not-exist")).toBeUndefined();
  });
});

describe("readVariant", () => {
  it("returns null before the visitor is bucketed", () => {
    expect(readVariant("cta-disease")).toBeNull();
  });

  it("buckets a first-time visitor on subscribe (post-hydration)", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeABVariant("cta-disease", onChange);

    expect(readVariant("cta-disease")).not.toBeNull();
    expect(onChange).toHaveBeenCalled();

    // A returning visitor is not re-bucketed and triggers no change event.
    const second = vi.fn();
    const unsubscribe2 = subscribeABVariant("cta-disease", second);
    expect(second).not.toHaveBeenCalled();

    unsubscribe();
    unsubscribe2();
  });
});

describe("trackABEvent", () => {
  it("caps stored events at 500 per experiment", () => {
    store.clear();
    for (let i = 0; i < 600; i++) {
      trackABEvent({ experimentId: "cta-disease", variant: "A", type: "impression" });
    }
    const raw = store.getItem("bhg-ab-events-cta-disease");
    const events = JSON.parse(raw!);
    expect(events).toHaveLength(500);
  });

  it("keeps the most recent events when trimming", () => {
    store.clear();
    for (let i = 0; i < 505; i++) {
      trackABEvent({
        experimentId: "cta-nutrition",
        variant: "B",
        type: "click",
        label: `click-${i}`,
      });
    }
    const events = JSON.parse(store.getItem("bhg-ab-events-cta-nutrition")!);
    expect(events).toHaveLength(500);
    expect(events[events.length - 1].label).toBe("click-504");
    expect(events[0].label).toBe("click-5");
  });
});

describe("getABStats", () => {
  it("computes impressions, clicks, CTR and conversion rate", () => {
    store.clear();
    for (let i = 0; i < 20; i++) {
      trackABEvent({ experimentId: "cta-disease", variant: "B", type: "impression" });
    }
    for (let i = 0; i < 5; i++) {
      trackABEvent({ experimentId: "cta-disease", variant: "B", type: "click" });
    }
    trackABEvent({ experimentId: "cta-disease", variant: "B", type: "conversion" });

    const stats = getABStats("cta-disease")!;
    const b = stats.variants.find((v) => v.variant === "B")!;

    expect(b.impressions).toBe(20);
    expect(b.clicks).toBe(5);
    expect(b.conversions).toBe(1);
    expect(b.ctr).toBe(25); // 5/20
    expect(b.convRate).toBe(20); // 1/5
    expect(stats.winner).toBe("B");
    expect(stats.significant).toBe(true);
  });

  it("does not declare a winner before the impression threshold", () => {
    store.clear();
    for (let i = 0; i < 5; i++) {
      trackABEvent({ experimentId: "cta-blog", variant: "C", type: "impression" });
    }
    trackABEvent({ experimentId: "cta-blog", variant: "C", type: "click" });

    const stats = getABStats("cta-blog")!;
    expect(stats.totalImpressions).toBe(5);
    expect(stats.significant).toBe(false);
    expect(stats.winner).toBeNull();
  });

  it("reports zeroed metrics with no winner when there is no data", () => {
    store.clear();
    const stats = getABStats("cta-nutrition")!;
    expect(stats.totalImpressions).toBe(0);
    expect(stats.winner).toBeNull();
    expect(stats.variants.every((v) => v.ctr === 0 && v.convRate === 0)).toBe(true);
  });

  it("returns null for an unknown experiment", () => {
    expect(getABStats("nope")).toBeNull();
  });

  it("getAllABStats covers every experiment", () => {
    expect(getAllABStats()).toHaveLength(CTA_EXPERIMENTS.length);
  });
});
