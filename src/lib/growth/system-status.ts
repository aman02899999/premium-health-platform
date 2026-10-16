import "server-only";
import { pool } from "@/health/db";

// The last daily automation run (from the schedule or the admin's button), and the settings the
// site still needs, so the admin can see at a glance that everything is switched on.

export type DailyRun = { at: string; source: "cron" | "admin"; ok: boolean; summary: string };

export async function recordDailyRun(source: DailyRun["source"], ok: boolean, result: unknown, key: "daily-run" | "reel-run" = "daily-run"): Promise<void> {
  const summary = (ok ? JSON.stringify(result) : String(result)).slice(0, 1500);
  await pool
    .query(
      `insert into public.system_status (key, value, updated_at) values ($2, $1, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [JSON.stringify({ at: new Date().toISOString(), source, ok, summary }), key],
    )
    .catch((err: Error) => console.error("[system-status] record:", err.message));
}

export async function lastDailyRun(): Promise<DailyRun | null> {
  const { rows } = await pool.query<{ value: DailyRun }>(`select value from public.system_status where key = 'daily-run'`).catch(() => ({ rows: [] as { value: DailyRun }[] }));
  return rows[0]?.value ?? null;
}

export type SetupItem = { key: string; label: string; on: boolean; why: string };

/** Which Vercel settings are present (names only; values are never read out). */
export function setupChecklist(env: Record<string, string | undefined> = process.env): SetupItem[] {
  const has = (...k: string[]) => k.every((x) => !!env[x]);
  return [
    { key: "CRON_SECRET", label: "Daily schedule", on: has("CRON_SECRET"), why: "Reminders and follow-ups every morning, the Reel every evening at peak time, by themselves." },
    { key: "RAZORPAY_KEY_ID", label: "Online payments", on: has("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"), why: "Memberships, diet plans, books and supplements can be paid online." },
    { key: "RESEND_API_KEY", label: "Email sending", on: has("RESEND_API_KEY", "EMAIL_FROM"), why: "Receipts, plan PDFs and newsletters go out by email." },
    { key: "COACH_EMAIL", label: "Your morning email", on: has("COACH_EMAIL"), why: "Payments, leads and anything that needs you, every morning at 7:45." },
    { key: "DIET_AUTO_SEND", label: "Auto-send first plans", on: env.DIET_AUTO_SEND === "no-conditions" || env.DIET_AUTO_SEND === "all", why: "Set to no-conditions: plans without health conditions go out without waiting for you." },
    { key: "WHATSAPP_TOKEN", label: "WhatsApp automation", on: has("WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"), why: "Reminders and auto-replies send themselves instead of waiting in Messages." },
    { key: "INSTAGRAM_ACCESS_TOKEN", label: "Instagram auto-post", on: has("INSTAGRAM_ACCESS_TOKEN"), why: "The daily Reel and Story, and DM / comment replies on Instagram." },
    { key: "FACEBOOK_PAGE_TOKEN", label: "Facebook Page", on: has("FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_TOKEN"), why: "The daily Reel and Messenger / comment replies on Facebook." },
    { key: "META_VERIFY_TOKEN", label: "Meta webhook", on: has("META_VERIFY_TOKEN") && (has("META_APP_SECRET") || has("INSTAGRAM_APP_SECRET")), why: "Incoming WhatsApp, Instagram and Facebook messages reach the site." },
  ];
}
