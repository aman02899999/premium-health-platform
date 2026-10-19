"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { CalendarPlus, Check, Loader2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { newEventId, trackPixel } from "@/lib/meta-pixel";
import { formatTrial, timeLabel, toInstant, trialSlots, type Hours, type SlotDay } from "@/lib/growth/trials";

const GOALS = ["Fat loss", "Muscle gain", "General fitness", "Personal training", "Women's fitness", "Other"];
const CALL_ME = "call";
const noSubscribe = () => () => {};
const currentQuarterHour = () => Math.floor(Date.now() / 900_000);

/** Google Calendar "add event" link for the booked hour. */
function calendarLink(at: string, gymName: string, address: string) {
  const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(new Date(at).getTime() + 60 * 60_000).toISOString();
  const q = new URLSearchParams({ action: "TEMPLATE", text: `Free trial at ${gymName}`, dates: `${stamp(at)}/${stamp(end)}`, location: address, details: "Bring sports shoes and a water bottle." });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function LeadForm({ whatsapp, gymName, source = "website", hours = [], address = "" }: { whatsapp: string; gymName: string; source?: string; hours?: Hours; address?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [waLink, setWaLink] = useState("");
  // Slots depend on the visitor's clock, so they're worked out in the browser (none on the server).
  const quarter = useSyncExternalStore(noSubscribe, currentQuarterHour, () => null);
  const slots = useMemo<SlotDay[]>(() => (quarter ? trialSlots(hours) : []), [quarter, hours]);
  const [picked, setPicked] = useState<string | null>(null);
  const day = picked ?? slots[0]?.date ?? CALL_ME;
  const [time, setTime] = useState("");
  const [booked, setBooked] = useState<string | null>(null);
  const times = slots.find((s) => s.date === day)?.times ?? [];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form) as Record<string, string>;
    setState("sending");
    setError("");
    const at = day !== CALL_ME && time ? toInstant(day, time) : null;
    const message = `Hi ${gymName}! I'm ${data.name}. I'd like a free trial${at ? ` on ${formatTrial(at)}` : ""}. Goal: ${data.goal}.${data.message ? ` ${data.message}` : ""}`;
    setWaLink(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`);
    try {
      const eventId = newEventId();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, source, eventId, ...(at ? { trialDate: day, trialTime: time } : {}) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not send — please WhatsApp us instead.");
      trackPixel("Lead", { content_name: "free-trial" }, eventId);
      if (at) trackPixel("Schedule", { content_name: "free-trial" });
      setBooked(at);
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/15">
          <Check className="h-8 w-8 text-brand" />
        </div>
        {booked ? (
          <>
            <h3 className="font-display mt-5 text-3xl text-white">See you {formatTrial(booked)}</h3>
            <p className="mt-3 text-white/70">
              Your free trial is booked{address ? ` at ${address}` : ""}. Bring sports shoes and a water bottle. Need another time? Message us on WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href={calendarLink(booked, gymName, address)} target="_blank" rel="noopener noreferrer" className="btn-brand inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold">
                <CalendarPlus className="h-5 w-5" /> Add to calendar
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" data-no-capture className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-bold text-white">
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp us
              </a>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-display mt-5 text-3xl text-white">You&apos;re booked in!</h3>
            <p className="mt-3 text-white/70">We&apos;ll call you shortly to fix your trial time. Want it faster? Send the same details on WhatsApp.</p>
            <a href={waLink} target="_blank" rel="noopener noreferrer" data-no-capture className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-bold text-white">
              <WhatsAppIcon className="h-5 w-5" /> Confirm on WhatsApp
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass brand-border space-y-4 rounded-3xl p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/75">Your name *</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" placeholder="e.g. Rahul Sharma" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/75">Mobile number *</span>
          <input name="phone" required type="tel" inputMode="tel" pattern="[0-9+\-\s]{10,15}" autoComplete="tel" className="field" placeholder="10-digit mobile" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm text-white/75">Email (optional, for your trial confirmation)</span>
        <input name="email" type="email" maxLength={120} autoComplete="email" className="field" placeholder="you@example.com" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-white/75">Your goal</span>
        <select name="goal" className="field" defaultValue={GOALS[0]}>
          {GOALS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/75">Trial day *</span>
          <select value={day} onChange={(e) => (setPicked(e.target.value), setTime(""))} className="field">
            {slots.map((s) => (
              <option key={s.date} value={s.date}>
                {s.label}
              </option>
            ))}
            <option value={CALL_ME}>Call me to fix a time</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/75">Time {day !== CALL_ME && "*"}</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} required={day !== CALL_ME} disabled={day === CALL_ME} className="field disabled:opacity-50">
            <option value="">{day === CALL_ME ? "We'll call you" : "Pick a time"}</option>
            {times.map((t) => (
              <option key={t} value={t}>
                {timeLabel(t)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm text-white/75">Anything we should know? (optional)</span>
        <textarea name="message" rows={2} maxLength={600} className="field" placeholder="e.g. Knee injury, first time in a gym" />
      </label>
      {/* Honeypot for bots */}
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state === "error" && (
        <p className="rounded-xl bg-ember/15 px-4 py-3 text-sm text-red-200" role="alert">
          {error}{" "}
          <a href={waLink} target="_blank" rel="noopener noreferrer" data-no-capture className="underline">
            Send on WhatsApp
          </a>
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="btn-brand flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-bold disabled:opacity-70">
        {state === "sending" && <Loader2 className="h-5 w-5 animate-spin" />}
        Book My Free Trial
      </button>
      <p className="text-center text-xs text-white/45">No spam. We&apos;ll call or WhatsApp you only about your trial: a confirmation, a reminder on the day, and a follow-up after.</p>
    </form>
  );
}
