import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "@/components/auth/LoginClient";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with Google or an email link — one account for Premium Health Platform and Royal Fitness Club.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Login" }]} />
      <div className="mt-6 max-w-md mx-auto">
        <Suspense><LoginClient /></Suspense>
      </div>
    </div>
  );
}
