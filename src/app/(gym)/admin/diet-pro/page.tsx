import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth";
import { getContent } from "@/lib/content/store";
import { fullAddress, SITE_URL } from "@/lib/site";
import { DietProLoader } from "@/components/admin/diet-pro/DietProLoader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Diet Pro · Admin", robots: { index: false, follow: false } };

export default async function DietProPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [content, user] = await Promise.all([getContent(), currentUser()]);
  const b = content.business;
  const coach = content.trainers?.[0]?.name || user?.name || b.shortName;
  return (
    <DietProLoader
      business={{ name: b.name, phone: b.phone, address: fullAddress(b), instagram: b.instagram, site: SITE_URL.replace(/^https?:\/\//, "") }}
      coach={coach}
    />
  );
}
