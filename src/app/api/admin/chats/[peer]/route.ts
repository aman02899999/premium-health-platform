import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { chatThread, sendChatReply } from "@/lib/social/chat";

// One WhatsApp conversation: GET the messages, POST { text } to reply as the coach.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ peer: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    return NextResponse.json(await chatThread((await params).peer));
  } catch (err) {
    console.error("[chats] thread:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load this chat" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as { text?: unknown } | null;
  if (typeof b?.text !== "string") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const res = await sendChatReply((await params).peer, b.text, (await adminIdentity()) || "admin");
  return res.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: res.error }, { status: res.status });
}
