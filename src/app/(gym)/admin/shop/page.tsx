import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ShopAdmin } from "@/components/admin/shop/ShopAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Supplement store · Admin", robots: { index: false, follow: false } };

export default async function ShopAdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <ShopAdmin />;
}
