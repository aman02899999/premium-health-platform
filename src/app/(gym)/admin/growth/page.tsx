import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getContent } from "@/lib/content/store";
import { GrowthApp } from "@/components/admin/growth/GrowthApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Growth & renewals · Admin", robots: { index: false, follow: false } };

export default async function GrowthPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const c = await getContent();
  return <GrowthApp plans={c.plans.filter((p) => p.price > 0).map((p) => ({ name: p.name, duration: p.duration }))} gymName={c.business.name} />;
}
