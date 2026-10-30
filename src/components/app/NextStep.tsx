import Link from "next/link";
import { ArrowRight, Dumbbell, Salad } from "lucide-react";
import { DIET_PLANS } from "@/lib/growth/config";

type Kind = "food" | "progress" | "workout";

/** One quiet, relevant offer under a free tool: the diet chart for food and progress, the gym for workouts. */
export function NextStep({ kind }: { kind: Kind }) {
  const trial = DIET_PLANS.find((p) => p.trial);
  const gym = kind === "workout" || !trial;
  const copy = gym
    ? { icon: Dumbbell, title: "Want a coach to check your form?", text: "Train this plan at Royal Fitness Club, Sector 93, with coaches on the floor. Book a free trial session first.", cta: "See membership plans", href: "/membership" }
    : {
        icon: Salad,
        title: kind === "food" ? "Not sure what to eat for your goal?" : "Scale not moving the way you want?",
        text: `A coach builds a diet chart around your body, goal and the food you like. It shows up in this app. Try the ${trial.name} for ₹${trial.priceRupees}.`,
        cta: `Get my chart for ₹${trial.priceRupees}`,
        href: "/diet-chart?plan=trial#order",
      };
  return (
    <aside className="glass brand-border mt-10 flex flex-col items-start gap-4 rounded-3xl p-6 sm:flex-row sm:items-center">
      <copy.icon className="h-8 w-8 shrink-0 text-brand" />
      <div className="flex-1">
        <h2 className="font-semibold text-white">{copy.title}</h2>
        <p className="mt-1 text-sm text-white/65">{copy.text}</p>
      </div>
      <Link href={copy.href} className="btn-brand inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold">
        {copy.cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}
