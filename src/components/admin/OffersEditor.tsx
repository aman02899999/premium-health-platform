"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Plan } from "@/lib/content/types";
import { activeOffer, validateOffers, type Offer } from "@/lib/offers";

// Admin → Offers. The prices typed here are what the site shows and what Razorpay charges
// (applyOffer feeds the plan cards and the server-side quote), so every change shows the
// standard price next to it and the save is refused when a price looks like a typo.

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55";

/** Today and N days later, India time, as YYYY-MM-DD. */
function istDay(offsetDays = 0) {
  return new Date(Date.now() + 5.5 * 3600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

function status(o: Offer, today: string) {
  if (today < o.startsOn) return { text: `Starts ${o.startsOn}`, cls: "bg-sky-400/15 text-sky-200 ring-sky-400/40" };
  if (today > o.endsOn) return { text: "Ended", cls: "bg-white/5 text-white/60 ring-white/15" };
  return { text: `Running now, until ${o.endsOn}`, cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/40" };
}

export function OffersEditor({ offers, plans, onChange }: { offers: Offer[]; plans: Plan[]; onChange: (v: Offer[]) => void }) {
  const today = istDay();
  const { errors, warnings } = validateOffers(offers, plans);
  const running = activeOffer(today, offers);
  const sellable = plans.filter((p) => p.price > 0);
  const setOffer = (i: number, o: Offer) => onChange(offers.map((x, j) => (j === i ? o : x)));

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/70">
        {running ? (
          <>
            <b className="text-white">{running.title}</b> is on the site now. Offer prices are charged at checkout; couple prices stay standard.
          </>
        ) : (
          "No offer is running today, so the site shows the standard prices from the Membership tab."
        )}{" "}
        An offer switches itself on and off on its dates (India time).
      </p>

      {(errors.length > 0 || warnings.length > 0) && (
        <div role="status" className="space-y-2">
          {errors.map((e) => (
            <p key={e} className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-100 ring-1 ring-red-400/40">
              Can&apos;t save: {e}
            </p>
          ))}
          {warnings.map((w) => (
            <p key={w} className="rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-100 ring-1 ring-amber-400/40">
              {w}
            </p>
          ))}
        </div>
      )}

      {offers.map((o, i) => {
        const s = status(o, today);
        return (
          <section key={`${o.id}-${i}`} className="space-y-5 rounded-xl bg-black/20 p-4 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${s.cls}`}>{s.text}</span>
              <div className="flex gap-2">
                {today >= o.startsOn && today <= o.endsOn && (
                  <button
                    type="button"
                    onClick={() => confirm(`End "${o.title}" today? Standard prices come back tomorrow.`) && setOffer(i, { ...o, endsOn: today })}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80"
                  >
                    End today
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => confirm(`Remove "${o.title}" from the list? Use "End today" to stop a running offer and keep its record.`) && onChange(offers.filter((_, j) => j !== i))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={label} htmlFor={`offer-${i}-title`}>Offer name</label>
                <input id={`offer-${i}-title`} className="field text-sm" value={o.title} onChange={(e) => setOffer(i, { ...o, title: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor={`offer-${i}-start`}>Starts on</label>
                  <input id={`offer-${i}-start`} type="date" className="field text-sm" value={o.startsOn} onChange={(e) => setOffer(i, { ...o, startsOn: e.target.value })} />
                </div>
                <div>
                  <label className={label} htmlFor={`offer-${i}-end`}>Last day</label>
                  <input id={`offer-${i}-end`} type="date" className="field text-sm" value={o.endsOn} onChange={(e) => setOffer(i, { ...o, endsOn: e.target.value })} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={label} htmlFor={`offer-${i}-banner`}>Banner at the top of every gym page</label>
                <input id={`offer-${i}-banner`} className="field text-sm" maxLength={200} value={o.banner} onChange={(e) => setOffer(i, { ...o, banner: e.target.value })} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Plan prices during the offer</h3>
              {sellable.map((p) => {
                const po = o.plans[p.id];
                const setPlan = (v: Offer["plans"][string] | null) => {
                  const next = { ...o.plans };
                  if (v) next[p.id] = v;
                  else delete next[p.id];
                  setOffer(i, { ...o, plans: next });
                };
                const off = po && po.price > 0 && po.price < p.price ? Math.round((1 - po.price / p.price) * 100) : 0;
                return (
                  <div key={p.id} className="rounded-lg bg-white/[0.03] p-3 ring-1 ring-white/10">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#e8394b]"
                        checked={!!po}
                        onChange={(e) => setPlan(e.target.checked ? { price: p.price, bonus: "", gets: p.duration, perks: [], showStandard: true } : null)}
                      />
                      {p.name} <span className="font-normal text-white/60">standard {inr(p.price)} · {p.duration}</span>
                    </label>
                    {po && (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className={label} htmlFor={`offer-${i}-${p.id}-price`}>Offer price (₹)</label>
                          <input
                            id={`offer-${i}-${p.id}-price`}
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            className="field text-sm"
                            value={po.price}
                            onChange={(e) => setPlan({ ...po, price: Number(e.target.value) })}
                          />
                          <p className="mt-1 text-xs text-white/60">
                            {inr(p.price)} → <b className="text-white">{inr(po.price || 0)}</b>
                            {off > 0 ? ` (${off}% off)` : po.price === p.price ? " (same price, extra time)" : ""}
                          </p>
                        </div>
                        <div>
                          <label className={label} htmlFor={`offer-${i}-${p.id}-bonus`}>Bonus time added</label>
                          <input
                            id={`offer-${i}-${p.id}-bonus`}
                            className="field text-sm"
                            placeholder="e.g. 5 days or 2 months"
                            value={po.bonus}
                            onChange={(e) => setPlan({ ...po, bonus: e.target.value })}
                          />
                          <p className="mt-1 text-xs text-white/60">Membership length: {po.bonus.trim() ? `${p.duration} + ${po.bonus.trim()}` : p.duration}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className={label} htmlFor={`offer-${i}-${p.id}-gets`}>What the member gets (shown on the card)</label>
                          <input id={`offer-${i}-${p.id}-gets`} className="field text-sm" value={po.gets} onChange={(e) => setPlan({ ...po, gets: e.target.value })} />
                        </div>
                        <div>
                          <label className={label} htmlFor={`offer-${i}-${p.id}-perks`}>Extra perks (one per line)</label>
                          <textarea
                            id={`offer-${i}-${p.id}-perks`}
                            className="field text-sm"
                            rows={2}
                            defaultValue={po.perks.join("\n")}
                            onBlur={(e) => setPlan({ ...po, perks: lines(e.target.value) })}
                          />
                        </div>
                        <label className="flex items-center gap-2 self-end text-sm text-white/80">
                          <input type="checkbox" className="h-4 w-4 accent-[#e8394b]" checked={po.showStandard} onChange={(e) => setPlan({ ...po, showStandard: e.target.checked })} />
                          Show the standard price crossed out
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Plans sold only during this offer</h3>
              {o.extraPlans.map((x, k) => {
                const setExtra = (v: Offer["extraPlans"][number]) => setOffer(i, { ...o, extraPlans: o.extraPlans.map((y, m) => (m === k ? v : y)) });
                const id = `offer-${i}-extra-${k}`;
                return (
                  <div key={k} className="grid gap-3 rounded-lg bg-white/[0.03] p-3 ring-1 ring-white/10 md:grid-cols-2">
                    <div>
                      <label className={label} htmlFor={`${id}-name`}>Plan name</label>
                      <input id={`${id}-name`} className="field text-sm" value={x.plan.name} onChange={(e) => setExtra({ ...x, plan: { ...x.plan, name: e.target.value } })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label} htmlFor={`${id}-price`}>Price (₹)</label>
                        <input
                          id={`${id}-price`}
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          className="field text-sm"
                          value={x.plan.price}
                          onChange={(e) => setExtra({ ...x, plan: { ...x.plan, price: Number(e.target.value) } })}
                        />
                      </div>
                      <div>
                        <label className={label} htmlFor={`${id}-duration`}>Duration</label>
                        <input id={`${id}-duration`} className="field text-sm" value={x.plan.duration} onChange={(e) => setExtra({ ...x, plan: { ...x.plan, duration: e.target.value } })} />
                      </div>
                    </div>
                    <div>
                      <label className={label} htmlFor={`${id}-after`}>Show after</label>
                      <select id={`${id}-after`} className="field text-sm" value={x.after} onChange={(e) => setExtra({ ...x, after: e.target.value })}>
                        <option value="">Choose a plan</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label} htmlFor={`${id}-gets`}>What the member gets</label>
                      <input id={`${id}-gets`} className="field text-sm" value={x.gets} onChange={(e) => setExtra({ ...x, gets: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={label} htmlFor={`${id}-perks`}>Perks (one per line)</label>
                      <textarea
                        id={`${id}-perks`}
                        className="field text-sm"
                        rows={3}
                        defaultValue={x.plan.perks.join("\n")}
                        onBlur={(e) => setExtra({ ...x, plan: { ...x.plan, perks: lines(e.target.value) } })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() => setOffer(i, { ...o, extraPlans: o.extraPlans.filter((_, m) => m !== k) })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove this plan
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setOffer(i, {
                    ...o,
                    extraPlans: [
                      ...o.extraPlans,
                      {
                        after: sellable.at(-1)?.id ?? "",
                        gets: "",
                        plan: { id: `offer-plan-${Math.random().toString(36).slice(2, 7)}`, name: "New offer plan", duration: "1 month", price: 1000, couplePrice: 0, originalPrice: 0, perks: [], featured: false },
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add an offer-only plan
              </button>
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...offers,
            {
              id: `offer-${istDay().replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6)}`,
              title: "New offer",
              banner: "",
              startsOn: istDay(1),
              endsOn: istDay(30),
              plans: {},
              extraPlans: [],
            },
          ])
        }
        className="inline-flex items-center gap-2 rounded-lg bg-brand-strong px-4 py-2 text-sm font-bold text-white"
      >
        <Plus className="h-4 w-4" aria-hidden /> Add an offer
      </button>
      <p className="text-xs text-white/60">Nothing changes on the site until you press Save changes at the top.</p>
    </div>
  );
}
