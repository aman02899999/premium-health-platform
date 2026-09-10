import type { Metadata } from "next";
import { LoginClient } from "@/components/auth/LoginClient";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Login — SSO Optimized",
  description: "Login with Google SSO or email — secure, JWT-ready, OAuth-ready. Educational platform.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Login" }]} />
      <div className="mt-6 max-w-md mx-auto">
        <LoginClient />
      </div>
    </div>
  );
}
