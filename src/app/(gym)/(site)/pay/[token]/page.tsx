import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDbConfigured } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { requestByToken } from "@/lib/payments/requests";
import { PayRequest } from "@/components/pay/PayRequest";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment", robots: { index: false, follow: false } };

// A payment link sent from a WhatsApp chat: what it's for, how much, and a secure Pay button.
export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  if (!isDbConfigured) notFound();
  const { token } = await params;
  const [r, c] = await Promise.all([requestByToken(token), getContent()]);
  if (!r) notFound();
  return (
    <section className="mx-auto max-w-md px-4 pb-20 pt-28 sm:pt-32">
      <PayRequest token={token} gym={c.business.name} phone={c.business.phone} purpose={r.purpose} rupees={r.rupees} name={r.name} state={r.state} paymentId={r.paymentId} />
    </section>
  );
}
