import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { listTeam } from "@/lib/admin/team";
import { isDbConfigured } from "@/health/db";
import { listChats } from "@/lib/social/chat";

// The admin WhatsApp chat: every conversation, newest first.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    // The team (for "Assign to") and who is looking (for "Mine"); a missing migration only hides assignment.
    const [chats, team, me] = await Promise.all([listChats(), listTeam().catch(() => []), adminIdentity()]);
    return NextResponse.json({ chats, team: team.map((m) => ({ email: m.email, name: m.name })), me: me.toLowerCase() });
  } catch (err) {
    console.error("[chats] list:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load chats. Is the latest database migration applied?" }, { status: 500 });
  }
}
