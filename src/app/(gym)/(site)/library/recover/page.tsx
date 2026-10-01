import type { Metadata } from "next";
import { RecoverForm } from "@/components/library/RecoverForm";

export const metadata: Metadata = { title: "Recover Your Library Downloads", robots: { index: false, follow: true } };

export default function RecoverPage() {
  return (
    <section className="mx-auto max-w-md px-4 pb-24 pt-32 sm:px-6">
      <h1 className="font-display text-3xl text-white">Recover your books</h1>
      <p className="mt-3 text-white/65">Enter the email you used at checkout and the payment ID from your Razorpay receipt (SMS or email from Razorpay).</p>
      <div className="mt-8">
        <RecoverForm />
      </div>
    </section>
  );
}
