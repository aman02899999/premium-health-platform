import "server-only";
import { pool } from "@/health/db";
import { isRole, normEmail, teamChangeError, type Member, type Role } from "./team-core";

// The team: everyone in public.admins (Google sign-in with that email opens the admin), with a
// role. Writes go through the owner-only /api/admin/team route.

export async function listTeam(): Promise<Member[]> {
  const { rows } = await pool.query<{ email: string; name: string; role: Role; created_at: Date; added_by: string }>(
    `select email, name, role, created_at, added_by from public.admins order by case role when 'owner' then 0 when 'manager' then 1 else 2 end, created_at`,
  );
  return rows.map((r) => ({ email: r.email, name: r.name, role: r.role, createdAt: r.created_at.toISOString(), addedBy: r.added_by }));
}

export async function roleOf(email: string | null): Promise<Role | null> {
  if (!email) return null;
  const { rows } = await pool.query<{ role: Role }>(`select role from public.admins where email = $1`, [email.toLowerCase()]);
  return rows[0]?.role ?? null;
}

export async function addMember(b: { email?: unknown; name?: unknown; role?: unknown }, by: string): Promise<string | null> {
  const email = normEmail(b.email);
  if (!email) return "Enter the Google email they will sign in with.";
  if (!isRole(b.role)) return "Pick a role.";
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 80) : "";
  const r = await pool.query(`insert into public.admins (email, name, role, added_by) values ($1, $2, $3, $4) on conflict (email) do nothing`, [email, name, b.role, by.slice(0, 200)]);
  return r.rowCount ? null : "They're already on the team.";
}

export async function changeRole(email: string, role: unknown, me: string): Promise<string | null> {
  if (!isRole(role)) return "Pick a role.";
  const err = teamChangeError(await listTeam(), me, { kind: "role", email, role });
  if (err) return err;
  await pool.query(`update public.admins set role = $2 where email = $1`, [email, role]);
  return null;
}

/** Removes access. Their chats go back to unassigned so nothing waits on someone who left. */
export async function removeMember(email: string, me: string): Promise<string | null> {
  const err = teamChangeError(await listTeam(), me, { kind: "remove", email });
  if (err) return err;
  await pool.query(`delete from public.admins where email = $1`, [email]);
  await pool.query(`update public.chat_contacts set assigned_to = null, assigned_at = null where assigned_to = $1`, [email]);
  return null;
}

export async function renameMember(email: string, name: unknown): Promise<void> {
  await pool.query(`update public.admins set name = $2 where email = $1`, [email, typeof name === "string" ? name.trim().slice(0, 80) : ""]);
}

/** Assigns a WhatsApp chat to a team member (null unassigns). */
export async function assignChat(peer: string, email: string | null): Promise<string | null> {
  if (!/^\d{8,20}$/.test(peer)) return "Unknown chat.";
  if (email !== null) {
    const { rowCount } = await pool.query(`select 1 from public.admins where email = $1`, [email]);
    if (!rowCount) return "That person isn't on the team.";
  }
  await pool.query(
    `insert into public.chat_contacts (peer, assigned_to, assigned_at) values ($1, $2, case when $2::text is null then null else now() end)
     on conflict (peer) do update set assigned_to = excluded.assigned_to, assigned_at = excluded.assigned_at, updated_at = now()`,
    [peer, email],
  );
  return null;
}
