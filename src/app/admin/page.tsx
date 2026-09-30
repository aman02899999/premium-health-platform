import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { storageMode } from "@/lib/content/store";
import { AdminApp } from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AdminApp storage={storageMode} />;
}
