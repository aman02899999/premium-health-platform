import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountClient } from "@/components/auth/AccountClient";
import { PageHero } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <>
      <PageHero eyebrow="Members" title="My" highlight="account" intro="Sign in with Google to keep your workout plan, food log and progress in sync on every device." />
      <section className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <Suspense>
          <AccountClient />
        </Suspense>
      </section>
    </>
  );
}
