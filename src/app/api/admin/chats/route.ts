import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { listChats } from "@/lib/social/chat";

// The admin WhatsApp chat: every conversation, newest first.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    return NextResponse.json({ chats: await listChats() });
  } catch (err) {
    console.error("[chats] list:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load chats. Is the latest database migration applied?" }, { status: 500 });
  }
}
