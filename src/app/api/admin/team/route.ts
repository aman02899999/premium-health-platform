import { NextResponse } from "next/server";
import { adminIdentity, adminRole } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { ROLES, normEmail } from "@/lib/admin/team-core";
import { addMember, changeRole, listTeam, removeMember, renameMember } from "@/lib/admin/team";

// Team & Agents (owners only; the proxy also blocks everyone else).
// GET                                      the team and the roles
// POST { action: "add", email, name, role }
// POST { action: "role", email, role } | { action: "remove", email } | { action: "rename", email, name }
export const dynamic = "force-dynamic";

async function owner() {
  const role = await adminRole();
  if (!role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "owner") return NextResponse.json({ error: "Only owners can manage the team." }, { status: 403 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  return null;
}

export async function GET() {
  const denied = await owner();
  if (denied) return denied;
  try {
    return NextResponse.json({ team: await listTeam(), roles: ROLES, me: await adminIdentity() });
  } catch (err) {
    console.error("[team]", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load the team. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await owner();
  if (denied) return denied;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const me = (await adminIdentity()).toLowerCase();
  const email = normEmail(b.email);
  try {
    let err: string | null = null;
    if (b.action === "add") err = await addMember(b, me);
    else if (!email) err = "Unknown team member.";
    else if (b.action === "role") err = await changeRole(email, b.role, me);
    else if (b.action === "remove") err = await removeMember(email, me);
    else if (b.action === "rename") await renameMember(email, b.name);
    else err = "Unknown action";
    return err ? NextResponse.json({ error: err }, { status: 400 }) : NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[team] post:", (e as Error).message);
    return NextResponse.json({ error: "Couldn't save. Is the latest database migration applied?" }, { status: 500 });
  }
}
