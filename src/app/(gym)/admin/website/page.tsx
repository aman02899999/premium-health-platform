import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { storageMode } from "@/lib/content/store";
import { AdminApp } from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Website content · Admin", robots: { index: false, follow: false } };

export default async function WebsiteContentPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdminApp storage={storageMode} />;
}
