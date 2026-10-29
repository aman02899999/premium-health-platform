import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { AccountClient } from "@/components/auth/AccountClient";
import { PageHero } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <>
      <PageHero eyebrow="Members" title="My" highlight="account" intro="Sign in with Google or an email link to keep your workout plan, food log and progress in sync on every device." />
      <section className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <Suspense>
          <AccountClient />
        </Suspense>
        <Link prefetch={false} href="/app" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-sky hover:text-brand">
          <Smartphone className="h-4 w-4" /> Get the Royal Fitness app on your phone
        </Link>
      </section>
    </>
  );
}
