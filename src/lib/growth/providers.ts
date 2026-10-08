import "server-only";

// Outbound messaging. Nothing is sent unless the keys are set in Vercel; until then every
// message waits in the outbox and the admin sends it with one tap from their own WhatsApp.
//
// WhatsApp Cloud API (Meta):   WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, optional WHATSAPP_TEMPLATE_LANG (default "en")
// Email (Resend):              RESEND_API_KEY, EMAIL_FROM (e.g. "Royal Fitness Club <hello@royalfitnessclub.in>")

export const whatsappConfigured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export type SendResult = { ok: true; id: string } | { ok: false; error: string; retry: boolean };

/** Sends an approved template message (business-initiated messages must use templates). */
export async function sendWhatsAppTemplate(to: string, template: string, params: string[]): Promise<SendResult> {
  if (!whatsappConfigured()) return { ok: false, error: "WhatsApp API not configured", retry: false };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
          components: params.length ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] : [],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
    if (res.ok && json.messages?.[0]?.id) return { ok: true, id: json.messages[0].id };
    // 4xx = our request is wrong (template not approved, bad number): retrying won't help.
    return { ok: false, error: (json.error?.message || `HTTP ${res.status}`).slice(0, 300), retry: res.status >= 500 || res.status === 429 };
  } catch (err) {
    return { ok: false, error: (err as Error).message.slice(0, 300), retry: true };
  }
}

export async function sendEmail(to: string, subject: string, text: string): Promise<SendResult> {
  if (!emailConfigured()) return { ok: false, error: "Email not configured", retry: false };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (res.ok && json.id) return { ok: true, id: json.id };
    return { ok: false, error: (json.message || `HTTP ${res.status}`).slice(0, 300), retry: res.status >= 500 || res.status === 429 };
  } catch (err) {
    return { ok: false, error: (err as Error).message.slice(0, 300), retry: true };
  }
}
