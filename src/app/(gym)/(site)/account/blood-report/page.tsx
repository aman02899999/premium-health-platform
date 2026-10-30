import type { Metadata } from "next";
import { Lock, MessageCircle, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/ui/Section";
import { SignInOptions } from "@/components/auth/AuthButtons";
import { BloodReportApp, type PickerMarker } from "@/components/account/BloodReportApp";
import { getContent } from "@/lib/content/store";
import { PANELS } from "@/lib/lab/markers";
import { labViewer } from "@/lib/lab/session";
import { liveMarkers, savingEnabled } from "@/lib/lab/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blood Report Analyser", robots: { index: false, follow: false } };

export default async function BloodReportPage() {
  const viewer = await labViewer();
  const c = await getContent();
  const wa = `https://wa.me/${c.business.whatsapp}?text=${encodeURIComponent("Hi, please switch on the blood report analyser for my account.")}`;

  let markers: PickerMarker[] = [];
  if (viewer?.allowed) {
    markers = (await liveMarkers().catch(() => []))
      .filter((m) => !m.hidden)
      .map((m) => ({ id: m.id, name: m.name, aliases: m.aliases, panel: m.panel, unit: m.unit, units: [m.unit, ...(m.altUnits ?? []).map((u) => u.unit)] }));
  }

  return (
    <>
      <PageHero
        eyebrow="Members"
        title="Blood report"
        highlight="analyser"
        intro="Upload your lab's PDF or type in the numbers from your blood report, and see, in plain words, what each one means, what's in range, and what you can do about it with food and lifestyle."
      />
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        {!viewer ? (
          <div className="glass brand-border mx-auto max-w-md space-y-5 rounded-3xl p-6 text-center sm:p-8">
            <Lock className="mx-auto h-8 w-8 text-brand" />
            <p className="text-white/80">Sign in with the email you gave us when you joined or bought your diet plan.</p>
            <SignInOptions next="/account/blood-report" />
          </div>
        ) : !viewer.allowed ? (
          <div className="glass brand-border mx-auto max-w-lg space-y-4 rounded-3xl p-6 text-center sm:p-8">
            <ShieldCheck className="mx-auto h-8 w-8 text-brand" />
            <h2 className="font-display text-2xl text-white">Not switched on yet</h2>
            <p className="text-white/70">
              The analyser is included for Royal Fitness Club members and diet plan clients. You&apos;re signed in as <b className="text-white">{viewer.email}</b>. If that&apos;s the email you joined with, message us and we&apos;ll switch it on.
            </p>
            <a href={wa} className="btn-brand inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold">
              <MessageCircle className="h-4 w-4" /> Ask us on WhatsApp
            </a>
          </div>
        ) : (
          <BloodReportApp email={viewer.email} panels={PANELS} markers={markers} saving={savingEnabled()} />
        )}
      </section>
    </>
  );
}
