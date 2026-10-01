import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { whatsappHref } from "@/lib/site";
import { razorpayConfigured } from "@/lib/payments/razorpay";
import { priceTable } from "@/lib/library/pricing";
import { Checkout } from "@/components/library/Checkout";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout — Premium Library", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const c = await getContent();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
      <Link href="/library" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Continue shopping
      </Link>
      <h1 className="font-display mb-8 mt-4 text-4xl text-white">Checkout</h1>
      <Checkout table={priceTable()} online={razorpayConfigured()} whatsappBase={whatsappHref(c.business, "")} />
      <p className="mt-10 text-center text-sm text-white/50">
        Already bought? <Link href="/library/recover" className="text-brand underline">Recover your downloads</Link>
      </p>
    </section>
  );
}
