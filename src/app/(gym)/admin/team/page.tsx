import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminRole } from "@/lib/auth";
import { TeamApp } from "@/components/admin/team/TeamApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Team & agents · Admin", robots: { index: false, follow: false } };

export default async function TeamPage() {
  const role = await adminRole();
  if (!role) redirect("/admin/login");
  if (role !== "owner") redirect("/admin?denied=1");
  return <TeamApp />;
}
