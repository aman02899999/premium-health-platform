import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { PortalScene } from "@/components/portal/PortalScene";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return {
    title: "Choose: Royal Fitness Club or Premium Health Platform",
    description: `Enter ${c.business.name} (gym in Sector 93, Noida) or the Premium Health Platform — one Google account for both.`,
    alternates: { canonical: "/portal" },
  };
}

// Shareable link that always opens the chooser.
export default async function PortalPage() {
  const c = await getContent();
  return (
    <main className="bg-ink">
      <PortalScene gymName={c.business.name} />
    </main>
  );
}
