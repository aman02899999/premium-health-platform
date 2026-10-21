// QR codes, scans and opt-ins on a real Postgres:
//   TEST_DATABASE_URL=postgresql://postgres:pg@127.0.0.1:5432/rfc_test npx vitest run src/lib/admin/qr.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
let business = { whatsapp: "919266840289", phone: "+91 88518 30081", googleReviewUrl: "https://g.page/r/abc/review" };
vi.mock("@/lib/content/store", async () => {
  const { DEFAULT_CONTENT } = await import("@/lib/content/defaults");
  return { getContent: async () => ({ ...DEFAULT_CONTENT, business: { ...DEFAULT_CONTENT.business, ...business } }) };
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("QR codes on a real database", () => {
  type Pool = import("pg").Pool;
  let pool: Pool;
  let qr: typeof import("./qr");
  let opt: typeof import("@/lib/growth/optouts");

  beforeAll(async () => {
    process.env.POSTGRES_URL = url;
    pool = (await import("@/health/db")).pool;
    qr = await import("./qr");
    opt = await import("@/lib/growth/optouts");
  });
  beforeEach(async () => {
    business = { whatsapp: "919266840289", phone: "+91 88518 30081", googleReviewUrl: "https://g.page/r/abc/review" };
    await pool.query("truncate public.qr_codes, public.qr_scans, public.leads, public.marketing_contacts, public.whatsapp_optouts cascade");
  });
  afterAll(async () => {
    await pool.end();
  });

  it("make, scan (people counted, previews not), pause", async () => {
    const r = await qr.createQr({ kind: "bot", label: "Reception" }, "admin");
    expect(r.ok).toBe(true);
    const code = (r as { code: string }).code;
    expect(await qr.scanQr(code, true)).toMatch(/^https:\/\/wa\.me\/919266840289\?text=/);
    await qr.scanQr(code, true);
    await qr.scanQr(code, false); // a link preview
    let row = (await qr.listQr())[0];
    expect(row).toMatchObject({ label: "Reception", kind: "bot", scans: 2, scans7: 2, active: true });
    await qr.setQrActive(code, false);
    expect(await qr.scanQr(code, true)).toBeNull();
    row = (await qr.listQr())[0];
    expect(row.scans).toBe(2);
  });

  it("a printed code stops following a number the gym no longer uses", async () => {
    const code = ((await qr.createQr({ kind: "desk", label: "Desk" }, "admin")) as { code: string }).code;
    expect(await qr.scanQr(code, true)).not.toBeNull();
    business = { ...business, phone: "+91 77777 77777" };
    expect(await qr.scanQr(code, true)).toBeNull();
  });

  it("leads are credited to the QR: by chat ref, or by website attribution", async () => {
    const code = ((await qr.createQr({ kind: "page", label: "Flyer", page: "/membership" }, "admin")) as { code: string }).code;
    expect(await qr.qrLeadSource(code)).toBe(`qr:${code}`);
    expect(await qr.qrLeadSource("ZZZZZZZZ")).toBeNull();
    expect(await qr.qrLeadSource(null)).toBeNull();
    await pool.query(`insert into public.leads (name, phone, source) values ('Chat Lead', '9811111111', $1)`, [`qr:${code}`]);
    await pool.query(`insert into public.leads (name, phone, source, attribution) values ('Form Lead', '9822222222', 'home', $1)`, [
      JSON.stringify({ first: { source: "qr", campaign: code.toLowerCase() }, last: { source: "google", campaign: null } }),
    ]);
    await pool.query(`insert into public.leads (name, phone, source) values ('Other', '9833333333', 'home')`);
    expect((await qr.listQr())[0].leads).toBe(2);
  });

  it("start / stop promotions keeps a consent record", async () => {
    await opt.setPromotionsOptOut("919811111111", false, "Rahul");
    let s = await qr.optinStats();
    expect(s).toMatchObject({ whatsappIn: 1, whatsappOut: 0 });
    expect(s.recent[0]).toMatchObject({ change: "in", channel: "whatsapp", name: "Rahul", source: "whatsapp: start promotions" });
    await opt.setPromotionsOptOut("919811111111", true);
    s = await qr.optinStats();
    expect(s).toMatchObject({ whatsappIn: 0, whatsappOut: 1 });
    await opt.setPromotionsOptOut("919811111111", false);
    s = await qr.optinStats();
    expect(s).toMatchObject({ whatsappIn: 1, whatsappOut: 0 });
  });
});
