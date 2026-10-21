import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdsApp } from "@/components/admin/ads/AdsApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ads Manager · Admin", robots: { index: false, follow: false } };

export default async function AdsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdsApp />;
}
