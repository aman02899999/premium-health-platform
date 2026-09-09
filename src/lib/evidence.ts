export type EvidenceLevel =
  | "strong"
  | "moderate"
  | "limited"
  | "mixed"
  | "insufficient";

export const EVIDENCE_META: Record<
  EvidenceLevel,
  { label: string; color: string; bg: string; border: string; dot: string; description: string }
> = {
  strong: {
    label: "Strong evidence",
    color: "text-emerald-800 dark:text-emerald-200",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    description: "Consistent support from high-quality trials, reviews or guidelines.",
  },
  moderate: {
    label: "Moderate evidence",
    color: "text-sky-800 dark:text-sky-200",
    bg: "bg-sky-50 dark:bg-sky-950/60",
    border: "border-sky-200 dark:border-sky-800",
    dot: "bg-sky-500",
    description: "Supportive but limited studies; benefit likely, more data helpful.",
  },
  limited: {
    label: "Limited evidence",
    color: "text-amber-800 dark:text-amber-200",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-400",
    description: "Small, short or preliminary studies; traditional use may exceed proof.",
  },
  mixed: {
    label: "Mixed evidence",
    color: "text-orange-800 dark:text-orange-200",
    bg: "bg-orange-50 dark:bg-orange-950/60",
    border: "border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
    description: "Studies disagree; effects may depend on dose, form or population.",
  },
  insufficient: {
    label: "Insufficient evidence",
    color: "text-rose-800 dark:text-rose-200",
    bg: "bg-rose-50 dark:bg-rose-950/60",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
    description: "No reliable clinical evidence; claims rest on tradition or theory.",
  },
};

export type EvidenceItem = {
  intervention: string;
  category:
    | "Modern medicine"
    | "Ayurveda"
    | "Herb"
    | "Homeopathy"
    | "Nutrition"
    | "Lifestyle"
    | "Complementary";
  level: EvidenceLevel;
  benefit: string;
  limitations: string;
  safety: string;
};

export function evidenceLabel(level: EvidenceLevel) {
  return EVIDENCE_META[level].label;
}
