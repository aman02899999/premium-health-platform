// Team & chat assignment on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/admin/team.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("team on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let team: typeof import("./team");
  let chat: typeof import("@/lib/social/chat");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    team = await import("./team");
    chat = await import("@/lib/social/chat");
  });
  beforeEach(async () => {
    await pool.query("truncate public.admins, public.chat_contacts, public.social_inbox, public.chat_replies, public.message_outbox cascade");
    await pool.query(`insert into public.admins (email) values ('owner@x.in')`); // an existing admin from before roles
  });
  afterAll(async () => {
    await pool.end();
  });

  it("existing admins are owners; add, change role, remove with the safeguards", async () => {
    expect(await team.roleOf("owner@x.in")).toBe("owner");
    expect(await team.addMember({ email: "Desk@X.in", name: "Ritu", role: "agent" }, "owner@x.in")).toBeNull();
    expect(await team.addMember({ email: "desk@x.in", role: "agent" }, "owner@x.in")).toMatch(/already/);
    expect(await team.addMember({ email: "bad", role: "agent" }, "owner@x.in")).toMatch(/email/);
    expect(await team.roleOf("desk@x.in")).toBe("agent");
    expect(await team.changeRole("owner@x.in", "agent", "owner@x.in")).toMatch(/your own role/);
    expect(await team.changeRole("desk@x.in", "manager", "owner@x.in")).toBeNull();
    expect((await team.listTeam()).map((m) => [m.email, m.role, m.name])).toEqual([
      ["owner@x.in", "owner", ""],
      ["desk@x.in", "manager", "Ritu"],
    ]);
    expect(await team.removeMember("owner@x.in", "owner@x.in")).toMatch(/yourself/);
  });

  it("assigning chats; removing a member frees their chats", async () => {
    await team.addMember({ email: "desk@x.in", role: "agent" }, "owner@x.in");
    await pool.query(`insert into public.social_inbox (id, channel, kind, from_id, from_name, body) values ('m1', 'whatsapp', 'message', '919811111111', 'Rahul', 'hi'), ('m2', 'whatsapp', 'message', '919822222222', 'Neha', 'fees')`);
    expect(await team.assignChat("919811111111", "desk@x.in")).toBeNull();
    expect(await team.assignChat("919811111111", "stranger@x.in")).toMatch(/isn't on the team/);
    let chats = await chat.listChats();
    expect(chats.find((c) => c.peer === "919811111111")?.assignedTo).toBe("desk@x.in");
    expect(chats.find((c) => c.peer === "919822222222")?.assignedTo).toBeNull();
    // Notes and bot pause on the same row survive assignment.
    await pool.query(`update public.chat_contacts set notes = 'VIP' where peer = '919811111111'`);
    expect(await team.assignChat("919811111111", null)).toBeNull();
    expect((await pool.query(`select notes, assigned_to from public.chat_contacts where peer = '919811111111'`)).rows[0]).toEqual({ notes: "VIP", assigned_to: null });
    await team.assignChat("919822222222", "desk@x.in");
    expect(await team.removeMember("desk@x.in", "owner@x.in")).toBeNull();
    chats = await chat.listChats();
    expect(chats.every((c) => c.assignedTo === null)).toBe(true);
  });
});
