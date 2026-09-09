import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Bharat Health Guide handles data: minimal collection, no health-data sale, newsletter consent and cookie notes." };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy" }]} />
      <h1 className="font-display mt-3 text-3xl font-black">Privacy Policy</h1>
      <p className="mt-1 text-xs text-stone-500">Last updated: August 2026</p>
      <div className="prose-health mt-4 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-[14px] leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
        <p><strong>Minimal by design.</strong> We do not require accounts to read. Newsletter signup collects only your email with consent; calculators and symptom tools run in your browser and are not stored on our servers.</p>
        <p><strong>What we collect:</strong> newsletter email (if you subscribe), contact-form messages, and aggregate, anonymised page-view counts for the admin dashboard. We never sell personal data.</p>
        <p><strong>Health information:</strong> Do not send sensitive health records by email or forms. We do not store personal health information unless a clear privacy/security architecture with explicit consent exists.</p>
        <p><strong>Cookies:</strong> Theme and motion preferences are stored locally in your browser. If advertising (e.g., AdSense) is enabled later, third-party cookies will be disclosed here with opt-out links.</p>
        <p><strong>Your rights:</strong> Email care@bharathealthguide.in to access, correct or delete your newsletter data, or to unsubscribe (one click, no dark patterns).</p>
      </div>
    </div>
  );
}
