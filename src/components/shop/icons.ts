import { Atom, FlaskConical, Milk, Package, Pill, Sparkles, Weight, Zap, type LucideIcon } from "lucide-react";

const BY_SLUG: Record<string, LucideIcon> = {
  protein: Milk,
  "pre-workout": Zap,
  "amino-acids": FlaskConical,
  "multivitamins-tablets": Pill,
  creatine: Atom,
  "mass-gainer": Weight,
  accessories: Package,
};

/** Icon for a category; categories the admin adds later get a neutral one. */
export const categoryIcon = (slug: string): LucideIcon => BY_SLUG[slug] ?? Sparkles;
