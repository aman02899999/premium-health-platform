import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { QrApp } from "@/components/admin/qr/QrApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "QR codes & opt-ins · Admin", robots: { index: false, follow: false } };

export default async function QrPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <QrApp />;
}
