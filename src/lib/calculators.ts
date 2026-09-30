// Pure fitness formulas shared by the /tools pages and blog embeds.

export type Sex = "male" | "female";

const round = (n: number, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;

// ---------- BMI (Asian-Indian cut-offs, WHO expert consultation 2004) ----------
export function bmi(weightKg: number, heightCm: number) {
  const m = heightCm / 100;
  const value = weightKg / (m * m);
  const category =
    value < 18.5 ? "Underweight" : value < 23 ? "Healthy" : value < 25 ? "Overweight" : value < 30 ? "Obese (Class I)" : "Obese (Class II+)";
  const healthyMin = round(18.5 * m * m);
  const healthyMax = round(22.9 * m * m);
  return { value: round(value), category, healthyMin, healthyMax };
}

// ---------- BMR / TDEE (Mifflin-St Jeor) ----------
export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary (desk job, little exercise)", factor: 1.2 },
  { id: "light", label: "Light (1–3 workouts / week)", factor: 1.375 },
  { id: "moderate", label: "Moderate (3–5 workouts / week)", factor: 1.55 },
  { id: "active", label: "Very active (6–7 workouts / week)", factor: 1.725 },
  { id: "athlete", label: "Athlete (2× a day / physical job)", factor: 1.9 },
] as const;
export type ActivityId = (typeof ACTIVITY_LEVELS)[number]["id"];

export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number) {
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161));
}

export function tdee(sex: Sex, weightKg: number, heightCm: number, age: number, activity: ActivityId) {
  const base = bmr(sex, weightKg, heightCm, age);
  const factor = ACTIVITY_LEVELS.find((a) => a.id === activity)?.factor ?? 1.2;
  const maintain = Math.round(base * factor);
  return { bmr: base, maintain, fatLoss: maintain - 500, mildLoss: maintain - 250, gain: maintain + 300 };
}

// ---------- Body fat (U.S. Navy circumference method, cm) ----------
export function bodyFatNavy(sex: Sex, heightCm: number, neckCm: number, waistCm: number, hipCm = 0) {
  let pct: number;
  if (sex === "male") {
    if (waistCm <= neckCm) return null;
    pct = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
  } else {
    if (waistCm + hipCm <= neckCm) return null;
    pct = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450;
  }
  pct = Math.max(2, round(pct));
  const bands =
    sex === "male"
      ? [[6, "Essential"], [14, "Athletic"], [18, "Fit"], [25, "Average"], [Infinity, "Above average"]]
      : [[14, "Essential"], [21, "Athletic"], [25, "Fit"], [32, "Average"], [Infinity, "Above average"]];
  const category = (bands.find(([max]) => pct < (max as number)) ?? bands[bands.length - 1])[1] as string;
  return { value: pct, category };
}

// ---------- One-rep max ----------
export function oneRepMax(weight: number, reps: number) {
  if (reps <= 1) return { epley: weight, brzycki: weight, estimate: weight, table: pctTable(weight) };
  const epley = weight * (1 + reps / 30);
  const brzycki = reps < 37 ? (weight * 36) / (37 - reps) : epley;
  const estimate = round((epley + brzycki) / 2);
  return { epley: round(epley), brzycki: round(brzycki), estimate, table: pctTable(estimate) };
}

function pctTable(max: number) {
  return [95, 90, 85, 80, 75, 70, 65, 60].map((pct) => ({
    pct,
    weight: round((max * pct) / 100),
    reps: { 95: 2, 90: 4, 85: 6, 80: 8, 75: 10, 70: 12, 65: 15, 60: 20 }[pct]!,
  }));
}

// ---------- Macros ----------
export type Goal = "lose" | "maintain" | "gain";
export function macros(calories: number, weightKg: number, goal: Goal) {
  const target = Math.round(goal === "lose" ? calories * 0.8 : goal === "gain" ? calories * 1.1 : calories);
  const proteinPerKg = goal === "lose" ? 2.0 : goal === "gain" ? 1.8 : 1.6;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  return { calories: target, protein, fat, carbs };
}

// ---------- Ideal body weight ----------
export function idealWeight(sex: Sex, heightCm: number) {
  const inchesOver5ft = Math.max(0, heightCm / 2.54 - 60);
  const m = sex === "male";
  const devine = (m ? 50 : 45.5) + 2.3 * inchesOver5ft;
  const robinson = (m ? 52 : 49) + (m ? 1.9 : 1.7) * inchesOver5ft;
  const miller = (m ? 56.2 : 53.1) + (m ? 1.41 : 1.36) * inchesOver5ft;
  const hamwi = (m ? 48 : 45.5) + (m ? 2.7 : 2.2) * inchesOver5ft;
  const h = heightCm / 100;
  return {
    devine: round(devine),
    robinson: round(robinson),
    miller: round(miller),
    hamwi: round(hamwi),
    average: round((devine + robinson + miller + hamwi) / 4),
    bmiRange: [round(18.5 * h * h), round(22.9 * h * h)] as const,
  };
}

// ---------- Water intake ----------
export function waterIntake(weightKg: number, workoutMinutes: number, hotClimate: boolean) {
  const base = weightKg * 35;
  const exercise = (workoutMinutes / 30) * 500;
  const heat = hotClimate ? 500 : 0;
  const ml = Math.round((base + exercise + heat) / 50) * 50;
  return { litres: round(ml / 1000), glasses: Math.round(ml / 250), ml };
}

// ---------- Heart-rate zones (Tanaka max HR, Karvonen when resting HR given) ----------
export function heartRateZones(age: number, restingHr?: number) {
  const max = Math.round(208 - 0.7 * age);
  const reserve = restingHr && restingHr > 30 && restingHr < max ? max - restingHr : null;
  const at = (pct: number) => Math.round(reserve ? restingHr! + reserve * pct : max * pct);
  const zones = [
    { zone: 1, name: "Recovery", from: 0.5, to: 0.6 },
    { zone: 2, name: "Fat burn / Endurance", from: 0.6, to: 0.7 },
    { zone: 3, name: "Aerobic / Tempo", from: 0.7, to: 0.8 },
    { zone: 4, name: "Threshold", from: 0.8, to: 0.9 },
    { zone: 5, name: "Max effort", from: 0.9, to: 1.0 },
  ].map((z) => ({ ...z, low: at(z.from), high: at(z.to) }));
  return { max, method: reserve ? "Karvonen" : "Percent of max", zones };
}

// ---------- Registry used by pages, sitemap and blog shortcodes ----------
export type CalculatorMeta = {
  slug: string;
  key: CalculatorKey;
  title: string;
  short: string;
  description: string;
  icon: string;
  faqs: { q: string; a: string }[];
};

export type CalculatorKey = "bmi" | "tdee" | "body-fat" | "one-rep-max" | "macro" | "ideal-weight" | "water" | "heart-rate";

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: "bmi-calculator",
    key: "bmi",
    title: "BMI Calculator (Indian Standards)",
    short: "Body Mass Index with Asian-Indian cut-offs",
    description: "Free BMI calculator using Asian-Indian cut-offs (healthy 18.5–22.9). Get your BMI category and healthy weight range instantly.",
    icon: "Scale",
    faqs: [
      { q: "Why is the healthy BMI lower for Indians?", a: "Research shows South Asians develop diabetes and heart-disease risk at lower BMIs, so the WHO recommends a healthy range of 18.5–22.9 for Asian populations." },
      { q: "Is BMI accurate for people who lift weights?", a: "No — muscular people can read as overweight. Pair BMI with a body-fat or waist measurement for a fuller picture." },
    ],
  },
  {
    slug: "calorie-calculator",
    key: "tdee",
    title: "Calorie Calculator (BMR & TDEE)",
    short: "Daily calories to lose, maintain or gain",
    description: "Calculate your BMR and TDEE with the Mifflin-St Jeor equation and get calorie targets for fat loss, maintenance and muscle gain.",
    icon: "Flame",
    faqs: [
      { q: "What is TDEE?", a: "Total Daily Energy Expenditure — the calories you burn in a day including exercise and daily movement. Eat below it to lose weight and above it to gain." },
      { q: "How accurate is this?", a: "Mifflin-St Jeor is the most accurate simple equation for most adults, typically within about 10%. Track your weight for 2 weeks and adjust." },
    ],
  },
  {
    slug: "body-fat-calculator",
    key: "body-fat",
    title: "Body Fat Percentage Calculator",
    short: "U.S. Navy tape-measure method",
    description: "Estimate your body-fat percentage with just a measuring tape using the U.S. Navy method. See where you fall from athletic to average.",
    icon: "Ruler",
    faqs: [
      { q: "Where should I measure my waist?", a: "Men: at the navel. Women: at the narrowest point. Measure relaxed, first thing in the morning." },
      { q: "How accurate is the Navy method?", a: "Usually within 3–4% of DEXA scans — good enough to track progress if you measure the same way every time." },
    ],
  },
  {
    slug: "one-rep-max-calculator",
    key: "one-rep-max",
    title: "One Rep Max (1RM) Calculator",
    short: "Estimate your max lift safely",
    description: "Estimate your one-rep max for bench, squat or deadlift from any set of 2–12 reps, plus a percentage chart for programming.",
    icon: "Dumbbell",
    faqs: [
      { q: "Is it safe to test a true 1RM?", a: "Only with experience and a spotter. Estimating from a 3–8 rep set is safer and accurate enough for programming." },
    ],
  },
  {
    slug: "macro-calculator",
    key: "macro",
    title: "Macro Calculator",
    short: "Protein, carbs & fat for your goal",
    description: "Get daily protein, carb and fat targets for fat loss, maintenance or muscle gain — with Indian food examples.",
    icon: "PieChart",
    faqs: [
      { q: "How much protein do I need to build muscle?", a: "Around 1.6–2.2 g per kg of body weight per day, spread over 4–5 meals." },
    ],
  },
  {
    slug: "ideal-weight-calculator",
    key: "ideal-weight",
    title: "Ideal Weight Calculator",
    short: "Four formulas + healthy BMI range",
    description: "Find your ideal body weight using the Devine, Robinson, Miller and Hamwi formulas alongside the Asian healthy BMI range.",
    icon: "Target",
    faqs: [
      { q: "Which ideal weight formula is best?", a: "None is perfect — they were built for medication dosing. Use the range they give together with how you look, feel and perform." },
    ],
  },
  {
    slug: "water-intake-calculator",
    key: "water",
    title: "Water Intake Calculator",
    short: "Daily hydration for gym days",
    description: "Calculate how much water to drink daily based on body weight, workout duration and hot Indian weather.",
    icon: "Droplets",
    faqs: [
      { q: "Does tea or coffee count?", a: "Yes, mostly — moderate tea and coffee still hydrate. Plain water, buttermilk, coconut water and nimbu pani are best." },
    ],
  },
  {
    slug: "heart-rate-zone-calculator",
    key: "heart-rate",
    title: "Heart Rate Zone Calculator",
    short: "Your 5 training zones",
    description: "Calculate your max heart rate and 5 training zones (Karvonen or % max) to train smarter for fat loss and stamina.",
    icon: "HeartPulse",
    faqs: [
      { q: "What is zone 2 training?", a: "Easy, conversational cardio at about 60–70% of max heart rate. It builds your aerobic base and burns a high share of fat." },
    ],
  },
];

export const calculatorByKey = (key: string) => CALCULATORS.find((c) => c.key === key);
