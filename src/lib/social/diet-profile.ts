// What a diet enquiry on WhatsApp / Instagram tells us about the person, so the first reply can be
// about their goal ("Need a fat loss diet plan", "PCOD diet chart chahiye", "muscle gain veg diet").
// Pure and forgiving: misspellings and Hinglish are common, and anything unknown stays null.

export type Goal = "fat-loss" | "muscle-gain" | "weight-gain" | "toning" | "general";
export type Condition = "pcos" | "thyroid" | "diabetes" | "bp";
export type Food = "veg" | "egg" | "non-veg";
export type DietProfile = { goal: Goal; condition: Condition | null; food: Food | null };

// Order matters: "weight gain" must win over "weight", "lose belly fat" over "gain".
const GOALS: [Exclude<Goal, "general">, RegExp][] = [
  ["weight-gain", /\b(weight\s*gain|gain\s*weight|wajan\s*badh|vajan\s*badh|patla|skinny|underweight|thin)/i],
  ["muscle-gain", /\b(muscle|bulk|bulking|mass|gain|six\s*pack|abs|body\s*bana)/i],
  ["fat-loss", /\b(fat|lo+se|loss|weight|slim|belly|tummy|motapa|mota|vajan|wajan|pet\s*kam|cutting|obes)/i],
  ["toning", /\b(ton(e|ed|ing)|shape|fit\s*body|lean)/i],
];
const CONDITIONS: [Condition, RegExp][] = [
  ["pcos", /\b(pcos|pcod|period|irregular)/i],
  ["thyroid", /\b(thyroid|hypothyroid|thyro)/i],
  ["diabetes", /\b(diabet|sugar|insulin|prediabet)/i],
  ["bp", /\b(bp|blood\s*pressure|hypertension)\b/i],
];
const FOODS: [Food, RegExp][] = [
  ["non-veg", /\b(non[\s-]?veg|nonveg|chicken|fish|mutton|meat)/i],
  ["egg", /\b(egg|eggs|anda|eggetarian)/i],
  ["veg", /\b(veg|vegetarian|shakahari|jain|no\s*egg)/i],
];

const first = <T>(rules: [T, RegExp][], text: string): T | null => rules.find(([, re]) => re.test(text))?.[0] ?? null;

export function dietProfile(text: string): DietProfile {
  return { goal: first(GOALS, text) ?? "general", condition: first(CONDITIONS, text), food: first(FOODS, text) };
}

export const GOAL_TITLE: Record<Goal, string> = {
  "fat-loss": "Fat-Loss Program",
  "muscle-gain": "Muscle-Gain Program",
  "weight-gain": "Healthy Weight-Gain Program",
  toning: "Body Toning Program",
  general: "Diet & Fitness Program",
};

export const CONDITION_LABEL: Record<Condition, string> = { pcos: "PCOS / PCOD", thyroid: "thyroid", diabetes: "blood sugar", bp: "blood pressure" };
