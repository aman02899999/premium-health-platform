import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { WorkoutPlanner } from "@/components/hub/WorkoutPlanner";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Free Workout Planner — Gym & Home Workout Plan Generator",
    description: "Generate a free 2–6 day workout plan for muscle gain, fat loss or strength. Gym or home, beginner to advanced. Edit, print or share on WhatsApp.",
    path: "/workout-planner",
  });
}

export default async function PlannerPage() {
  const c = await getContent();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Health Hub", path: "/health-hub" }, { name: "Workout Planner", path: "/workout-planner" }])} />
      <PageHero eyebrow="Workout planner" title="Your plan," highlight="in seconds" intro="Choose your goal, days and experience. Tweak sets and reps, then save, print or share it." />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <WorkoutPlanner gymName={c.business.name} />
      </section>
    </>
  );
}
