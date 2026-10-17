import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AudienceApp } from "@/components/admin/audience/AudienceApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audience & campaigns · Admin", robots: { index: false, follow: false } };

export default async function AudiencePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AudienceApp />;
}
