// The Sunday newsletter through the real daily run (Postgres with migrations applied, Resend stubbed):
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/growth/newsletter.integration.test.ts
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => DEFAULT_CONTENT };
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("weekly newsletter in the daily run", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let runDaily: typeof import("./daily").runDaily;
  const emails: { to: string[]; subject: string; headers?: Record<string, string>; text: string }[] = [];

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "Royal Fitness Club <hello@royalfitnesclub.in>";
    for (const k of ["WHATSAPP_TOKEN", "INSTAGRAM_ACCESS_TOKEN", "COACH_EMAIL"]) delete process.env[k];
    vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
      emails.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ id: "em_1" }), { status: 200 });
    });
    pool = (await import("@/health/db")).pool;
    runDaily = (await import("./daily")).runDaily;
    await pool.query("truncate public.message_outbox, public.marketing_contacts, public.leads, public.members cascade");
    await pool.query(
      `insert into public.marketing_contacts (channel, address, source, consent_at, unsubscribed_at) values
         ('email', 'health@example.com', 'newsletter', now(), null),
         ('email', 'popup@example.com', 'thali-popup', now(), null),
         ('email', 'gone@example.com', 'newsletter', now(), now()),
         ('email', 'gymlead@example.com', 'diet-checkout', now(), null)`,
    );
  });
  afterAll(async () => {
    vi.unstubAllGlobals();
    await pool.end();
  });

  it("sends on Sunday only to newsletter sign-ups who haven't unsubscribed, once, with an unsubscribe link", async () => {
    await runDaily(new Date("2026-10-17T02:15:00Z")); // Saturday
    expect(emails).toHaveLength(0);
    await runDaily(new Date("2026-10-18T02:15:00Z")); // Sunday
    await runDaily(new Date("2026-10-18T05:00:00Z")); // run again the same day
    expect(emails.map((e) => e.to[0]).sort()).toEqual(["health@example.com", "popup@example.com"]);
    expect(emails[0].subject).toMatch(/^Indian Health Weekly: /);
    expect(emails[0].headers?.["List-Unsubscribe"]).toMatch(/\/api\/unsubscribe\?e=/);
    expect(emails[0].text).toContain("Unsubscribe:");
    expect(emails[0].text).toContain("WhatsApp +91 92668 40289"); // the footer follows the site's WhatsApp number
  });
});
