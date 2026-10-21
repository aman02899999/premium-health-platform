import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AiAgentApp } from "@/components/admin/ai/AiAgentApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI agent · Admin", robots: { index: false, follow: false } };

export default async function AiAgentPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <AiAgentApp />;
}
