import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminRole } from "@/lib/auth";
import { ChallengeAdmin } from "@/components/admin/challenge/ChallengeAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Knowledge Challenge · Admin", robots: { index: false, follow: false } };

export default async function ChallengeAdminPage() {
  const role = await adminRole();
  if (!role) redirect("/admin/login");
  if (role === "reviewer") redirect("/admin?denied=1");
  return <ChallengeAdmin canManage={role === "owner" || role === "manager"} />;
}
