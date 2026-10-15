import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getContent } from "@/lib/content/store";
import { GrowthApp } from "@/components/admin/growth/GrowthApp";
import { nurtureBusiness } from "@/lib/growth/daily";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Growth & renewals · Admin", robots: { index: false, follow: false } };

export default async function GrowthPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [c, nb] = await Promise.all([getContent(), nurtureBusiness()]);
  const postBiz = { name: nb.name, phone: nb.phone, siteUrl: nb.siteUrl, coach: nb.coach, membershipFrom: nb.membershipFrom, address: nb.address };
  return <GrowthApp plans={c.plans.filter((p) => p.price > 0).map((p) => ({ name: p.name, duration: p.duration }))} gymName={c.business.name} postBiz={postBiz} />;
}
