import "server-only";
import { pool } from "@/health/db";
import { KEY_VERSION, labKey, open, seal } from "./crypto";
import { MARKERS } from "./markers";
import { applyOverrides, type MarkerOverride } from "./overrides";
import type { Marker, Person, ResultInput } from "./types";

// Blood report analyser: everything that touches the database. Health values are sealed with
// LAB_DATA_KEY before they are written; without the key nothing is saved.

const today = () => new Date().toISOString().slice(0, 10);

// ───────── Access ─────────

export async function hasAccess(email: string): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from public.lab_access where email = $1 and revoked_at is null and (expires_on is null or expires_on >= $2::date) limit 1`,
    [email.toLowerCase(), today()],
  );
  return rows.length > 0;
}

export type AccessRow = { email: string; grantedAt: string; grantedBy: string; expiresOn: string | null; note: string; active: boolean; name: string; kind: string };

/** Everyone granted (active first), with the member or diet client they match, if any. */
export async function accessList(): Promise<AccessRow[]> {
  const { rows } = await pool.query<{ email: string; granted_at: Date; granted_by: string; expires_on: string | null; note: string; active: boolean; name: string | null; kind: string | null }>(
    `select a.email, a.granted_at, a.granted_by, to_char(a.expires_on, 'YYYY-MM-DD') as expires_on, a.note,
       (a.revoked_at is null and (a.expires_on is null or a.expires_on >= current_date)) as active, p.name, p.kind
     from public.lab_access a
     left join lateral (
       select name, 'member' as kind from public.members where lower(email) = a.email
       union all select name, 'diet client' from public.diet_orders where lower(email) = a.email and status = 'paid'
       limit 1
     ) p on true
     order by active desc, a.granted_at desc limit 1000`,
  );
  return rows.map((r) => ({ email: r.email, grantedAt: r.granted_at.toISOString(), grantedBy: r.granted_by, expiresOn: r.expires_on, note: r.note, active: r.active, name: r.name ?? "", kind: r.kind ?? "" }));
}

export type Eligible = { email: string; name: string; kind: "member" | "diet client"; until: string | null };

/** Gym members and paid diet clients with an email who don't have access yet. */
export async function eligiblePeople(): Promise<Eligible[]> {
  const { rows } = await pool.query<Eligible>(
    `with people as (
       (select distinct on (lower(email)) lower(email) as email, name, 'member' as kind, to_char(expires_on, 'YYYY-MM-DD') as until
         from public.members where email is not null and email like '%@%' and expires_on >= current_date
         order by lower(email), expires_on desc)
       union all
       (select distinct on (lower(email)) lower(email), name, 'diet client', null
         from public.diet_orders where status = 'paid' and email is not null and email like '%@%'
         order by lower(email), paid_at desc nulls last)
     )
     select distinct on (email) email, name, kind, until from people
     where email not in (select email from public.lab_access where revoked_at is null)
     order by email, (kind = 'member') desc limit 1000`,
  );
  return rows;
}

export async function grantAccess(emails: string[], by: string, note = "", expiresOn: string | null = null): Promise<number> {
  const clean = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120))];
  if (!clean.length) return 0;
  await pool.query(
    `insert into public.lab_access (email, granted_by, note, expires_on)
     select unnest($1::text[]), $2, $3, $4::date
     on conflict (email) do update set granted_at = now(), granted_by = excluded.granted_by, note = excluded.note,
       expires_on = excluded.expires_on, revoked_at = null, revoked_by = ''`,
    [clean, by.slice(0, 200), note.slice(0, 300), expiresOn],
  );
  await logAction(by, "grant", clean.length === 1 ? clean[0] : `${clean.length} people`, note);
  return clean.length;
}

export async function revokeAccess(email: string, by: string): Promise<boolean> {
  const { rowCount } = await pool.query(`update public.lab_access set revoked_at = now(), revoked_by = $2 where email = $1 and revoked_at is null`, [email.toLowerCase(), by.slice(0, 200)]);
  if (rowCount) await logAction(by, "revoke", email.toLowerCase());
  return rowCount === 1;
}

// ───────── Audit log ─────────

type Action = "grant" | "revoke" | "view-reports" | "edit-marker" | "reset-marker";

export async function logAction(admin: string, action: Action, subject = "", reason = ""): Promise<void> {
  await pool.query(`insert into public.lab_access_log (admin, action, subject, reason) values ($1, $2, $3, $4)`, [admin.slice(0, 200), action, subject.slice(0, 200), reason.slice(0, 300)]);
}

export async function recentLog(limit = 200): Promise<{ at: string; admin: string; action: Action; subject: string; reason: string }[]> {
  const { rows } = await pool.query<{ at: Date; admin: string; action: Action; subject: string; reason: string }>(`select at, admin, action, subject, reason from public.lab_access_log order by at desc limit $1`, [limit]);
  return rows.map((r) => ({ ...r, at: r.at.toISOString() }));
}

// ───────── Marker library ─────────

export async function markerOverrides(): Promise<Record<string, MarkerOverride>> {
  const { rows } = await pool.query<{ marker_id: string; data: MarkerOverride }>(`select marker_id, data from public.lab_marker_overrides`);
  return Object.fromEntries(rows.map((r) => [r.marker_id, r.data]));
}

/** The library as members see it: the defaults in code with the admin's edits on top. */
export async function liveMarkers(): Promise<Marker[]> {
  return applyOverrides(MARKERS, await markerOverrides().catch(() => ({})));
}

export async function saveOverride(id: string, data: MarkerOverride, by: string): Promise<void> {
  // Merge with any earlier edit so saving one field keeps the others.
  await pool.query(
    `insert into public.lab_marker_overrides (marker_id, data, updated_by) values ($1, $2, $3)
     on conflict (marker_id) do update set data = public.lab_marker_overrides.data || excluded.data, updated_at = now(), updated_by = excluded.updated_by`,
    [id, JSON.stringify(data), by.slice(0, 200)],
  );
  await logAction(by, "edit-marker", id, Object.keys(data).join(", "));
}

/** Back to the library default. The edit row is cleared; the log keeps what happened. */
export async function resetOverride(id: string, by: string): Promise<void> {
  await pool.query(`update public.lab_marker_overrides set data = '{}'::jsonb, updated_at = now(), updated_by = $2 where marker_id = $1`, [id, by.slice(0, 200)]);
  await logAction(by, "reset-marker", id);
}

// ───────── Saved reports ─────────

export const savingEnabled = () => labKey() !== null;

export type SavedPayload = { person: Person; results: ResultInput[] };
export type SavedReport = SavedPayload & { id: string; createdAt: string; expiresAt: string; label: string };

export async function saveReport(email: string, payload: SavedPayload, consentVersion: string, label = ""): Promise<string | null> {
  const key = labKey();
  if (!key) return null;
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.lab_reports (email, payload, key_version, consent_at, consent_version, label) values ($1, $2, $3, now(), $4, $5) returning id`,
    [email.toLowerCase(), seal(key, payload), KEY_VERSION, consentVersion, label.slice(0, 80)],
  );
  return rows[0].id;
}

export async function reportsFor(email: string): Promise<SavedReport[]> {
  const key = labKey();
  if (!key) return [];
  const { rows } = await pool.query<{ id: string; created_at: Date; expires_at: Date; label: string; payload: string }>(
    `select id, created_at, expires_at, label, payload from public.lab_reports where email = $1 and expires_at > now() order by created_at desc limit 50`,
    [email.toLowerCase()],
  );
  return rows.flatMap((r) => {
    const p = open<SavedPayload>(key, r.payload);
    return p ? [{ ...p, id: r.id, createdAt: r.created_at.toISOString(), expiresAt: r.expires_at.toISOString(), label: r.label }] : [];
  });
}

/** The member's own delete: removes the row for good. `id` null deletes all of theirs. */
export async function deleteReports(email: string, id: string | null): Promise<number> {
  const { rowCount } = id
    ? await pool.query(`delete from public.lab_reports where email = $1 and id = $2`, [email.toLowerCase(), id])
    : await pool.query(`delete from public.lab_reports where email = $1`, [email.toLowerCase()]);
  return rowCount ?? 0;
}

/** An admin opens a member's saved reports: only with a reason, and always logged first. */
export async function adminViewReports(email: string, admin: string, reason: string): Promise<SavedReport[]> {
  await logAction(admin, "view-reports", email.toLowerCase(), reason);
  return reportsFor(email);
}

// ───────── Usage (counts only) ─────────

export async function countUsage(saved: boolean): Promise<void> {
  await pool.query(
    `insert into public.lab_usage_daily (day, analyses, saved) values ($1::date, 1, $2)
     on conflict (day) do update set analyses = public.lab_usage_daily.analyses + 1, saved = public.lab_usage_daily.saved + excluded.saved`,
    [today(), saved ? 1 : 0],
  );
}

export async function usage(days = 30): Promise<{ analyses: number; saved: number; savedNow: number; people: number }> {
  const { rows } = await pool.query<{ analyses: string; saved: string; saved_now: string; people: string }>(
    `select coalesce((select sum(analyses) from public.lab_usage_daily where day > current_date - $1::int), 0) as analyses,
            coalesce((select sum(saved) from public.lab_usage_daily where day > current_date - $1::int), 0) as saved,
            (select count(*) from public.lab_reports where expires_at > now()) as saved_now,
            (select count(*) from public.lab_access where revoked_at is null) as people`,
    [days],
  );
  const r = rows[0];
  return { analyses: Number(r.analyses), saved: Number(r.saved), savedNow: Number(r.saved_now), people: Number(r.people) };
}
