import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminRole } from "@/lib/auth";
import { HealthReviewApp } from "@/components/admin/health-review/HealthReviewApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Health page review · Admin", robots: { index: false, follow: false } };

export default async function HealthReviewPage() {
  const role = await adminRole();
  if (!role) redirect("/admin/login");
  if (role === "agent") redirect("/admin?denied=1");
  return <HealthReviewApp />;
}
