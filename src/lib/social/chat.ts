import "server-only";
import { pool } from "@/health/db";
import { chatWindow, peerId, type WindowState } from "./chat-window";
import { sendWhatsAppText } from "./meta";

// WhatsApp conversations for the admin chat. A conversation is built from three places:
//   social_inbox    what the customer sent
//   chat_replies    what the site sent inside the conversation (auto-replies, the coach)
//   message_outbox  scheduled template messages (renewals, trial follow-ups, welcome)

export type ChatSummary = { peer: string; name: string; lastAt: string; lastBody: string; lastFromThem: boolean; window: WindowState; tag: "member" | "lead" | null; botPaused: boolean };
export type ChatMessage = {
  id: string;
  at: string;
  fromThem: boolean;
  body: string;
  /** Who sent ours: "auto-reply", "scheduled" or the admin's identity. */
  by: string;
  ok: boolean;
  error: string | null;
  media: { type: string; id: string } | null;
};

const EVENTS = `
  select 'in:' || i.id as id, i.from_id as peer, i.from_name as name, i.created_at as at, i.body, true as from_them,
         '' as by, true as ok, null::text as error, i.media_type, i.media_id
    from public.social_inbox i where i.channel = 'whatsapp' and i.kind = 'message'
  union all
  select 'r:' || r.id, r.to_id, '', r.created_at, r.body, false, r.sent_by, r.ok, r.error, null, null
    from public.chat_replies r where r.channel = 'whatsapp'
  union all
  select 'o:' || o.id, o.to_address, o.to_name, coalesce(o.sent_at, o.created_at), o.body, false, 'scheduled', o.status = 'sent', o.last_error, null, null
    from public.message_outbox o where o.channel = 'whatsapp' and o.status in ('sent', 'failed')`;

type Row = { id: string; peer: string; name: string; at: Date; body: string; from_them: boolean; by: string; ok: boolean; error: string | null; media_type: string | null; media_id: string | null };

/** Newest conversation first; a conversation whose last message is theirs is waiting for a reply. */
export async function listChats(limit = 200): Promise<ChatSummary[]> {
  const { rows } = await pool.query<{ peer: string; name: string | null; last_at: Date; last_body: string; last_from_them: boolean; last_in: Date | null; last_media: string | null }>(
    `with ev as (${EVENTS})
     select peer,
            max(name) filter (where name <> '') as name,
            max(at) as last_at,
            (array_agg(body order by at desc))[1] as last_body,
            (array_agg(from_them order by at desc))[1] as last_from_them,
            (array_agg(media_type order by at desc))[1] as last_media,
            max(at) filter (where from_them) as last_in
       from ev group by peer order by max(at) desc limit $1`,
    [limit],
  );
  // Who each number is: a member, a lead, or neither; and whether the coach paused the bot.
  const tens = rows.map((r) => (r.peer.length === 12 && r.peer.startsWith("91") ? r.peer.slice(2) : r.peer));
  const [members, leads, paused] = await Promise.all([
    pool.query<{ phone: string }>(`select distinct phone from public.members where phone = any($1)`, [tens]),
    pool.query<{ phone: string }>(`select distinct right(regexp_replace(phone, '\\D', '', 'g'), 10) as phone from public.leads where right(regexp_replace(phone, '\\D', '', 'g'), 10) = any($1)`, [tens]),
    pool.query<{ peer: string }>(`select peer from public.chat_contacts where peer = any($1) and bot_paused_until > now()`, [rows.map((r) => r.peer)]),
  ]);
  const isMember = new Set(members.rows.map((r) => r.phone));
  const isLead = new Set(leads.rows.map((r) => r.phone));
  const isPaused = new Set(paused.rows.map((r) => r.peer));
  return rows.map((r, i) => ({
    peer: r.peer,
    name: r.name ?? "",
    lastAt: r.last_at.toISOString(),
    lastBody: r.last_body || (r.last_media ? mediaLabel(r.last_media) : ""),
    lastFromThem: r.last_from_them,
    window: chatWindow(r.last_in),
    tag: isMember.has(tens[i]) ? "member" : isLead.has(tens[i]) ? "lead" : null,
    botPaused: isPaused.has(r.peer),
  }));
}

export const mediaLabel = (type: string) =>
  ({ image: "📷 Photo", audio: "🎤 Voice note", video: "🎬 Video", document: "📄 Document", sticker: "Sticker" })[type] ?? "Attachment";

export async function chatThread(peer: string, limit = 300): Promise<{ name: string; messages: ChatMessage[]; window: WindowState }> {
  const id = peerId(peer);
  const { rows } = await pool.query<Row>(`select * from (${EVENTS}) ev where peer = $1 order by at desc limit $2`, [id, limit]);
  rows.reverse();
  const lastIn = [...rows].reverse().find((r) => r.from_them)?.at ?? null;
  return {
    name: rows.find((r) => r.name)?.name ?? "",
    window: chatWindow(lastIn),
    messages: rows.map((r) => ({
      id: r.id,
      at: r.at.toISOString(),
      fromThem: r.from_them,
      body: r.body,
      by: r.by,
      ok: r.ok,
      error: r.error,
      media: r.media_type && r.media_id ? { type: r.media_type, id: r.media_id } : null,
    })),
  };
}

/** Records something the site sent inside a conversation; best-effort, never throws. */
export async function recordReply(r: { to: string; body: string; kind?: "text" | "document"; by: string; ok: boolean; error?: string | null; externalId?: string | null }): Promise<void> {
  await pool
    .query(`insert into public.chat_replies (to_id, kind, body, sent_by, ok, error, external_id) values ($1, $2, $3, $4, $5, $6, $7)`, [
      peerId(r.to),
      r.kind ?? "text",
      r.body.slice(0, 4000),
      r.by.slice(0, 200),
      r.ok,
      r.error?.slice(0, 300) ?? null,
      r.externalId ?? null,
    ])
    .catch((err: Error) => console.error("[chat] record reply:", err.message));
}

export type SendOutcome = { ok: true } | { ok: false; error: string; status: number };

/** The coach's reply: only inside the 24-hour window, and never empty. */
export async function sendChatReply(peer: string, text: string, by: string): Promise<SendOutcome> {
  const id = peerId(peer);
  const body = text.trim().slice(0, 4000);
  if (!/^\d{8,20}$/.test(id)) return { ok: false, error: "Invalid WhatsApp number", status: 400 };
  if (!body) return { ok: false, error: "Type a message first", status: 400 };
  const { rows } = await pool.query<{ at: Date | null }>(`select max(created_at) as at from public.social_inbox where channel = 'whatsapp' and kind = 'message' and from_id = $1`, [id]);
  if (!chatWindow(rows[0]?.at ?? null).open) {
    return { ok: false, status: 409, error: "The 24-hour reply window is closed. WhatsApp only allows a free message after the customer writes to you; ask them to message first, or send a template." };
  }
  const res = await sendWhatsAppText(id, body);
  await recordReply({ to: id, body, by, ok: res.ok, error: res.ok ? null : res.error, externalId: res.ok ? res.id : null });
  // The coach is talking: the bot stays quiet for a while so it doesn't answer over them.
  if (res.ok)
    await pool.query(
      `insert into public.chat_contacts (peer, bot_paused_until) values ($1, now() + interval '2 hours')
       on conflict (peer) do update set bot_paused_until = greatest(coalesce(public.chat_contacts.bot_paused_until, now()), now() + interval '2 hours'), updated_at = now()`,
      [id],
    );
  return res.ok ? { ok: true } : { ok: false, error: res.error, status: 502 };
}
