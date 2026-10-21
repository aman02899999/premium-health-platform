import { describe, expect, it } from "vitest";
import { buildCallList, contactKey, whyLine, type Facts, type Signal } from "./call-list-core";

const now = new Date("2026-10-21T10:00:00Z");
const h = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();
const sig = (s: Partial<Signal>): Signal => ({ contact: "9811100001", phone: "9811100001", email: null, name: "Rahul", type: "replied", at: h(2), campaign: "Diwali offer", text: "price?", ...s });
const facts = (f: Partial<Facts>): Facts => ({ activeMember: false, paidAt: null, optedOut: false, leadStatus: null, humanReplyAt: null, calls: [], ...f });

describe("call list", () => {
  it("one row per person, replies first, then the most recent", () => {
    const list = buildCallList(
      [
        sig({ contact: "a", type: "clicked", at: h(1) }),
        sig({ contact: "b", type: "replied", at: h(5) }),
        sig({ contact: "a", type: "replied", at: h(10), text: "kitna hai" }),
        sig({ contact: "c", type: "replied", at: h(3) }),
      ],
      new Map(),
      now,
    );
    expect(list.map((p) => [p.contact, p.type])).toEqual([
      ["c", "replied"],
      ["b", "replied"],
      ["a", "replied"],
    ]);
    expect(list[2].why).toBe("Replied to “Diwali offer”: “kitna hai”");
  });

  it("drops anything older than 3 days", () => {
    expect(buildCallList([sig({ at: h(73) })], new Map(), now)).toEqual([]);
  });

  it.each([
    ["an active member", facts({ activeMember: true })],
    ["someone who opted out", facts({ optedOut: true })],
    ["a lead who joined", facts({ leadStatus: "joined" })],
    ["a lead marked lost", facts({ leadStatus: "lost" })],
    ["someone who paid this week", facts({ paidAt: h(30) })],
    ["someone a coach already wrote to", facts({ humanReplyAt: h(1) })],
    ["someone already called", facts({ calls: [{ at: h(1), outcome: "interested" }] })],
    ["someone not interested", facts({ calls: [{ at: h(1), outcome: "not-interested" }] })],
    ["no answer a few hours ago", facts({ calls: [{ at: h(1.5), outcome: "no-answer" }] })],
  ])("leaves out %s", (_, f) => {
    expect(buildCallList([sig({ at: h(2) })], new Map([["9811100001", f]]), now)).toEqual([]);
  });

  it("keeps people whose earlier history doesn't matter any more", () => {
    const f = facts({ paidAt: h(24 * 30), humanReplyAt: h(30), leadStatus: "contacted", calls: [{ at: h(40), outcome: "not-interested" }] });
    expect(buildCallList([sig({ at: h(2) })], new Map([["9811100001", f]]), now)).toHaveLength(1);
  });

  it("brings back a no-answer the next day, up to three tries", () => {
    const once = facts({ calls: [{ at: h(21), outcome: "no-answer" }] });
    expect(buildCallList([sig({ at: h(30) })], new Map([["9811100001", once]]), now)[0].tries).toBe(1);
    const thrice = facts({ calls: [h(70), h(50), h(25)].map((at) => ({ at, outcome: "no-answer" as const })) });
    expect(buildCallList([sig({ at: h(71) })], new Map([["9811100001", thrice]]), now)).toEqual([]);
  });

  it("describes a click", () => {
    expect(whyLine({ type: "clicked", campaign: "Diwali offer", text: "" })).toBe("Clicked the link in “Diwali offer”");
  });

  it("keys people by mobile or email", () => {
    expect(contactKey("919811100001")).toBe("9811100001");
    expect(contactKey("+91 98111 00001")).toBe("9811100001");
    expect(contactKey(" Priya@Mail.com ")).toBe("priya@mail.com");
    expect(contactKey("12345")).toBeNull();
    expect(contactKey("not an email@")).toBeNull();
  });
});
