import "server-only";
import { pool } from "@/health/db";

// public.whatsapp_optouts: numbers that tapped "Stop promotions". The outbox checks it before every
// Marketing template; utility messages about the customer's own membership or order still go out.

const digits = (phone: string) => phone.replace(/\D/g, "").slice(0, 20);

/**
 * Records the choice. "Start promotions" is also the consent record (marketing_contacts, with
 * the time), so the Opt-ins page can show who asked for offers and when; "stop" closes it.
 */
export async function setPromotionsOptOut(phone: string, optOut: boolean, name = ""): Promise<void> {
  const p = digits(phone);
  if (!/^\d{8,20}$/.test(p)) return;
  if (optOut) {
    await pool.query(`insert into public.whatsapp_optouts (phone) values ($1) on conflict (phone) do nothing`, [p]);
    await pool.query(`update public.marketing_contacts set unsubscribed_at = coalesce(unsubscribed_at, now()) where channel = 'whatsapp' and address = $1`, [p]);
  } else {
    await pool.query(`delete from public.whatsapp_optouts where phone = $1`, [p]);
    await pool.query(
      `insert into public.marketing_contacts (channel, address, name, source, consent_at) values ('whatsapp', $1, $2, 'whatsapp: start promotions', now())
       on conflict (channel, address) do update set unsubscribed_at = null, consent_at = now(), name = coalesce(marketing_contacts.name, excluded.name)`,
      [p, name.trim().slice(0, 100) || null],
    );
  }
}

export async function optedOutOfPromotions(phone: string): Promise<boolean> {
  const { rowCount } = await pool.query(`select 1 from public.whatsapp_optouts where phone = $1`, [digits(phone)]);
  return Boolean(rowCount);
}
