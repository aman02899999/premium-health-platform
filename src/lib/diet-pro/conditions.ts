// Health conditions Diet Pro understands: one list for the coach's planner, the client's
// order form and the PDF. What each one changes lives in engine.ts (targets, warnings),
// meals.ts (foods left out) and program.ts (training).

export const CONDITION_LIST = [
  { key: "diabetes", label: "Diabetes / pre-diabetes" },
  { key: "hypertension", label: "High blood pressure" },
  { key: "cholesterol", label: "High cholesterol / triglycerides" },
  { key: "heart", label: "Heart disease" },
  { key: "fattyLiver", label: "Fatty liver" },
  { key: "hypothyroid", label: "Thyroid (hypothyroid)" },
  { key: "ckd", label: "Kidney disease" },
  { key: "kidneyStones", label: "Kidney stones" },
  { key: "gout", label: "Gout / high uric acid" },
  { key: "anaemia", label: "Anaemia / low haemoglobin" },
  { key: "gerd", label: "Acidity / acid reflux" },
  { key: "ibs", label: "IBS / bloating" },
  { key: "lactose", label: "Lactose intolerance" },
  { key: "osteoporosis", label: "Low bone density" },
  { key: "jointPain", label: "Knee / joint pain" },
  { key: "pcos", label: "PCOS / PCOD", female: true },
  { key: "menopause", label: "Menopause", female: true },
  { key: "pregnant", label: "Pregnant", female: true },
  { key: "lactating", label: "Breastfeeding", female: true },
] as const;

export type ConditionKey = (typeof CONDITION_LIST)[number]["key"];
export const CONDITION_KEYS = CONDITION_LIST.map((c) => c.key) as ConditionKey[];
export const FEMALE_ONLY = new Set<ConditionKey>(CONDITION_LIST.filter((c) => "female" in c && c.female).map((c) => c.key));

/** Labels of the conditions that are ticked, in list order. */
export const conditionLabels = (c: Partial<Record<ConditionKey, boolean>>) => CONDITION_LIST.filter((x) => c[x.key]).map((x) => x.label);
