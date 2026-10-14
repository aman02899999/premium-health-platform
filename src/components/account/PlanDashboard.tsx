"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, FileDown, Loader2, RefreshCw } from "lucide-react";
import { CONDITION_LIST } from "@/lib/diet-pro/conditions";
import { ACTIVITY, GOALS } from "@/components/diet-chart/DietChartCheckout";

export type DashboardOrder = {
  id: string;
  planName: string;
  paidAt: string;
  entitlement: { allowed: number; used: number; remaining: number; everyDays: number; accessUntil: string; nextAt: string | null; canUpdate: boolean; reason: string; message: string };
  versions: { id: string; version: number; createdAt: string; ready: boolean; weightKg: number }[];
  current: { sex: "male" | "female"; weightKg: number; waistCm: number | null; goal: string; activity: string; trainingDays: number | null; conditions: string[]; medicines: string; age: number };
};

const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const field = "mt-1 w-full rounded-xl bg-black/30 px-3 py-2.5 text-white ring-1 ring-white/10 focus:outline-none focus:ring-brand";

export function PlanDashboard({ email, orders }: { email: string; orders: DashboardOrder[] }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-white/55">
        Signed in as <b className="text-white/80">{email}</b>
      </p>
      {orders.map((o) => (
        <OrderCard key={o.id} o={o} />
      ))}
    </div>
  );
}

function OrderCard({ o }: { o: DashboardOrder }) {
  const e = o.entitlement;
  const [open, setOpen] = useState(false);
  const pct = Math.min(100, Math.round((e.used / Math.max(1, e.allowed)) * 100));
  return (
    <article className="glass brand-border rounded-3xl p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-white">{o.planName}</h2>
          <p className="text-sm text-white/55">
            Paid {date(o.paidAt)} · plan updates until {date(`${e.accessUntil}T00:00:00Z`)}
          </p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-sm font-semibold text-white">
          {e.used} of {e.allowed} plans
        </span>
      </header>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-5 divide-y divide-white/5 rounded-2xl bg-black/20">
        {o.versions.length === 0 && <li className="p-4 text-sm text-white/60">Your first plan is being prepared. It arrives on WhatsApp and here, usually within 48 hours.</li>}
        {[...o.versions].reverse().map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">#{v.version}</span>
            <span className="flex-1 text-sm">
              <span className="block font-semibold text-white">Plan {v.version}</span>
              <span className="text-white/55">
                {date(v.createdAt)} · built at {v.weightKg} kg
              </span>
            </span>
            {v.ready ? (
              <a href={`/api/account/plan/file?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15">
                <FileDown className="h-4 w-4" /> Open PDF
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-4 py-2 text-sm text-amber-200">
                <Clock className="h-4 w-4" /> Coach is checking it
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl bg-white/[.04] p-4">
        <p className={`text-sm ${e.canUpdate ? "text-emerald-200" : "text-white/70"}`}>{e.message}</p>
        {e.canUpdate && !open && (
          <button type="button" onClick={() => setOpen(true)} className="btn-brand mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold">
            <RefreshCw className="h-4 w-4" /> Update my plan
          </button>
        )}
        {e.canUpdate && open && <UpdateForm o={o} onCancel={() => setOpen(false)} />}
      </div>
    </article>
  );
}

function UpdateForm({ o, onCancel }: { o: DashboardOrder; onCancel: () => void }) {
  const router = useRouter();
  const c = o.current;
  const [f, setF] = useState({
    weightKg: String(c.weightKg),
    waistCm: c.waistCm ? String(c.waistCm) : "",
    goal: c.goal,
    activity: c.activity,
    trainingDays: c.trainingDays === null ? "" : String(c.trainingDays),
    conditions: c.conditions,
    medicines: c.medicines,
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { review: boolean }>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const conditions = CONDITION_LIST.filter((x) => !("female" in x && x.female) || c.sex === "female");

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/plan/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId: o.id, ...f, weightKg: Number(f.weightKg), waistCm: f.waistCm ? Number(f.waistCm) : undefined, trainingDays: f.trainingDays === "" ? undefined : Number(f.trainingDays), age: c.age }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "Something went wrong. Please try again.");
    setDone({ review: !!out.review });
    router.refresh();
  }

  if (done)
    return (
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-100">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        {done.review ? "Thanks! Because of your health details, your coach checks this plan first. You'll get it on WhatsApp and here." : "Your new plan is ready: open it above. It's also on its way on WhatsApp."}
      </p>
    );

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-white/70">
        Weight today (kg)
        <input required type="number" min={30} max={200} step={0.1} value={f.weightKg} onChange={set("weightKg")} className={field} />
      </label>
      <label className="text-sm text-white/70">
        Waist at the belly button (cm, optional)
        <input type="number" min={40} max={200} step={0.5} value={f.waistCm} onChange={set("waistCm")} className={field} />
      </label>
      <label className="text-sm text-white/70">
        Goal now
        <select value={f.goal} onChange={set("goal")} className={field}>
          {GOALS.map(([v, l]) => (
            <option key={v} value={v} className="bg-ink">
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-white/70">
        How active are you now?
        <select value={f.activity} onChange={set("activity")} className={field}>
          {ACTIVITY.map(([v, l]) => (
            <option key={v} value={v} className="bg-ink">
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-white/70">
        Workout days a week
        <select value={f.trainingDays} onChange={set("trainingDays")} className={field}>
          <option value="" className="bg-ink">
            Not sure
          </option>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n} className="bg-ink">
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-white/70">
        Medicines (if any)
        <input maxLength={200} value={f.medicines} onChange={set("medicines")} className={field} placeholder="e.g. thyroxine 50 mcg" />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm text-white/70">Health conditions now</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {conditions.map((x) => {
            const on = f.conditions.includes(x.key);
            return (
              <label key={x.key} className={`cursor-pointer rounded-xl px-3 py-2 text-xs ring-1 ${on ? "bg-brand/15 text-white ring-brand" : "bg-white/[.03] text-white/65 ring-white/10"}`}>
                <input type="checkbox" className="sr-only" checked={on} onChange={() => setF((s) => ({ ...s, conditions: on ? s.conditions.filter((k) => k !== x.key) : [...s.conditions, x.key] }))} />
                {x.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <label className="text-sm text-white/70 sm:col-span-2">
        Anything that changed? (optional)
        <textarea maxLength={500} rows={2} value={f.notes} onChange={set("notes")} className={field} placeholder="e.g. night shifts this month, knee pain on squats" />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-200 sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={busy} className="btn-brand inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} {busy ? "Building your plan…" : "Build my new plan"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-3 text-sm text-white/60 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  );
}
