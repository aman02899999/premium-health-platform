// Turns a Meta webhook body into the messages and comments it carries. Pure, so the shapes are
// tested without Meta: WhatsApp Cloud API ("whatsapp_business_account") and the Instagram API
// with Instagram Login ("instagram": DMs under messaging, comments under changes).

export type Inbound = {
  id: string;
  channel: "whatsapp" | "instagram" | "facebook";
  kind: "message" | "comment";
  /** WhatsApp: the sender's number (country code + digits). Instagram / Facebook: their scoped user id. */
  from: string;
  fromName: string;
  text: string;
  /** A photo, voice note, video, document or sticker (WhatsApp): Meta's media id, fetched on demand. */
  media?: { type: MediaType; id: string };
};

export type MediaType = "image" | "audio" | "video" | "document" | "sticker";
const MEDIA_TYPES: MediaType[] = ["image", "audio", "video", "document", "sticker"];
type WaMedia = { id?: string; caption?: string; filename?: string };

type WaMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  image?: WaMedia;
  audio?: WaMedia;
  video?: WaMedia;
  document?: WaMedia;
  sticker?: WaMedia;
  location?: { latitude?: number; longitude?: number; name?: string };
};
type WaValue = { contacts?: { wa_id?: string; profile?: { name?: string } }[]; messages?: WaMessage[] };
type IgMessaging = { sender?: { id?: string }; message?: { mid?: string; text?: string; is_echo?: boolean } };
type FbFeed = { item?: string; verb?: string; comment_id?: string; message?: string; from?: { id?: string; name?: string } };
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
          // Text, a tapped quick-reply button, or a list choice. A photo or document keeps its caption
          // as the text; the file itself is kept as a media id for the admin chat.
          const type = MEDIA_TYPES.find((t) => t === m.type);
          const media = type ? m[type] : undefined;
          const loc = m.location && typeof m.location.latitude === "number" ? `📍 Location: https://maps.google.com/?q=${m.location.latitude},${m.location.longitude}` : "";
          const text = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? media?.caption ?? loc;
          if (!m.id || !m.from) continue;
          const name = v.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? "";
          out.push({
            id: `wa:${m.id}`,
            channel: "whatsapp",
            kind: "message",
            from: m.from.replace(/\D/g, ""),
            fromName: clean(name, 80),
            text: clean(text, 1000),
            ...(type && media?.id ? { media: { type, id: media.id } } : {}),
          });
        }
      }
    } else if (body.object === "page") {
      // Facebook Page: Messenger messages, and new comments on the Page's posts.
      for (const m of entry.messaging ?? []) {
        if (!m.message?.mid || !m.sender?.id || m.message.is_echo || m.sender.id === entry.id) continue;
        out.push({ id: `fb:${m.message.mid}`, channel: "facebook", kind: "message", from: m.sender.id, fromName: "", text: clean(m.message.text, 1000) });
      }
      for (const change of entry.changes ?? []) {
        if (change.field !== "feed") continue;
        const c = (change.value ?? {}) as FbFeed;
        if (c.item !== "comment" || c.verb !== "add" || !c.comment_id || !c.from?.id || c.from.id === entry.id) continue;
        out.push({ id: `fbc:${c.comment_id}`, channel: "facebook", kind: "comment", from: c.from.id, fromName: clean(c.from.name, 80), text: clean(c.message, 1000) });
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

/**
 * A WhatsApp voice-call event (webhook field "calls"). Shape per Meta's Calling API docs; the raw
 * payload is stored with each event until a real call has confirmed it.
 */
export type CallEvent = { id: string; from: string; fromName: string; event: string; status: string; direction: string; raw: unknown };

type WaCall = { id?: string; from?: string; event?: string; status?: string | string[]; direction?: string };

export function parseCalls(body: MetaWebhook): CallEvent[] {
  if (body.object !== "whatsapp_business_account") return [];
  const out: CallEvent[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "calls") continue;
      const v = (change.value ?? {}) as WaValue & { calls?: WaCall[] };
      for (const c of v.calls ?? []) {
        if (!c.id || !c.from) continue;
        const from = c.from.replace(/\D/g, "");
        out.push({
          id: c.id.slice(0, 200),
          from,
          fromName: clean(v.contacts?.find((x) => x.wa_id === c.from)?.profile?.name, 80),
          event: clean(c.event, 40).toLowerCase(),
          status: clean(Array.isArray(c.status) ? c.status.join(",") : c.status, 80).toLowerCase(),
          direction: clean(c.direction, 40).toUpperCase(),
          raw: change.value,
        });
      }
    }
  }
  return out;
}

/** Only a call the customer made, once it has ended, earns a follow-up. */
export const wantsCallFollowUp = (c: Pick<CallEvent, "event" | "direction">) => c.event === "terminate" && c.direction !== "BUSINESS_INITIATED";
