"use client";

import { useState } from "react";
import { CONDITION_LIST, FEMALE_ONLY } from "@/lib/diet-pro/conditions";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { loadCheckoutScript, type RazorpayResponse } from "@/components/join/JoinCheckout";

const GOALS = [
  ["fat-loss", "Lose fat"],
  ["recomp", "Lose fat & tone up"],
  ["maintain", "Stay at my weight, eat healthier"],
  ["lean-gain", "Build muscle slowly"],
  ["gain", "Gain weight"],
] as const;
const DIETS = [
  ["veg", "Vegetarian"],
  ["egg", "Eggetarian"],
  ["nonveg", "Non-vegetarian"],
  ["vegan", "Vegan"],
  ["jain", "Jain"],
] as const;
const CUISINES = [
  ["any", "Mix of all India"],
  ["north", "North Indian"],
  ["south", "South Indian"],
  ["west", "Gujarati / Maharashtrian"],
  ["east", "Bengali / Odia"],
] as const;
const ACTIVITY = [
  ["sedentary", "Mostly sitting (desk job, little walking)"],
  ["light", "Light (walks, 1–3 workouts a week)"],
  ["moderate", "Moderate (3–5 workouts a week)"],
  ["active", "Very active (6–7 workouts or physical job)"],
  ["athlete", "Athlete / twice-a-day training"],
] as const;
const CONDITIONS = CONDITION_LIST.map((c) => [c.key, c.label] as const);
const ALLERGIES = ["dairy", "gluten", "nuts", "peanut", "soy", "egg", "fish", "shellfish", "sesame"] as const;

type Form = { name: string; phone: string; email: string; age: string; sex: "male" | "female" | ""; heightCm: string; weightKg: string; goal: string; diet: string; cuisine: string; activity: string; mealsPerDay: string; wakeTime: string; conditions: string[]; allergies: string[]; notes: string; consent: boolean };

export function DietChartCheckout({ price, turnaround, gymName, whatsapp }: { price: number; turnaround: string; gymName: string; whatsapp: string }) {
  const [f, setF] = useState<Form>({ name: "", phone: "", email: "", age: "", sex: "", heightCm: "", weightKg: "", goal: "fat-loss", diet: "veg", cuisine: "any", activity: "light", mealsPerDay: "5", wakeTime: "06:30", conditions: [], allergies: [], notes: "", consent: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ paymentId: string } | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k: "conditions" | "allergies", v: string) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/diet-chart/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, age: Number(f.age), heightCm: Number(f.heightCm), weightKg: Number(f.weightKg), mealsPerDay: Number(f.mealsPerDay) }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Couldn't start the payment.");
      if (!(await loadCheckoutScript()) || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection and try again.");
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: gymName,
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#e8394b" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (r: RazorpayResponse) => {
          const v = await fetch("/api/diet-chart/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }) });
          const out = await v.json().catch(() => ({}));
          setBusy(false);
          if (v.ok) {
            setDone({ paymentId: r.razorpay_payment_id });
            requestAnimationFrame(() => document.getElementById("diet-result")?.scrollIntoView({ behavior: "smooth", block: "center" }));
          } else setError(`${out.error || "We couldn't confirm the payment."} Payment ID: ${r.razorpay_payment_id}`);
        },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description || "The payment failed. No money was taken — please try again.");
        setBusy(false);
      });
      rzp.open();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (done) {
    const msg = `Hi ${gymName}, I've paid for a personal diet chart. Name: ${f.name}. Payment ID: ${done.paymentId}.`;
    return (
      <div id="diet-result" className="glass brand-border scroll-mt-28 space-y-4 rounded-3xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <h2 className="font-display text-3xl text-white">Payment received</h2>
        <p className="text-white/75">Your coach will prepare your chart and send it on WhatsApp to {f.phone} within {turnaround}.</p>
        <p className="rounded-xl bg-white/5 px-4 py-3 font-mono text-sm text-white/80">Payment ID: {done.paymentId}</p>
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-[#25d366] px-6 py-3 font-bold text-white">
          Message us on WhatsApp
        </a>
      </div>
    );
  }

  const field = "field mt-1";
  const female = f.sex === "female";
  return (
    <form onSubmit={pay} className="glass brand-border space-y-6 rounded-3xl p-6 sm:p-8">
      <fieldset className="space-y-3">
        <legend className="font-display text-xl text-white">1. About you</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-white/70">
            Full name
            <input required minLength={2} maxLength={80} autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} className={field} />
          </label>
          <label className="text-sm text-white/70">
            WhatsApp number
            <input required type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
          </label>
          <label className="text-sm text-white/70">
            Email <span className="text-white/40">(optional)</span>
            <input type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} />
          </label>
          <div className="text-sm text-white/70">
            Sex
            <div role="radiogroup" aria-label="Sex" className="mt-1 flex gap-2">
              {(["male", "female"] as const).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={f.sex === s} onClick={() => set("sex", s)} className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold capitalize ring-1 ${f.sex === s ? "bg-brand text-white ring-brand" : "bg-white/[.03] text-white/70 ring-white/10"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <label className="text-sm text-white/70">
            Age (years)
            <input required type="number" min={16} max={80} value={f.age} onChange={(e) => set("age", e.target.value)} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-white/70">
              Height (cm)
              <input required type="number" min={130} max={220} value={f.heightCm} onChange={(e) => set("heightCm", e.target.value)} className={field} />
            </label>
            <label className="text-sm text-white/70">
              Weight (kg)
              <input required type="number" min={30} max={200} step={0.1} value={f.weightKg} onChange={(e) => set("weightKg", e.target.value)} className={field} />
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display text-xl text-white">2. Your goal and food</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["goal", "Goal", GOALS],
              ["diet", "Food preference", DIETS],
              ["cuisine", "Food you eat at home", CUISINES],
              ["activity", "How active are you?", ACTIVITY],
            ] as const
          ).map(([k, label, opts]) => (
            <label key={k} className="text-sm text-white/70">
              {label}
              <select value={f[k]} onChange={(e) => set(k, e.target.value)} className={field}>
                {opts.map(([v, l]) => (
                  <option key={v} value={v} className="bg-ink">
                    {l}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="text-sm text-white/70">
            Meals a day
            <select value={f.mealsPerDay} onChange={(e) => set("mealsPerDay", e.target.value)} className={field}>
              {["3", "4", "5", "6"].map((n) => (
                <option key={n} value={n} className="bg-ink">
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-white/70">
            You usually wake up at
            <input type="time" value={f.wakeTime} onChange={(e) => set("wakeTime", e.target.value)} className={field} />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display text-xl text-white">3. Health</legend>
        <p className="text-sm text-white/55">Tick anything that applies. Your coach adjusts the chart for it.</p>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.filter(([v]) => female || !FEMALE_ONLY.has(v)).map(([v, l]) => (
            <label key={v} className={`cursor-pointer rounded-xl px-3 py-2 text-sm ring-1 ${f.conditions.includes(v) ? "bg-brand/15 text-white ring-brand" : "bg-white/[.03] text-white/65 ring-white/10"}`}>
              <input type="checkbox" className="sr-only" checked={f.conditions.includes(v)} onChange={() => toggle("conditions", v)} />
              {l}
            </label>
          ))}
        </div>
        <p className="pt-2 text-sm text-white/55">Allergies or foods you don&apos;t eat:</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGIES.map((a) => (
            <label key={a} className={`cursor-pointer rounded-xl px-3 py-2 text-sm capitalize ring-1 ${f.allergies.includes(a) ? "bg-brand/15 text-white ring-brand" : "bg-white/[.03] text-white/65 ring-white/10"}`}>
              <input type="checkbox" className="sr-only" checked={f.allergies.includes(a)} onChange={() => toggle("allergies", a)} />
              {a}
            </label>
          ))}
        </div>
        <label className="block text-sm text-white/70">
          Anything else your coach should know? <span className="text-white/40">(optional)</span>
          <textarea maxLength={500} rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. night shifts, no time for breakfast, medicines you take" className={field} />
        </label>
      </fieldset>

      <label className="flex items-start gap-3 rounded-2xl bg-black/30 p-4 text-sm text-white/75">
        <input type="checkbox" required checked={f.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 accent-[#e8394b]" />
        <span>
          I agree that {gymName} stores these details to prepare my diet chart and contacts me on WhatsApp about it. The chart is general nutrition guidance, not medical treatment; with a medical condition I will check it with my doctor. See our <Link href="/privacy" className="underline">privacy policy</Link>.
        </span>
      </label>

      <div className="flex flex-col gap-4 rounded-2xl bg-black/30 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/55">Personal Indian diet chart · 7 days · PDF on WhatsApp</p>
          <p className="font-display text-3xl text-white">₹{price.toLocaleString("en-IN")}</p>
        </div>
        <button type="submit" disabled={busy || !f.sex} className="btn-brand inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 font-bold disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />} Pay ₹{price.toLocaleString("en-IN")}
        </button>
      </div>
      {!f.sex && <p className="text-xs text-white/45">Choose male or female above to continue.</p>}
      {error && (
        <p role="alert" className="rounded-xl bg-ember/15 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </form>
  );
}
