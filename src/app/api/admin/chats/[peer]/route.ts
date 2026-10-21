import { NextResponse } from "next/server";
import { adminIdentity, isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { chatThread, sendChatReply, type SendOutcome } from "@/lib/social/chat";
import { QUICK_REPLIES, manualTemplates } from "@/lib/social/chat-actions";
import { assignChat } from "@/lib/admin/team";
import { cancelRequest, createRequest, requestsFor } from "@/lib/payments/requests";
import { PURPOSES, requestMessage } from "@/lib/payments/requests-core";
import { peerId } from "@/lib/social/chat-window";
import { contactInfo, pauseBot, saveNotes, sendManualTemplate, sendQuickReply, setLeadStatus, setOptOut } from "@/lib/social/chat-tools";

// One WhatsApp conversation for the coach.
// GET: the messages, who the customer is, one-tap replies and the templates that fit them.
// POST { action, ... }: text | quick | template | pause | notes | lead-status | opt-out | assign | pay-link | pay-cancel.
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
      // Payment requests for this number (empty before the migration is applied).
      payments: await requestsFor(peer).catch(() => []),
      purposes: PURPOSES,
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
  // A payment link: made first, then sent in the chat. The link is returned either way, so the
  // desk can copy it if WhatsApp's 24-hour window is closed.
  if (b.action === "pay-link") {
    try {
      const contact = await contactInfo(peer);
      const r = await createRequest({ purpose: b.purpose, amount: b.amount, peer, name: contact.name }, by);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      const biz = (await getContent()).business;
      const sent = await sendChatReply(peer, requestMessage({ purpose: r.request.purpose, rupees: r.request.rupees, url: r.request.url, gym: biz.name }), by);
      return NextResponse.json({ ok: true, url: r.request.url, sent: sent.ok, sendError: sent.ok ? null : sent.error });
    } catch (err) {
      console.error("[chats] pay-link:", (err as Error).message);
      return NextResponse.json({ error: "Couldn't create the payment link. Is the latest database migration applied?" }, { status: 500 });
    }
  }
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
      case "assign": {
        // email: a team member's email, or "" to unassign.
        const to = str("email").trim().toLowerCase();
        const err = await assignChat(peerId(peer), to || null);
        res = err ? { ok: false, error: err, status: 400 } : { ok: true };
        break;
      }
      case "pay-cancel":
        res = (await cancelRequest(str("id"))) ? { ok: true } : { ok: false, error: "That link is already paid or cancelled.", status: 400 };
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
