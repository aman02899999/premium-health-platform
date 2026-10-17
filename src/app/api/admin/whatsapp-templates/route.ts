import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { STOP_PROMOTIONS, TEMPLATES, templateBody, type MessageKind } from "@/lib/growth/messages";

// One-time setup page: /api/admin/whatsapp-templates (sign in to /admin first).
// GET shows which of the site's WhatsApp templates exist in Meta and their review status.
// POST (the button) submits every missing one to Meta for review.
// Needs WHATSAPP_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID (the WABA id, not the phone number id).

export const dynamic = "force-dynamic";

const API = () => (process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v21.0").replace(/\/$/, "");
const LANG = () => process.env.WHATSAPP_TEMPLATE_LANG || "en";
const WABA = () => process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";

// Sample values Meta needs for review, in {{n}} order.
const SAMPLES: Record<MessageKind, string[]> = {
  "renew-7": ["Rahul", "Quarterly", "Royal Fitness Club", "23 Oct 2026", "https://www.royalfitnesclub.in/join?renew=abc"],
  "renew-1": ["Rahul", "Quarterly", "Royal Fitness Club", "23 Oct 2026", "https://www.royalfitnesclub.in/join?renew=abc"],
  "expired-3": ["Rahul", "Quarterly", "Royal Fitness Club", "20 Oct 2026", "https://www.royalfitnesclub.in/join?renew=abc"],
  welcome: ["Rahul", "Quarterly", "Royal Fitness Club", "23 Jan 2027", "RAHUL-4821"],
  "lead-0": ["Rahul", "Royal Fitness Club", "8851830081"],
  "lead-2": ["Rahul", "Royal Fitness Club"],
  "lead-5": ["Rahul", "Royal Fitness Club", "https://www.royalfitnesclub.in/membership"],
  "trial-offer": ["Rahul", "Royal Fitness Club", "https://www.royalfitnesclub.in/contact#trial"],
  comeback: ["Rahul", "Royal Fitness Club", "Quarterly", "https://www.royalfitnesclub.in/join?renew=abc"],
  "diet-received": ["Rahul", "Royal Fitness Club", "24 hours"],
  "call-followup": ["Rahul", "Royal Fitness Club", "https://www.royalfitnesclub.in/membership"],
  "referral-bonus": ["Rahul", "Priya", "Royal Fitness Club", "7", "30 Nov 2026"],
  "diet-plan-ready": ["Rahul", "fat-loss diet plan", "Royal Fitness Club"],
};

// Needs a PDF header sample uploaded through Meta's file API; create it by hand in WhatsApp Manager.
const MANUAL: MessageKind[] = ["diet-plan-ready"];


type Remote = { name: string; status: string; language: string; category: string };

async function graph(path: string, init?: RequestInit) {
  const res = await fetch(`${API()}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function remoteTemplates(): Promise<Remote[]> {
  const { ok, json } = await graph(`/${WABA()}/message_templates?fields=name,status,language,category&limit=250`);
  if (!ok) throw new Error(json?.error?.message || "Couldn't read templates from Meta");
  return json.data ?? [];
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function page(rows: { name: string; status: string; note: string }[], message = "") {
  const missing = rows.some((r) => r.status === "MISSING");
  const color = (s: string) => (s === "APPROVED" ? "#16a34a" : s === "MISSING" || s === "REJECTED" ? "#dc2626" : "#ca8a04");
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WhatsApp templates</title></head>
<body style="font-family:system-ui,sans-serif;background:#0b0b0f;color:#eee;max-width:760px;margin:24px auto;padding:0 16px">
<h1 style="color:#e8b23a">WhatsApp templates</h1>
<p style="color:#aaa">Language <b>${esc(LANG())}</b> · Account <b>${esc(WABA())}</b>. Meta usually reviews within minutes to a few hours. Refresh this page to see the latest status.</p>
${message ? `<p style="background:#15151c;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(message)}</p>` : ""}
<table style="width:100%;border-collapse:collapse">${rows
      .map((r) => `<tr><td style="padding:8px;border-bottom:1px solid #222"><code>${esc(r.name)}</code></td><td style="padding:8px;border-bottom:1px solid #222;color:${color(r.status)};font-weight:bold">${esc(r.status)}</td><td style="padding:8px;border-bottom:1px solid #222;color:#aaa">${esc(r.note)}</td></tr>`)
      .join("")}</table>
${missing ? `<form method="post" style="margin-top:20px"><button style="background:#e8b23a;color:#000;border:0;border-radius:10px;padding:14px 24px;font-weight:bold;font-size:16px;cursor:pointer">Create missing templates</button></form>` : `<p style="margin-top:20px;color:#16a34a">Nothing missing.</p>`}
</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function configError() {
  const missing = [!process.env.WHATSAPP_TOKEN && "WHATSAPP_TOKEN", !WABA() && "WHATSAPP_BUSINESS_ACCOUNT_ID"].filter(Boolean);
  return missing.length ? `Add ${missing.join(" and ")} in Vercel, then redeploy.` : "";
}

async function rows() {
  const remote = await remoteTemplates();
  return (Object.keys(TEMPLATES) as MessageKind[]).map((kind) => {
    const name = TEMPLATES[kind].name;
    const r = remote.find((t) => t.name === name && t.language === LANG());
    const other = remote.find((t) => t.name === name && t.language !== LANG());
    return {
      kind,
      name,
      status: r?.status ?? "MISSING",
      note: r ? (r.category === TEMPLATES[kind].category ? r.category : `${r.category} (submitted as ${TEMPLATES[kind].category})`) : other ? `exists in ${other.language}, the site sends ${LANG()}` : MANUAL.includes(kind) ? "create by hand (needs a PDF header)" : "",
    };
  });
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized: sign in at /admin first" }, { status: 401 });
  const err = configError();
  if (err) return page([], err);
  try {
    return page(await rows());
  } catch (e) {
    return page([], `Meta error: ${(e as Error).message}`);
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Only the button on this page may submit.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const err = configError();
  if (err) return page([], err);
  const log: string[] = [];
  try {
    for (const r of await rows()) {
      if (r.status !== "MISSING" || MANUAL.includes(r.kind)) continue;
      const t = TEMPLATES[r.kind];
      const components: object[] = [{ type: "BODY", text: templateBody(t.text), example: { body_text: [SAMPLES[r.kind]] } }];
      // Every promotion carries the opt-out button; the webhook records a tap on it.
      if (t.category === "MARKETING") components.push({ type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: STOP_PROMOTIONS }] });
      const { ok, json } = await graph(`/${WABA()}/message_templates`, {
        method: "POST",
        body: JSON.stringify({ name: r.name, language: LANG(), category: t.category, components }),
      });
      log.push(ok ? `✓ ${r.name}: submitted (${json.status ?? "PENDING"})` : `✗ ${r.name}: ${json?.error?.error_user_msg || json?.error?.message || "failed"}`);
    }
    return page(await rows(), log.join("\n") || "Nothing to create.");
  } catch (e) {
    return page([], `Meta error: ${(e as Error).message}\n${log.join("\n")}`);
  }
}
