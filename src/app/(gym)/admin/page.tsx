import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { getContent } from "@/lib/content/store";
import { hubCounters } from "@/lib/admin/hub-data";
import { CommandCenter } from "@/components/admin/hub/CommandCenter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Command Center · Admin", robots: { index: false, follow: false } };

// The admin home: every tool in one launcher, with what needs a person today on top.
export default async function AdminHome() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [c, counters] = await Promise.all([getContent(), isDbConfigured ? hubCounters() : Promise.resolve(null)]);
  return <CommandCenter name={c.business.name} counters={counters} />;
}
