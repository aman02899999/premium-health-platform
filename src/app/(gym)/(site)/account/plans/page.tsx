import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { isDbConfigured } from "@/health/db";
import { currentCustomer } from "@/lib/shop/server";
import { ordersForCustomer } from "@/lib/growth/client-plans";
import { dietPlan } from "@/lib/growth/config";
import { entitlementMessage } from "@/lib/growth/entitlement";
import { PageHero } from "@/components/ui/Section";
import { SignInOptions } from "@/components/auth/AuthButtons";
import { LockedPlans } from "@/components/account/LockedPlans";
import { PlanDashboard, type DashboardOrder } from "@/components/account/PlanDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Plans", robots: { index: false, follow: false } };

export default async function MyPlansPage() {
  const customer = await currentCustomer();
  const orders = customer && isDbConfigured ? await ordersForCustomer(customer).catch(() => []) : [];

  // Only what the client needs leaves the server: no storage paths, no other client's data.
  const safe: DashboardOrder[] = orders.map((o) => {
    const last = [...o.versions].reverse().find((v) => v.status !== "rejected")?.intake ?? o.intake;
    return {
      id: o.id,
      planName: dietPlan(o.plan).name,
      paidAt: o.paidAt ?? o.createdAt,
      entitlement: { ...o.entitlement, message: entitlementMessage(o.entitlement) },
      versions: o.versions.filter((v) => v.status !== "rejected").map((v) => ({ id: v.id, version: v.version, createdAt: v.createdAt, ready: v.status === "sent", weightKg: v.intake.weightKg })),
      current: { sex: last.sex, weightKg: last.weightKg, waistCm: last.waistCm ?? null, goal: last.goal, activity: last.activity, trainingDays: last.trainingDays ?? null, conditions: last.conditions, medicines: last.medicines ?? "", age: last.age },
    };
  });

  return (
    <>
      <PageHero eyebrow="Members" title="My" highlight="plans" intro="Your personal diet and workout plans, built on your body numbers. Update them as you progress." />
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        {!customer ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="glass brand-border h-fit space-y-5 rounded-3xl p-6 text-center sm:p-8">
              <Lock className="mx-auto h-8 w-8 text-brand" />
              <p className="text-white/80">Sign in with the email you used when you paid. Your plans appear here automatically.</p>
              <SignInOptions next="/account/plans" />
            </div>
            <LockedPlans />
          </div>
        ) : safe.length === 0 ? (
          <div className="space-y-6">
            <p className="glass rounded-2xl p-4 text-sm text-white/70">
              Signed in as <b className="text-white">{customer.email}</b>. No paid plan is linked to this email yet. Paid with a different email? Sign out and sign in with that one, or{" "}
              <Link href="/contact" className="underline">message us</Link>.
            </p>
            <LockedPlans />
          </div>
        ) : (
          <PlanDashboard email={customer.email} orders={safe} />
        )}
      </section>
    </>
  );
}
