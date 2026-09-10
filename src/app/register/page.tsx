import type { Metadata } from "next";
import { LoginClient } from "@/components/auth/LoginClient";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Register — Join Bharat Health Guide",
  description: "Create account — SSO optimized, premium earning features.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Register" }]} />
      <div className="mt-6 max-w-md mx-auto">
        <h1 className="font-display text-2xl font-black">Create Account — SSO Optimized</h1>
        <p className="mt-1 text-sm text-stone-600">Join to unlock premium, save thali plans, track health.</p>
        <div className="mt-4"><LoginClient /></div>
      </div>
    </div>
  );
}
