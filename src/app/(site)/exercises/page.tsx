import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { EXERCISES } from "@/lib/fitness/exercises";
import { breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { ExerciseExplorer } from "@/components/hub/ExerciseExplorer";
import { PageHero } from "@/components/ui/Section";
import { JsonLd } from "@/components/ui/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContent();
  return pageMeta(c, {
    title: "Exercise Library — Gym Exercises by Muscle with Form Guides",
    description: `${EXERCISES.length} gym and home exercises with step-by-step form, tips and common mistakes. Filter by muscle on an interactive body map.`,
    path: "/exercises",
  });
}

export default function ExercisesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Health Hub", path: "/health-hub" }, { name: "Exercises", path: "/exercises" }]),
          { "@context": "https://schema.org", "@type": "ItemList", itemListElement: EXERCISES.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/exercises/${e.slug}`), name: e.name })) },
        ]}
      />
      <PageHero eyebrow="Exercise library" title="Train every" highlight="muscle right" intro="Tap a muscle on the body map or filter by equipment. Every exercise has form steps, tips and mistakes to avoid." />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <ExerciseExplorer />
      </section>
    </>
  );
}
