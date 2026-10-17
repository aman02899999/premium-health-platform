import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { chatThread, sendChatReply, type SendOutcome } from "@/lib/social/chat";
import { QUICK_REPLIES, manualTemplates } from "@/lib/social/chat-actions";
import { contactInfo, pauseBot, saveNotes, sendManualTemplate, sendQuickReply, setLeadStatus, setOptOut } from "@/lib/social/chat-tools";

// One WhatsApp conversation for the coach.
// GET: the messages, who the customer is, one-tap replies and the templates that fit them.
// POST { action, ... }: text | quick | template | pause | notes | lead-status | opt-out.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ peer: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  try {
    const peer = (await params).peer;
    const [thread, contact, biz] = await Promise.all([chatThread(peer), contactInfo(peer), getContent().then((c) => c.business)]);
    return NextResponse.json({
      ...thread,
      contact,
      quickReplies: QUICK_REPLIES.map(({ id, label }) => ({ id, label })),
      templates: manualTemplates(contact, { name: biz.name, phone: biz.phone, siteUrl: SITE_URL }).map(({ kind, label, marketing, preview }) => ({ kind, label, marketing, preview })),
    });
  } catch (err) {
    console.error("[chats] thread:", (err as Error).message);
    return NextResponse.json({ error: "Couldn't load this chat. Is the latest database migration applied?" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Params) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const peer = (await params).peer;
  const by = (await adminIdentity()) || "admin";
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  let res: SendOutcome;
  try {
    switch (b.action ?? "text") {
      case "text":
        res = await sendChatReply(peer, str("text"), by);
        break;
      case "quick":
        res = await sendQuickReply(peer, str("id"), by);
        break;
      case "template":
        res = await sendManualTemplate(peer, str("kind"), by);
        break;
      case "pause":
        // hours: 0 resumes the bot; otherwise pause that long (up to 30 days).
        await pauseBot(peer, Number(b.hours) > 0 ? new Date(Date.now() + Math.min(Number(b.hours), 720) * 3_600_000) : null);
        res = { ok: true };
        break;
      case "notes":
        await saveNotes(peer, str("notes"));
        res = { ok: true };
        break;
      case "lead-status":
        res = await setLeadStatus(peer, str("status"));
        break;
      case "opt-out":
        await setOptOut(peer, b.optedOut === true);
        res = { ok: true };
        break;
      default:
        res = { ok: false, error: "Unknown action", status: 400 };
    }
  } catch (err) {
    console.error("[chats] action:", (err as Error).message);
    res = { ok: false, error: "Something went wrong. Try again.", status: 500 };
  }
  return res.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: res.error }, { status: res.status });
}
