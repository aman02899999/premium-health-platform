import { NextResponse } from "next/server";
import { wgerProvider } from "@/services/health/providers/wger/provider";

// Workout plans are not directly in wger public API, so we synthesize from exercises + local plans
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim() || "beginner";
  const limit = Math.min(20, Number(searchParams.get("limit") || 10));

  // For now, return exercise-based workout suggestions
  const exercises = await wgerProvider.search({ query: q, limit });

  const plans = [
    {
      id: "beginner-full-body",
      name: "Beginner Full Body (3 days/week)",
      description: "Traditional full body routine for beginners using wger exercises",
      difficulty: "beginner",
      daysPerWeek: 3,
      exercises: exercises.data.slice(0, 6).map((e: { id: string; name: string }) => ({ exerciseId: e.id, name: e.name, sets: 3, reps: "10-12", restSeconds: 60 })),
      provenance: { source: "BHG + wger", source_id: "beginner-full-body", license: "AGPL-3.0 + BHG", retrieved_at: new Date().toISOString() },
    },
    {
      id: "intermediate-push-pull-legs",
      name: "Push Pull Legs (6 days)",
      description: "Intermediate split",
      difficulty: "intermediate",
      daysPerWeek: 6,
      exercises: exercises.data.slice(0, 8).map((e: { id: string; name: string }) => ({ exerciseId: e.id, name: e.name, sets: 4, reps: "8-10", restSeconds: 90 })),
      provenance: { source: "BHG + wger", source_id: "ppl", license: "AGPL-3.0 + BHG", retrieved_at: new Date().toISOString() },
    },
  ];

  return NextResponse.json({ data: plans, total: plans.length, source: "BHG synthesized + wger", live: exercises.live, fetchedAt: new Date().toISOString() });
}
