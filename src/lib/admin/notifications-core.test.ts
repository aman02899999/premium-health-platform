import { describe, expect, it } from "vitest";
import { clip, forRole, freshSince, unreadCount, type Notice } from "./notifications-core";

const n = (id: string, at: string, href: string, kind: Notice["kind"] = "message"): Notice => ({ id, at, kind, title: id, body: "", href });
const items = [
  n("chat", "2026-10-21T10:00:00Z", "/admin/chats?peer=919811100001"),
  n("pay", "2026-10-21T11:00:00Z", "/admin/website?tab=payments", "payment"),
  n("lead", "2026-10-21T09:00:00Z", "/admin/growth?tab=leads", "lead"),
  n("order", "2026-10-21T08:00:00Z", "/admin/shop", "order"),
];

describe("notifications", () => {
  it("owners see everything, newest first", () => {
    expect(forRole(items, "owner").map((x) => x.id)).toEqual(["pay", "chat", "lead", "order"]);
  });
  it("desk agents only see what they may open", () => {
    expect(forRole(items, "agent").map((x) => x.id)).toEqual(["chat", "lead"]);
  });
  it("counts what's new since last seen", () => {
    expect(unreadCount(items, null)).toBe(4);
    expect(unreadCount(items, "2026-10-21T09:30:00Z")).toBe(2);
  });
  it("alerts only for what arrived since the last poll, at most three", () => {
    expect(freshSince(items, null)).toEqual([]);
    const sorted = forRole(items, "owner");
    expect(freshSince(sorted, "2026-10-21T09:30:00Z").map((x) => x.id)).toEqual(["pay", "chat"]);
    const burst = Array.from({ length: 6 }, (_, i) => n(`m${i}`, `2026-10-21T12:0${i}:00Z`, "/admin/chats"));
    expect(freshSince(burst, "2026-10-21T11:00:00Z")).toHaveLength(3);
  });
  it("clips long text on one line", () => {
    expect(clip("hello\n  there")).toBe("hello there");
    expect(clip("x".repeat(100), 10)).toBe("xxxxxxxxx…");
  });
});
