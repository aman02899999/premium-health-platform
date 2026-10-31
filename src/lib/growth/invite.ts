// Bring-a-friend wording and links. The reward itself is applied in applyPaidOrder (members.ts):
// a friend's first paid membership with a member's code adds REFERRER_BONUS_DAYS to the member
// and REFERRED_BONUS_DAYS to the friend. Everything here only describes that, so keep the two in
// step. Pure: the join page, the receipt and the admin share the text.

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** A member's personal join link, tagged so invites show up as their own source in analytics. */
export function inviteUrl(siteUrl: string, code: string): string {
  return `${siteUrl}/join?ref=${encodeURIComponent(code.trim().toUpperCase())}&utm_source=referral&utm_medium=member&utm_campaign=bring-a-friend`;
}

/** What a member sends a friend (from the receipt's "Invite a friend" button). */
export function inviteForMember({ gymName, url, days }: { gymName: string; url: string; days: number }): string {
  return `I train at ${gymName}. Join with my link and you get ${days} extra days on your first membership (I get ${days} too): ${url}`;
}

/** Shown on /join when someone arrives through a member's link. First name only. */
export function inviteBanner(inviterName: string, days: number): { title: string; body: string } {
  const n = firstName(inviterName);
  return {
    title: n ? `${n} invited you` : "A member invited you",
    body: `Join online with this link and you both get ${days} extra days, added to your first membership automatically.`,
  };
}

/** What the owner sends an existing member from the admin, so desk members get their link too. */
export function memberInviteMessage({ name, gymName, url, days }: { name: string; gymName: string; url: string; days: number }): string {
  const n = firstName(name);
  return `Hi ${n || "there"}, here's your personal invite link for ${gymName}. When a friend joins online with it, you get ${days} extra days and so do they: ${url}`;
}
