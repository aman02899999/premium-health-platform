import "server-only";
import { pool } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { SITE_URL } from "@/lib/site";
import { allowedTarget, buildTarget, newQrCode, qrSource, type QrBiz, type QrKind, type QrRequest } from "./qr-core";

export async function qrBiz(): Promise<QrBiz> {
  const b = (await getContent()).business;
  return { siteUrl: SITE_URL, botNumber: b.whatsapp, deskNumber: b.phone, reviewUrl: b.googleReviewUrl ?? "" };
}

export type QrRow = { code: string; createdAt: string; label: string; kind: QrKind; target: string; active: boolean; scans: number; scans7: number; lastScanAt: string | null; leads: number };

export async function listQr(): Promise<QrRow[]> {
  const { rows } = await pool.query<{ code: string; created_at: Date; label: string; kind: QrKind; target: string; active: boolean; scans: number; scans7: number; last_scan_at: Date | null; leads: number }>(
    `select q.code, q.created_at, q.label, q.kind, q.target, q.active, q.scans, q.last_scan_at,
            (select count(*)::int from public.qr_scans s where s.code = q.code and s.at > now() - interval '7 days') as scans7,
            -- Leads attributed to the QR: a chat that carried its ref, or a website form after a scan.
            -- (attribution keeps UTM values lowercased, as first and last touch).
            (select count(*)::int from public.leads l
              where l.source = 'qr:' || q.code
                 or (l.attribution -> 'last' ->> 'source' = 'qr' and l.attribution -> 'last' ->> 'campaign' = lower(q.code))
                 or (l.attribution -> 'first' ->> 'source' = 'qr' and l.attribution -> 'first' ->> 'campaign' = lower(q.code))) as leads
       from public.qr_codes q order by q.active desc, q.created_at desc`,
  );
  return rows.map((r) => ({ code: r.code, createdAt: r.created_at.toISOString(), label: r.label, kind: r.kind, target: r.target, active: r.active, scans: r.scans, scans7: r.scans7, lastScanAt: r.last_scan_at?.toISOString() ?? null, leads: r.leads }));
}

export async function createQr(r: QrRequest, by: string): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const biz = await qrBiz();
  for (let i = 0; i < 3; i++) {
    const code = newQrCode();
    const t = buildTarget(r, code, biz);
    if ("error" in t) return { ok: false, error: t.error };
    const ins = await pool.query(`insert into public.qr_codes (code, created_by, label, kind, target) values ($1, $2, $3, $4, $5) on conflict (code) do nothing`, [code, by.slice(0, 200), t.label, r.kind, t.target]);
    if (ins.rowCount) return { ok: true, code };
  }
  return { ok: false, error: "Couldn't make a code; try again." };
}

export async function setQrActive(code: string, active: boolean): Promise<void> {
  await pool.query(`update public.qr_codes set active = $2 where code = $1`, [code, active]);
}

/** A scan: where to send the person (null when the code is unknown, paused or no longer allowed). */
export async function scanQr(code: string, counted: boolean): Promise<string | null> {
  const { rows } = await pool.query<{ target: string; active: boolean }>(`select target, active from public.qr_codes where code = $1`, [code]);
  const q = rows[0];
  if (!q?.active || !allowedTarget(q.target, await qrBiz())) return null;
  if (counted) {
    await pool.query(`update public.qr_codes set scans = scans + 1, last_scan_at = now() where code = $1`, [code]);
    await pool.query(`insert into public.qr_scans (code) values ($1)`, [code]);
  }
  return q.target;
}

/** The QR a WhatsApp chat came from, when its pre-typed ref names a real code. */
export async function qrLeadSource(ref: string | null): Promise<string | null> {
  if (!ref) return null;
  const { rowCount } = await pool.query(`select 1 from public.qr_codes where code = $1`, [ref]);
  return rowCount ? qrSource(ref) : null;
}

// ── Opt-ins ──────────────────────────────────────────────────────────────────────────────

export type OptinStats = {
  whatsappIn: number;
  whatsappOut: number;
  unreachable: number;
  emailIn: number;
  emailOut: number;
  recent: { at: string; channel: "whatsapp" | "email"; address: string; name: string; change: "in" | "out"; source: string }[];
};

export async function optinStats(): Promise<OptinStats> {
  const [counts, recent] = await Promise.all([
    pool.query<{ wa_in: number; wa_out: number; unreach: number; em_in: number; em_out: number }>(
      `select (select count(*)::int from public.marketing_contacts where channel = 'whatsapp' and unsubscribed_at is null) as wa_in,
              (select count(*)::int from public.whatsapp_optouts) as wa_out,
              (select count(*)::int from public.whatsapp_unreachable) as unreach,
              (select count(*)::int from public.marketing_contacts where channel = 'email' and unsubscribed_at is null) as em_in,
              (select count(*)::int from public.marketing_contacts where channel = 'email' and unsubscribed_at is not null) as em_out`,
    ),
    pool.query<{ at: Date; channel: "whatsapp" | "email"; address: string; name: string; change: "in" | "out"; source: string }>(
      `select * from (
         select consent_at as at, channel, address, coalesce(name, '') as name, 'in' as change, coalesce(source, '') as source from public.marketing_contacts
         union all select unsubscribed_at, channel, address, coalesce(name, ''), 'out', 'unsubscribed' from public.marketing_contacts where unsubscribed_at is not null and channel = 'email'
         union all select created_at, 'whatsapp', phone, '', 'out', 'stop promotions' from public.whatsapp_optouts
       ) x order by at desc limit 30`,
    ),
  ]);
  const c = counts.rows[0];
  return { whatsappIn: c.wa_in, whatsappOut: c.wa_out, unreachable: c.unreach, emailIn: c.em_in, emailOut: c.em_out, recent: recent.rows.map((r) => ({ ...r, at: r.at.toISOString() })) };
}
