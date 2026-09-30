import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { ProgressTracker } from "@/components/hub/ProgressTracker";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Weight & Waist Progress Tracker — Free",
    description: "Track your weight and waist over time with a simple chart. Private — data stays on your device.",
    path: "/progress",
  });
}

export default function ProgressPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Health Hub", path: "/health-hub" }, { name: "Progress", path: "/progress" }])} />
      <PageHero eyebrow="Progress tracker" title="See your" highlight="transformation" intro="Log weekly check-ins and watch the trend. Waist often drops even when the scale doesn't." />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ProgressTracker />
      </section>
    </>
  );
}
