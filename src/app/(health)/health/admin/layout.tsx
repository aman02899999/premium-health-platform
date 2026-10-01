import type { Metadata } from "next";

// Access control lives in each admin page (requireAdmin), which must run before
// the page renders anything. Admins are the emails in public.admins.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
