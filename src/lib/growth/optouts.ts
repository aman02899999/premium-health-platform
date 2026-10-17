import "server-only";
import { pool } from "@/health/db";

// public.whatsapp_optouts: numbers that tapped "Stop promotions". The outbox checks it before every
// Marketing template; utility messages about the customer's own membership or order still go out.

const digits = (phone: string) => phone.replace(/\D/g, "").slice(0, 20);

export async function setPromotionsOptOut(phone: string, optOut: boolean): Promise<void> {
  const p = digits(phone);
  if (!/^\d{8,20}$/.test(p)) return;
  if (optOut) await pool.query(`insert into public.whatsapp_optouts (phone) values ($1) on conflict (phone) do nothing`, [p]);
  else await pool.query(`delete from public.whatsapp_optouts where phone = $1`, [p]);
}
