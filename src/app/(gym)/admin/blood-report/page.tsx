import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminRole } from "@/lib/auth";
import { BloodReportAdmin } from "@/components/admin/blood-report/BloodReportAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blood report analyser · Admin", robots: { index: false, follow: false } };

export default async function BloodReportAdminPage() {
  const role = await adminRole();
  if (!role) redirect("/admin/login");
  return <BloodReportAdmin owner={role === "owner"} />;
}
