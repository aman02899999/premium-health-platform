"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";

const GOALS = ["Fat loss", "Muscle gain", "General fitness", "Personal training", "Women's fitness", "Other"];

export function LeadForm({ whatsapp, gymName, source = "website" }: { whatsapp: string; gymName: string; source?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [waLink, setWaLink] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form) as Record<string, string>;
    setState("sending");
    setError("");
    const message = `Hi ${gymName}! I'm ${data.name}. I'd like a free trial. Goal: ${data.goal}.${data.message ? ` ${data.message}` : ""}`;
    setWaLink(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...data, source }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not send — please WhatsApp us instead.");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
          <Check className="h-8 w-8 text-gold" />
        </div>
        <h3 className="font-display mt-5 text-3xl text-white">You&apos;re booked in!</h3>
        <p className="mt-3 text-white/70">We&apos;ll call you shortly to fix your trial time. Want it faster? Send the same details on WhatsApp.</p>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-bold text-white">
          <WhatsAppIcon className="h-5 w-5" /> Confirm on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass gold-border space-y-4 rounded-3xl p-6 sm:p-8">
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
        <span className="mb-1.5 block text-sm text-white/75">Your goal</span>
        <select name="goal" className="field" defaultValue={GOALS[0]}>
          {GOALS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-white/75">Preferred time / message</span>
        <textarea name="message" rows={3} maxLength={600} className="field" placeholder="e.g. Evenings after 7 PM" />
      </label>
      {/* Honeypot for bots */}
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state === "error" && (
        <p className="rounded-xl bg-ember/15 px-4 py-3 text-sm text-red-200" role="alert">
          {error}{" "}
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="underline">
            Send on WhatsApp
          </a>
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="btn-gold flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-bold disabled:opacity-70">
        {state === "sending" && <Loader2 className="h-5 w-5 animate-spin" />}
        Book My Free Trial
      </button>
      <p className="text-center text-xs text-white/45">No spam. We only call to schedule your session.</p>
    </form>
  );
}
