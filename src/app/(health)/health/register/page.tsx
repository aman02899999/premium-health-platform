import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "@/health/components/auth/LoginClient";
import { Breadcrumbs } from "@/health/components/ui";

export const metadata: Metadata = {
  title: "Register — Join Premium Health Platform",
  description: "Create an account with Google or an email link.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Register" }]} />
      <div className="mt-6 max-w-md mx-auto">
        <h1 className="font-display text-2xl font-black">Create your account</h1>
        <p className="mt-1 text-sm text-stone-600">Join to unlock premium, save thali plans, track health.</p>
        <div className="mt-4"><Suspense><LoginClient /></Suspense></div>
      </div>
    </div>
  );
}
