import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ReviewsAdmin } from "@/components/admin/reviews/ReviewsAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reviews · Admin", robots: { index: false, follow: false } };

export default async function ReviewsAdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <ReviewsAdmin />;
}
