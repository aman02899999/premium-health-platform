import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { PortalScene } from "@/components/portal/PortalScene";
import { shopOpen } from "@/lib/shop/server";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return {
    title: "Choose: Gym or Bharat Health Guide",
    description: `Enter ${c.business.name} (gym in Sector 93, Noida) or the Bharat Health Guide — one Google account for both.`,
    alternates: { canonical: "/portal" },
  };
}

// Shareable link that always opens the chooser.
export default async function PortalPage() {
  const [c, storeOpen] = await Promise.all([getContent(), shopOpen()]);
  return (
    <main className="bg-ink">
      <PortalScene gymName={c.business.name} storeOpen={storeOpen} />
    </main>
  );
}
