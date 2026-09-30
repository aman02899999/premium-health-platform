import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { GymTimers } from "@/components/hub/GymTimers";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Free Gym Timer — Tabata, HIIT, Rest Timer & Breathing",
    description: "Free online gym timer with Tabata, custom HIIT intervals, rest timer with beeps and a guided pranayama breathing timer.",
    path: "/timers",
  });
}

export default function TimersPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Health Hub", path: "/health-hub" }, { name: "Gym Timers", path: "/timers" }])} />
      <PageHero eyebrow="Gym timers" title="Every second" highlight="counts" intro="Audio beeps, big numbers and your screen stays on — made to use on the gym floor." />
      <section className="px-4 py-10 sm:px-6">
        <GymTimers />
      </section>
    </>
  );
}
