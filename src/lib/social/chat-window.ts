// Meta's customer-service window: a business may send free-form WhatsApp messages only within
// 24 hours of the customer's last message. Outside it, only an approved template can start the
// conversation again. Pure, so the admin chat and its tests agree on the rule.

export const WINDOW_MS = 24 * 60 * 60 * 1000;

export type WindowState = { open: boolean; closesAt: string | null };

export function chatWindow(lastInboundAt: string | Date | null, now = new Date()): WindowState {
  if (!lastInboundAt) return { open: false, closesAt: null };
  const closes = new Date(new Date(lastInboundAt).getTime() + WINDOW_MS);
  return { open: closes.getTime() > now.getTime(), closesAt: closes.toISOString() };
}

/** "Open for 3 h 20 min" style label for the chat header. */
export function windowLabel(w: WindowState, now = new Date()): string {
  if (!w.open || !w.closesAt) return "Closed: the customer must message first, or send a template";
  const mins = Math.max(1, Math.round((new Date(w.closesAt).getTime() - now.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  return `Reply window open for ${h ? `${h} h ` : ""}${mins % 60} min`;
}

/** WhatsApp ids are digits with the country code: "+91 98765-43210" → "919876543210". */
export const peerId = (raw: string) => raw.replace(/\D/g, "").slice(0, 20);

/**
 * Email to the coach when a customer writes on WhatsApp: the phone app is gone once the number
 * runs on the API, so this is the "ping". One per conversation per 30 minutes (the dedupe key).
 */
export function chatAlertEmail(m: { peer: string; name: string; text: string }, to: string, chatsUrl: string, now = new Date()) {
  const slot = Math.floor(now.getTime() / (30 * 60 * 1000));
  const who = m.name || `+${m.peer}`;
  const preview = m.text.trim() || "sent a photo, voice note or file";
  return {
    channel: "email" as const,
    to,
    toName: "Coach",
    kind: "chat-alert",
    subject: `💬 WhatsApp from ${who}`.slice(0, 200),
    body: `${who} (+${m.peer}) wrote on WhatsApp:\n\n"${preview.slice(0, 600)}"\n\nReply within 24 hours: ${chatsUrl}`,
    template: "",
    params: [] as string[],
    dedupeKey: `chat-alert:${m.peer}:${slot}`,
  };
}
