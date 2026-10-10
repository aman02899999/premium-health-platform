import { NextResponse } from "next/server";
import { isDbConfigured } from "@/health/db";
import { unsubscribe, validUnsubscribe } from "@/lib/growth/marketing";

export const dynamic = "force-dynamic";

const page = (title: string, text: string, status = 200) =>
  new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;color:#0f172a"><main style="max-width:480px;margin:12vh auto;background:#fff;border-radius:16px;padding:32px;text-align:center">
<h1 style="font-size:22px;margin:0 0 12px">${title}</h1><p style="color:#475569;line-height:1.6">${text}</p><p><a href="/" style="color:#04466d">Royal Fitness Club</a></p></main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );

async function handle(req: Request) {
  const u = new URL(req.url);
  const email = (u.searchParams.get("e") || "").trim().toLowerCase();
  const token = u.searchParams.get("t") || "";
  if (!email || !validUnsubscribe(email, token)) return { ok: false as const };
  if (isDbConfigured) await unsubscribe(email);
  return { ok: true as const };
}

/** The link in the email footer. */
export async function GET(req: Request) {
  const r = await handle(req);
  return r.ok ? page("You're unsubscribed", "You won't get any more offers or tips from us by email. Messages about orders you place still reach you.") : page("Link not valid", "This unsubscribe link is broken or incomplete. Reply to any of our emails and we'll remove you by hand.", 400);
}

/** One-click unsubscribe from the mail app (List-Unsubscribe-Post, RFC 8058). */
export async function POST(req: Request) {
  const r = await handle(req);
  return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
}
