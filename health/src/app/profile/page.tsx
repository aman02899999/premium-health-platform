import type { Metadata } from "next";
import { ProfileClient } from "@/components/auth/ProfileClient";
import { Breadcrumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your account, premium status and saved plans.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Profile" }]} />
      <div className="mt-6 max-w-3xl mx-auto">
        <ProfileClient />
      </div>
    </div>
  );
}
