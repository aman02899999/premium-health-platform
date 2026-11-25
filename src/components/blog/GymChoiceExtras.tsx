import Link from "next/link";
import type { PriceRow } from "@/lib/blog/gym-choice";
import { formatINR } from "@/lib/site";

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Today's prices from the live plans and offers, so a gym-choice post never shows stale prices. */
export function LivePrices({ rows, offerEndsOn }: { rows: PriceRow[]; offerEndsOn: string | null }) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="live-prices" className="glass mt-10 rounded-3xl p-5 sm:p-7">
      <h2 id="live-prices" className="font-display text-2xl text-white">Royal Fitness Club prices today</h2>
      <p className="mt-1 text-sm text-white/60">
        {offerEndsOn ? `Festive prices, valid till ${fmtDay(offerEndsOn)}. Couple prices stay standard.` : "Current prices, the same as on our membership page."}
      </p>
      {/* Phones: one card per plan, so no price hides behind a sideways scroll. */}
      <ul className="mt-4 space-y-2 sm:hidden">
        {rows.map((r) => (
          <li key={r.name} className="rounded-2xl border border-white/10 p-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-white">{r.name}</span>
              <span className="whitespace-nowrap">
                {r.standardPrice > 0 && <s className="mr-1.5 text-sm text-white/40">{formatINR(r.standardPrice)}</s>}
                <span className="font-semibold text-white">{formatINR(r.price)}</span>
              </span>
            </div>
            <p className="mt-1 text-sm text-white/70">{r.gets}</p>
            <p className="mt-1 text-xs text-white/50">
              {r.perMonth ? `${formatINR(r.perMonth)} a month` : ""}
              {r.perMonth && r.couplePrice ? " · " : ""}
              {r.couplePrice ? `Couple ${formatINR(r.couplePrice)}` : ""}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="text-white/50">
            <tr>
              <th scope="col" className="py-2 pr-3 font-medium">Plan</th>
              <th scope="col" className="py-2 pr-3 font-medium">You get</th>
              <th scope="col" className="py-2 pr-3 font-medium">Price</th>
              <th scope="col" className="py-2 pr-3 font-medium">Per month</th>
              <th scope="col" className="py-2 font-medium">Couple</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-white/85">
            {rows.map((r) => (
              <tr key={r.name}>
                <th scope="row" className="py-2 pr-3 font-semibold text-white">{r.name}</th>
                <td className="py-2 pr-3">{r.gets}</td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  {r.standardPrice > 0 && <s className="mr-1.5 text-white/40">{formatINR(r.standardPrice)}</s>}
                  <span className="font-semibold text-white">{formatINR(r.price)}</span>
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">{r.perMonth ? formatINR(r.perMonth) : "–"}</td>
                <td className="py-2 whitespace-nowrap">{r.couplePrice ? formatINR(r.couplePrice) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/membership" className="btn-brand rounded-full px-5 py-2.5 text-sm font-semibold">See all plans</Link>
        <Link href="/contact#trial" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:border-brand">Book a free trial first</Link>
      </div>
    </section>
  );
}

/** Links to the other gym-choice guides. */
export function GuideLinks({ title, links }: { title: string; links: { href: string; title: string }[] }) {
  if (links.length === 0) return null;
  return (
    <nav aria-label={title} className="mt-8">
      <h2 className="font-display text-xl text-white">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-brand underline-offset-4 hover:underline">{l.title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
