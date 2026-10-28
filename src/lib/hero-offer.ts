import type { OfferPlan } from "@/lib/offers";
import { formatINR } from "@/lib/site";

export type HeroOffer = { title: string; price: string; per: string; gets: string; until: string; extra?: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12-31" → "31 Dec" */
function day(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/**
 * The home hero's offer card: the running offer's monthly price (plus the annual deal when it has
 * one), read from the plans as sold today. Null when no offer is running, so the card disappears
 * by itself when the offer ends.
 */
export function heroOffer(plans: OfferPlan[]): HeroOffer | null {
  const monthly = plans.find((p) => p.id === "monthly" && p.offer);
  if (!monthly?.offer) return null;
  const yearly = plans.find((p) => p.id === "yearly" && p.offer);
  return {
    title: monthly.offer.title,
    price: formatINR(monthly.price),
    per: "month",
    gets: monthly.offer.gets,
    until: day(monthly.offer.endsOn),
    ...(yearly?.offer ? { extra: `${yearly.name} ${formatINR(yearly.price)}: ${yearly.offer.gets.split(/ [(·]/)[0]}` } : {}),
  };
}
