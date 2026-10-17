import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ChatsApp } from "@/components/admin/chats/ChatsApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "WhatsApp chats · Admin", robots: { index: false, follow: false } };

export default async function ChatsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <ChatsApp />;
}
