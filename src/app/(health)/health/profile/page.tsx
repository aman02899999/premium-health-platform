import type { Metadata } from "next";
import { ProfileClient } from "@/health/components/auth/ProfileClient";
import { Breadcrumbs } from "@/health/components/ui";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your account, premium status and saved plans.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/health" }, { label: "Profile" }]} />
      <div className="mt-6 max-w-3xl mx-auto">
        <ProfileClient />
      </div>
    </div>
  );
}
