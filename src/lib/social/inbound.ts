// Turns a Meta webhook body into the messages and comments it carries. Pure, so the shapes are
// tested without Meta: WhatsApp Cloud API ("whatsapp_business_account") and the Instagram API
// with Instagram Login ("instagram": DMs under messaging, comments under changes).

export type Inbound = {
  id: string;
  channel: "whatsapp" | "instagram";
  kind: "message" | "comment";
  /** WhatsApp: the sender's number (country code + digits). Instagram: their scoped user id. */
  from: string;
  fromName: string;
  text: string;
};

type WaMessage = { id?: string; from?: string; type?: string; text?: { body?: string }; button?: { text?: string }; interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } } };
type WaValue = { contacts?: { wa_id?: string; profile?: { name?: string } }[]; messages?: WaMessage[] };
type IgMessaging = { sender?: { id?: string }; message?: { mid?: string; text?: string; is_echo?: boolean } };
type IgComment = { id?: string; text?: string; from?: { id?: string; username?: string } };
type Entry = { id?: string; changes?: { field?: string; value?: unknown }[]; messaging?: IgMessaging[] };
export type MetaWebhook = { object?: string; entry?: Entry[] };

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function parseWebhook(body: MetaWebhook): Inbound[] {
  const out: Inbound[] = [];
  for (const entry of body.entry ?? []) {
    if (body.object === "whatsapp_business_account") {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;
        const v = (change.value ?? {}) as WaValue;
        for (const m of v.messages ?? []) {
          // Text, a tapped quick-reply button, or a list choice; media and stickers carry no words to answer.
          const text = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
          if (!m.id || !m.from) continue;
          const name = v.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? "";
          out.push({ id: `wa:${m.id}`, channel: "whatsapp", kind: "message", from: m.from.replace(/\D/g, ""), fromName: clean(name, 80), text: clean(text, 1000) });
        }
      }
    } else if (body.object === "instagram") {
      for (const m of entry.messaging ?? []) {
        // Our own replies come back as echoes; never answer ourselves.
        if (!m.message?.mid || !m.sender?.id || m.message.is_echo || m.sender.id === entry.id) continue;
        out.push({ id: `ig:${m.message.mid}`, channel: "instagram", kind: "message", from: m.sender.id, fromName: "", text: clean(m.message.text, 1000) });
      }
      for (const change of entry.changes ?? []) {
        if (change.field !== "comments") continue;
        const c = (change.value ?? {}) as IgComment;
        if (!c.id || !c.from?.id || c.from.id === entry.id) continue;
        out.push({ id: `igc:${c.id}`, channel: "instagram", kind: "comment", from: c.from.id, fromName: clean(c.from.username, 80), text: clean(c.text, 1000) });
      }
    }
  }
  return out;
}

/** An Indian mobile from a WhatsApp number, or null (only those become leads). */
export function indianMobile(waNumber: string): string | null {
  const d = waNumber.replace(/\D/g, "");
  const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}
