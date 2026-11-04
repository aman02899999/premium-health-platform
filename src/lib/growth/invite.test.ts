import { describe, expect, it } from "vitest";
import { REFERRED_BONUS_DAYS, REFERRER_BONUS_DAYS } from "./config";
import { inviteBanner, inviteForMember, inviteUrl, memberInviteMessage } from "./invite";

describe("bring-a-friend invites", () => {
  it("the wording says \"you both get N days\", so both rewards must stay equal", () => {
    expect(REFERRER_BONUS_DAYS).toBe(REFERRED_BONUS_DAYS);
  });

  it("builds a tagged join link with the member's code", () => {
    expect(inviteUrl("https://www.royalfitnesclub.in", "rfc-aman-7k2q")).toBe(
      "https://www.royalfitnesclub.in/join?ref=RFC-AMAN-7K2Q&utm_source=referral&utm_medium=member&utm_campaign=bring-a-friend",
    );
  });

  it("the friend's message names the real reward and that it's for new members", () => {
    const t = inviteForMember({ gymName: "Royal Fitness Club", url: "https://x/join?ref=AB12", days: 7 });
    expect(t).toContain("7 extra days");
    expect(t).toContain("https://x/join?ref=AB12");
    expect(t).toMatch(/first membership/i);
  });

  it("the join-page banner shows only the inviter's first name", () => {
    const b = inviteBanner("Rahul Kumar Sharma", 7);
    expect(b.title).toBe("Rahul invited you");
    expect(b.title).not.toContain("Sharma");
    expect(b.body).toContain("7 extra days");
  });

  it("an empty name still reads naturally", () => {
    expect(inviteBanner("  ", 7).title).toBe("A member invited you");
  });

  it("the owner's message to a member explains how the link works", () => {
    const m = memberInviteMessage({ name: "Priya S", gymName: "Royal Fitness Club", url: "https://x/join?ref=PRIYA22", days: 7 });
    expect(m).toMatch(/^Hi Priya,/);
    expect(m).toContain("https://x/join?ref=PRIYA22");
    expect(m).toContain("7 extra days");
  });
});
