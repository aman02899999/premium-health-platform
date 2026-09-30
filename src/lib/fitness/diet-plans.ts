import { totals, type Diet, type Portion } from "./foods";

export type Meal = { name: string; time: string; items: Portion[] };
export type DietPlan = {
  slug: string;
  title: string;
  goal: "fat-loss" | "muscle-gain";
  diet: Diet;
  forWho: string;
  summary: string;
  meals: Meal[];
  tips: string[];
};

// Meal times line up with the gym's morning (5:30–11) and evening (4–10) batches.
export const DIET_PLANS: DietPlan[] = [
  {
    slug: "vegetarian-fat-loss-diet-plan",
    title: "Vegetarian Fat-Loss Diet Plan",
    goal: "fat-loss",
    diet: "veg",
    forWho: "Vegetarian adults around 60–75 kg aiming to lose 0.5 kg a week",
    summary: "High-protein, high-fibre Indian vegetarian day built around dal, paneer, curd and soya — no fad foods.",
    meals: [
      { name: "Early morning", time: "6:00 AM", items: [{ id: "almonds", qty: 1 }, { id: "chai", qty: 1 }] },
      { name: "Breakfast", time: "8:30 AM", items: [{ id: "besan-chilla", qty: 2 }, { id: "hung-curd", qty: 1 }] },
      { name: "Lunch", time: "1:30 PM", items: [{ id: "roti", qty: 2 }, { id: "moong-dal", qty: 1 }, { id: "soya-matar", qty: 1 }, { id: "salad", qty: 1 }] },
      { name: "Pre-workout", time: "5:00 PM", items: [{ id: "banana", qty: 1 }, { id: "buttermilk", qty: 1 }] },
      { name: "Dinner", time: "8:30 PM", items: [{ id: "low-fat-paneer", qty: 1 }, { id: "mixed-sabzi", qty: 1 }, { id: "roti", qty: 1 }] },
    ],
    tips: ["Walk 8,000+ steps daily", "Keep ghee/oil to 3–4 tsp for the whole day", "Swap sweets for fruit on weekdays"],
  },
  {
    slug: "non-veg-fat-loss-diet-plan",
    title: "Non-Veg Fat-Loss Diet Plan",
    goal: "fat-loss",
    diet: "nonveg",
    forWho: "Adults around 65–85 kg who eat eggs, chicken and fish",
    summary: "Lean protein at every meal keeps you full and protects muscle while you drop fat.",
    meals: [
      { name: "Early morning", time: "6:00 AM", items: [{ id: "chai", qty: 1 }] },
      { name: "Breakfast", time: "8:30 AM", items: [{ id: "omelette", qty: 1 }, { id: "bread-brown", qty: 1 }, { id: "apple", qty: 1 }] },
      { name: "Lunch", time: "1:30 PM", items: [{ id: "brown-rice", qty: 1 }, { id: "chicken-curry", qty: 1 }, { id: "salad", qty: 1 }, { id: "curd", qty: 1 }] },
      { name: "Pre-workout", time: "5:00 PM", items: [{ id: "roasted-chana", qty: 1 }, { id: "coconut-water", qty: 1 }] },
      { name: "Dinner", time: "8:30 PM", items: [{ id: "grilled-fish", qty: 1.5 }, { id: "mixed-sabzi", qty: 1 }, { id: "roti", qty: 1 }] },
    ],
    tips: ["Choose grilled/tandoori over fried", "Egg whites are a cheap extra-protein add-on", "Weigh yourself 3× a week and track the average"],
  },
  {
    slug: "vegetarian-muscle-gain-diet-plan",
    title: "Vegetarian Muscle-Gain Diet Plan",
    goal: "muscle-gain",
    diet: "veg",
    forWho: "Vegetarian lifters around 60–75 kg training 4–5 days a week",
    summary: "A calorie surplus with 100 g+ protein from paneer, soya, dal, curd and milk.",
    meals: [
      { name: "Breakfast", time: "7:30 AM", items: [{ id: "oats", qty: 1 }, { id: "milk-toned", qty: 1 }, { id: "banana", qty: 1 }, { id: "peanut-butter", qty: 1 }] },
      { name: "Mid-morning", time: "11:00 AM", items: [{ id: "sprouts", qty: 1 }, { id: "peanuts", qty: 1 }] },
      { name: "Lunch", time: "1:30 PM", items: [{ id: "roti", qty: 3 }, { id: "rajma", qty: 1 }, { id: "curd", qty: 1 }, { id: "salad", qty: 1 }] },
      { name: "Pre-workout", time: "5:00 PM", items: [{ id: "banana", qty: 1 }, { id: "roasted-chana", qty: 1 }] },
      { name: "Post-workout", time: "7:30 PM", items: [{ id: "whey", qty: 1 }, { id: "milk-toned", qty: 1 }] },
      { name: "Dinner", time: "9:00 PM", items: [{ id: "paneer-bhurji", qty: 1 }, { id: "roti", qty: 2 }, { id: "soya-matar", qty: 1 }] },
    ],
    tips: ["Whey is optional — swap for 150 g hung curd", "Gain 0.25–0.5 kg a week; faster is mostly fat", "Sleep 7–8 hours"],
  },
  {
    slug: "non-veg-muscle-gain-diet-plan",
    title: "Non-Veg Muscle-Gain Diet Plan",
    goal: "muscle-gain",
    diet: "nonveg",
    forWho: "Lifters around 65–85 kg who eat eggs, chicken and fish",
    summary: "Eggs, chicken and rice give a simple, affordable 140 g+ protein bulking day.",
    meals: [
      { name: "Breakfast", time: "7:30 AM", items: [{ id: "egg-boiled", qty: 3 }, { id: "bread-brown", qty: 1 }, { id: "milk-toned", qty: 1 }, { id: "banana", qty: 1 }] },
      { name: "Mid-morning", time: "11:00 AM", items: [{ id: "peanuts", qty: 1 }, { id: "apple", qty: 1 }] },
      { name: "Lunch", time: "1:30 PM", items: [{ id: "white-rice", qty: 1.5 }, { id: "chicken-curry", qty: 1 }, { id: "moong-dal", qty: 1 }, { id: "salad", qty: 1 }] },
      { name: "Pre-workout", time: "5:00 PM", items: [{ id: "banana", qty: 1 }, { id: "curd", qty: 1 }] },
      { name: "Post-workout", time: "7:30 PM", items: [{ id: "whey", qty: 1 }, { id: "banana", qty: 1 }] },
      { name: "Dinner", time: "9:00 PM", items: [{ id: "tandoori-chicken", qty: 1 }, { id: "roti", qty: 3 }, { id: "mixed-sabzi", qty: 1 }] },
    ],
    tips: ["Rotate chicken with fish and eggs", "Add rice or roti if the scale doesn't move for 2 weeks", "Drink 3–4 L of water"],
  },
];

export const dietPlanBySlug = (slug: string) => DIET_PLANS.find((p) => p.slug === slug);

export function planTotals(plan: DietPlan) {
  const t = totals(plan.meals.flatMap((m) => m.items));
  return { kcal: Math.round(t.kcal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat), fibre: Math.round(t.fibre) };
}
