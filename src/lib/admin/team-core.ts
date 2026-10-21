// Team & Agents: who may open which admin area. Pure, so the proxy (which guards every admin
// request), the Command Center (which hides tiles) and the tests all use the same rules.

export type Role = "owner" | "manager" | "agent";
export const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "owner", label: "Owner", hint: "Everything, including adding and removing team members" },
  { id: "manager", label: "Manager", hint: "Everything except the team page" },
  { id: "agent", label: "Desk agent", hint: "WhatsApp chats, contacts, leads, members, today's tasks and call list, QR codes" },
];
export const isRole = (r: unknown): r is Role => ROLES.some((x) => x.id === r);

// Areas by path prefix. Order doesn't matter: the longest matching prefix decides.
const OWNER_ONLY = ["/admin/team", "/api/admin/team"];
const AGENT_AREAS = [
  "/admin/login",
  "/api/admin/login",
  "/api/admin/logout",
  "/admin/chats",
  "/api/admin/chats",
  "/admin/contacts",
  "/api/admin/contacts",
  "/admin/growth",
  "/api/admin/growth",
  "/api/admin/members",
  "/api/admin/leads",
  "/api/admin/call-list",
  "/api/admin/notifications",
  "/admin/qr",
  "/api/admin/qr",
  "/api/admin/me",
];

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** May this role open this admin path? Non-admin paths are always allowed (the pages guard themselves). */
export function allowed(role: Role, pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (!under(path, "/admin") && !under(path, "/api/admin")) return true;
  if (OWNER_ONLY.some((p) => under(path, p))) return role === "owner";
  if (role !== "agent") return true;
  // Agents: the Command Center home, and their areas.
  return path === "/admin" || AGENT_AREAS.some((p) => under(path, p));
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const normEmail = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  return EMAIL.test(e) && e.length <= 120 ? e : null;
};

export type Member = { email: string; name: string; role: Role; createdAt: string; addedBy: string };

/**
 * Whether a change to the team is safe: there must always be at least one owner, and nobody
 * may remove or demote themselves (another owner has to do it, so you can't lock yourself out).
 */
export function teamChangeError(team: Member[], me: string, change: { kind: "remove" | "role"; email: string; role?: Role }): string | null {
  const target = team.find((m) => m.email === change.email);
  if (!target) return "That person isn't on the team.";
  if (change.email === me) return change.kind === "remove" ? "You can't remove yourself. Ask another owner." : "You can't change your own role. Ask another owner.";
  const owners = team.filter((m) => m.role === "owner").length;
  const losesOwner = target.role === "owner" && (change.kind === "remove" || change.role !== "owner");
  if (losesOwner && owners <= 1) return "There must always be at least one owner.";
  return null;
}

export const initials = (name: string, email: string) =>
  (name.trim() || email)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
