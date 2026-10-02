// Royal Fitness Club supplement store — Amazon affiliate picks, kept separate from the
// Premium Health Platform's products. Rules: well-known brands only, no fat burners,
// testosterone boosters or high-stimulant pre-workouts, no typed-in prices or ratings
// (Amazon shows the live price), and every link carries our store ID.

export const AMAZON_STORE_ID = "rfc93-21";

export type StoreCategory = "Protein" | "Creatine & Recovery" | "Health Basics" | "Healthy Snacks" | "Gym Gear";

export type StoreProduct = {
  id: string;
  name: string;
  brand: string;
  category: StoreCategory;
  /** Coach's one-line reason to buy. */
  why: string;
  /** How to use it, in plain words. */
  use: string;
  /** Who should check with a doctor first, if anyone. */
  caution?: string;
  /** Shown as "Coach's pick". */
  pick?: boolean;
  /** Amazon search for the exact product (swap for /dp/ once the ASIN is known). */
  search: string;
};

export const STORE_CATEGORIES: { name: StoreCategory; blurb: string }[] = [
  { name: "Protein", blurb: "Fill the gap when ghar ka khana falls short of your daily protein." },
  { name: "Creatine & Recovery", blurb: "The few performance supplements with solid research behind them." },
  { name: "Health Basics", blurb: "Everyday nutrition support — best checked against a blood test." },
  { name: "Healthy Snacks", blurb: "High-protein, low-junk options for between meals." },
  { name: "Gym Gear", blurb: "Accessories our members actually use on the floor." },
];

export const STORE_PRODUCTS: StoreProduct[] = [
  // ---- Protein ----
  { id: "on-gold-standard-whey", name: "Gold Standard 100% Whey", brand: "Optimum Nutrition", category: "Protein", pick: true, search: "Optimum Nutrition Gold Standard 100% Whey Protein", why: "The benchmark whey: mixes easily, tastes good and has a long testing record.", use: "1 scoop (about 24 g protein) after training or with a meal low in protein." },
  { id: "mb-biozyme-whey", name: "Biozyme Performance Whey", brand: "MuscleBlaze", category: "Protein", search: "MuscleBlaze Biozyme Performance Whey Protein", why: "Indian brand with enzyme blend for easier digestion; widely available.", use: "1 scoop in water or milk, once or twice a day to meet your protein target." },
  { id: "avvatar-whey", name: "Whey Protein (Made from Indian milk)", brand: "Avvatar", category: "Protein", search: "Avvatar whey protein", why: "Made from fresh Indian milk; a good option if imported whey upsets your stomach.", use: "1 scoop after training." },
  { id: "asitis-raw-whey", name: "Raw Whey Protein Concentrate (Unflavoured)", brand: "AS-IT-IS", category: "Protein", search: "AS-IT-IS Nutrition whey protein concentrate unflavoured", why: "Budget unflavoured whey — stir into lassi, oats or besan chilla batter.", use: "1 scoop (30 g) a day. Unflavoured, so mix it into food." },
  { id: "plant-protein", name: "Plant Protein (Pea + Brown Rice)", brand: "Plix / Oziva", category: "Protein", search: "plant protein powder pea brown rice", why: "For vegans or members who don't tolerate dairy.", use: "1 scoop a day with water or plant milk." },
  // ---- Creatine & recovery ----
  { id: "on-creatine", name: "Micronized Creatine Monohydrate", brand: "Optimum Nutrition", category: "Creatine & Recovery", pick: true, search: "Optimum Nutrition Micronized Creatine Monohydrate", why: "The most-researched gym supplement for strength — plain creatine monohydrate, nothing added.", use: "3–5 g every day, any time, with water. No loading needed.", caution: "Kidney disease or on regular medication? Ask your doctor first." },
  { id: "mb-creatine", name: "Creatine Monohydrate (Unflavoured)", brand: "MuscleBlaze", category: "Creatine & Recovery", search: "MuscleBlaze creatine monohydrate unflavoured", why: "Budget creatine monohydrate from an Indian brand.", use: "3–5 g daily with water.", caution: "Kidney disease? Ask your doctor first." },
  { id: "fastup-reload", name: "Reload Electrolytes", brand: "Fast&Up", category: "Creatine & Recovery", search: "Fast&Up Reload electrolyte", why: "Replaces salts lost in sweat during long or hot Noida-summer sessions.", use: "1 tablet in 250 ml water during workouts over 60 minutes or on very hot days.", caution: "On a low-salt diet for BP or heart? Check with your doctor." },
  // ---- Health basics ----
  { id: "omega-3", name: "Omega-3 Fish Oil", brand: "MuscleBlaze / HealthKart", category: "Health Basics", search: "MuscleBlaze omega 3 fish oil", why: "Useful if you rarely eat fish; supports heart health as part of a balanced diet.", use: "As directed on the label, with a meal.", caution: "On blood thinners? Ask your doctor first." },
  { id: "multivitamin", name: "Multivitamin for Active Adults", brand: "MuscleBlaze MB-Vite / HK Vitals", category: "Health Basics", search: "MuscleBlaze MB-Vite multivitamin", why: "A safety net for busy weeks — not a substitute for vegetables and dal.", use: "1 tablet a day after breakfast." },
  { id: "vitamin-d3", name: "Vitamin D3", brand: "HealthKart / Carbamide Forte", category: "Health Basics", search: "vitamin D3 2000 IU", why: "Many Indians are low in vitamin D, especially office workers.", use: "Get a blood test first, then take the dose your doctor suggests.", caution: "Don't take high doses without a blood test — too much vitamin D is harmful." },
  // ---- Healthy snacks ----
  { id: "pintola-peanut-butter", name: "High Protein Peanut Butter", brand: "Pintola", category: "Healthy Snacks", pick: true, search: "Pintola high protein peanut butter", why: "Easy calories and protein for lean bulking — check the label for no added sugar.", use: "1–2 tablespoons on toast, roti or in a shake." },
  { id: "myfitness-peanut-butter", name: "Peanut Butter (Crunchy)", brand: "MyFitness", category: "Healthy Snacks", search: "MyFitness peanut butter crunchy", why: "Popular Indian peanut butter with good taste.", use: "1–2 tablespoons a day." },
  { id: "rolled-oats", name: "Rolled Oats", brand: "True Elements / Quaker", category: "Healthy Snacks", search: "rolled oats 1kg true elements", why: "Slow-digesting carbs for a pre-workout breakfast.", use: "40–60 g cooked with milk, topped with fruit and a scoop of whey." },
  { id: "protein-bar", name: "Max Protein Bars", brand: "RiteBite", category: "Healthy Snacks", search: "RiteBite Max Protein bar", why: "Better than a samosa when you're caught out — still read the sugar on the label.", use: "1 bar as a snack, not a meal replacement." },
  { id: "makhana", name: "Roasted Makhana", brand: "Farmley / Happilo", category: "Healthy Snacks", search: "roasted makhana", why: "Light, crunchy swap for namkeen.", use: "A bowl as an evening snack." },
  // ---- Gym gear ----
  { id: "shaker", name: "Protein Shaker 700 ml", brand: "Boldfit", category: "Gym Gear", search: "Boldfit protein shaker 700ml", why: "Leak-proof, with a compartment for your scoop.", use: "Rinse right after use so it doesn't smell." },
  { id: "lifting-belt", name: "Weightlifting Belt", brand: "Boldfit / Kobo", category: "Gym Gear", search: "weight lifting belt leather", why: "Helps brace on heavy squats and deadlifts once your technique is solid.", use: "Only for your heaviest sets — learn to brace without it first." },
  { id: "wrist-wraps", name: "Wrist Wraps", brand: "Boldfit", category: "Gym Gear", search: "wrist wraps gym", why: "Supports wrists on heavy pressing.", use: "Wrap firmly for heavy bench and overhead press sets." },
  { id: "lifting-straps", name: "Lifting Straps", brand: "Boldfit", category: "Gym Gear", search: "lifting straps gym", why: "Lets your back keep working when your grip gives out on rows and deadlifts.", use: "Use on top sets only so your grip still gets stronger." },
  { id: "gym-gloves", name: "Gym Gloves", brand: "Boldfit / Kobo", category: "Gym Gear", search: "gym gloves for men women", why: "Comfort for members with sensitive hands.", use: "Optional — chalk gives better grip for heavy pulls." },
  { id: "gym-bag", name: "Gym Duffle Bag with Shoe Compartment", brand: "Boldfit / Skybags", category: "Gym Gear", search: "gym duffle bag with shoe compartment", why: "Keeps shoes and sweaty clothes away from your office things.", use: "Air it out after every session." },
];

/** Amazon search link for a product, tagged with our store ID. */
export const storeLink = (p: StoreProduct) => `https://www.amazon.in/s?k=${encodeURIComponent(p.search).replace(/%20/g, "+")}&tag=${AMAZON_STORE_ID}`;
