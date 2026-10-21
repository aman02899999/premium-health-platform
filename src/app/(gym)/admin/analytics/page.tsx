import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { isDbConfigured } from "@/health/db";
import { analyticsRange } from "@/lib/admin/hub";
import { analyticsData } from "@/lib/admin/hub-data";
import { listCampaigns } from "@/lib/growth/campaigns";
import { AnalyticsApp } from "@/components/admin/hub/AnalyticsApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics · Admin", robots: { index: false, follow: false } };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const range = analyticsRange((await searchParams).days);
  if (!isDbConfigured) return <AnalyticsApp range={range} data={null} campaigns={[]} />;
  const [data, campaigns] = await Promise.all([analyticsData(range), listCampaigns(10).catch(() => [])]);
  return <AnalyticsApp range={range} data={data} campaigns={campaigns} />;
}
