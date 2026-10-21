import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ContactsApp } from "@/components/admin/contacts/ContactsApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contacts · Admin", robots: { index: false, follow: false } };

export default async function ContactsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <ContactsApp />;
}
