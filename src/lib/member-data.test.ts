import { describe, expect, it } from "vitest";
import { addCheckIn, foodCount, foodLogFor, localBelongsTo, mergeCheckIns, shortDate } from "./member-data";

describe("localBelongsTo", () => {
  it("lets signed-out data go to whoever signs in, and nobody else's", () => {
    expect(localBelongsTo(null, "u1")).toBe(true);
    expect(localBelongsTo("u1", "u1")).toBe(true);
    expect(localBelongsTo("u2", "u1")).toBe(false);
  });
});

describe("foodLogFor", () => {
  const items = [{ id: "roti", qty: 2 }];
  it("keeps today's log", () => {
    expect(foodLogFor({ date: "2026-10-29", items }, "2026-10-29")).toEqual({ date: "2026-10-29", items });
  });
  it("starts a fresh list on a new day", () => {
    expect(foodLogFor({ date: "2026-10-28", items }, "2026-10-29")).toEqual({ date: "2026-10-29", items: [] });
  });
  it("reads the old undated format as today's", () => {
    expect(foodLogFor(items, "2026-10-29")).toEqual({ date: "2026-10-29", items });
  });
  it("survives junk", () => {
    expect(foodLogFor(null, "2026-10-29").items).toEqual([]);
    expect(foodLogFor({ date: 5 }, "2026-10-29").items).toEqual([]);
  });
  it("counts both formats", () => {
    expect(foodCount(items)).toBe(1);
    expect(foodCount({ date: "x", items })).toBe(1);
    expect(foodCount(null)).toBe(0);
  });
});

describe("check-ins", () => {
  it("fills in a second measurement on the same day instead of wiping the first", () => {
    const list = addCheckIn([], { date: "2026-10-29", weight: 78.4, waist: 0 });
    expect(addCheckIn(list, { date: "2026-10-29", weight: 0, waist: 88 })).toEqual([{ date: "2026-10-29", weight: 78.4, waist: 88 }]);
  });
  it("replaces a value logged again and keeps dates in order", () => {
    const list = addCheckIn([{ date: "2026-10-30", weight: 78, waist: 0 }], { date: "2026-10-01", weight: 80, waist: 0 });
    expect(addCheckIn(list, { date: "2026-10-30", weight: 77.5, waist: 0 }).map((e) => [e.date, e.weight])).toEqual([["2026-10-01", 80], ["2026-10-30", 77.5]]);
  });
  it("merges signed-out check-ins into the account, the account winning a clash", () => {
    const cloud = [{ date: "2026-10-20", weight: 80, waist: 90 }];
    const local = [{ date: "2026-10-20", weight: 99, waist: 99 }, { date: "2026-10-27", weight: 79, waist: 89 }];
    expect(mergeCheckIns(cloud, local)).toEqual([cloud[0], local[1]]);
  });
});

describe("shortDate", () => {
  it("formats without shifting the day", () => {
    expect(shortDate("2026-10-01", "2026-10-29")).toBe("1 Oct");
    expect(shortDate("2025-12-31", "2026-10-29")).toBe("31 Dec 2025");
    expect(shortDate("junk", "2026-10-29")).toBe("junk");
  });
});
