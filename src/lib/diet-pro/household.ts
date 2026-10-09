// Household measures for the printed diet chart: grams turned into katori, phulka, glass,
// teaspoon and piece counts that a client can follow without a kitchen scale.
// Conventions (printed on the chart legend so the coach and client read them the same way):
export const MEASURE_LEGEND = [
  "1 katori (bowl) = 150 ml",
  "1 glass = 200 ml",
  "1 tsp = 5 g oil / ghee",
  "1 tbsp = about 10 g dry",
  "1 phulka = 30 g atta",
  "1 millet roti / bhakri = 35 g flour",
  "1 katori cooked dal = 30 g raw dal",
  "1 katori cooked rice = 55 g raw rice",
  "1 katori sabzi = 150 g raw vegetables",
];

export type Measure = { qty: string; note?: string };

/** Rounds to the nearest half and writes ½ the way Indian diet charts do. */
export function half(n: number): string {
  const r = Math.max(0.5, Math.round(n * 2) / 2);
  const w = Math.floor(r);
  return r - w ? (w ? `${w}½` : "½") : String(w);
}
const count = (n: number) => String(Math.max(1, Math.round(n)));
const plural = (q: string, one: string, many = `${one}s`) => `${q} ${q === "½" || q === "1" ? one : many}`;

// Pieces, in grams per piece.
const PIECE: Record<string, [number, string, string?]> = {
  banana: [100, "banana"],
  apple: [150, "apple"],
  orange: [130, "orange"],
  guava: [150, "guava"],
  pear: [150, "pear"],
  chikoo: [80, "chikoo"],
  mango: [200, "mango", "mangoes"],
  sitaphal: [150, "sitaphal"],
  potato: [100, "medium potato", "medium potatoes"],
  sweetPotato: [150, "medium sweet potato", "medium sweet potatoes"],
  arbi: [30, "arbi"],
  onion: [80, "medium onion"],
  tomato: [100, "medium tomato", "medium tomatoes"],
  cucumber: [200, "cucumber"],
  carrot: [80, "carrot"],
  capsicum: [100, "capsicum", "capsicums"],
  egg: [50, "whole egg"],
  eggWhite: [33, "egg white"],
  breadWholeWheat: [28, "slice"],
};
// Counted small items, grams each.
const NUTS: Record<string, [number, string]> = { almonds: [1.2, "almonds"], cashew: [1.5, "cashews"], pistachio: [0.7, "pistachios"], walnuts: [2.5, "walnut halves"], dates: [8, "dates"], singhara: [15, "singhara"] };
// Tablespoons, grams per tbsp.
const TBSP: Record<string, number> = { chia: 12, flaxseed: 10, pumpkinSeed: 9, sesame: 9, peanuts: 9, peanutButter: 16, coconutFresh: 8, raisins: 10, besan: 10, ragi: 10, makki: 10, kuttu: 10, rajgira: 10 };
// Katori of the cooked dish, per gram of dry food.
const COOKED_KATORI: Record<string, number> = { poha: 35, suji: 40, oats: 35, dalia: 35, sabudana: 45, quinoa: 45, samai: 45, kodo: 45, riceWhite: 55, riceBrown: 55, moongDal: 30, masoorDal: 30, toorDal: 30, chanaDal: 30, uradWhole: 30, rajma: 35, kalaChana: 35, lobia: 35, kulthi: 35, moth: 35, matarDry: 35, soybean: 35, soyaChunks: 30 };

/**
 * A household measure for `grams` of food `id` within dish `dish` (the template name),
 * so that flour becomes rotis and rice batter becomes idlis where that is how it is eaten.
 */
export function household(id: string, grams: number, dish = "", whey?: { scoopG: number }): Measure {
  const g = Math.round(grams);
  const d = dish.toLowerCase();
  if (g <= 0) return { qty: "—" };
  if (id === "whey" && whey?.scoopG) return { qty: plural(half(grams / whey.scoopG), "scoop") };
  if (id === "atta") {
    if (d.includes("paratha")) return { qty: plural(half(grams / 45), "paratha") };
    if (d.includes("thepla")) return { qty: plural(half(grams / 30), "thepla") };
    if (d.includes("toast")) return { qty: `${g} g atta` };
    return { qty: plural(half(grams / 30), "phulka"), note: `${g} g atta` };
  }
  if (["jowar", "bajra", "makki", "kuttu", "rajgira"].includes(id) && /roti|bhakri/.test(d)) return { qty: plural(half(grams / 35), d.includes("bhakri") ? "bhakri" : "roti", d.includes("bhakri") ? "bhakris" : "rotis"), note: `${g} g flour` };
  if (id === "ragi" && d.includes("mudde")) return { qty: plural(half(grams / 60), "ragi ball"), note: `${g} g flour` };
  if (id === "besan" && d.includes("chilla")) return { qty: plural(half(grams / 30), "chilla"), note: `${g} g besan` };
  if (id === "besan" && d.includes("dhokla")) return { qty: `${count(grams / 15)} dhokla pieces`, note: `${g} g besan` };
  if (id === "riceWhite" && d.includes("idli")) return { qty: `${count(grams / 12)} idli`, note: `${g} g raw rice` };
  if (id === "riceWhite" && /dosa|pesarattu/.test(d)) return { qty: plural(half(grams / 25), "dosa"), note: `${g} g raw rice` };
  if (id === "riceWhite" && d.includes("appam")) return { qty: `${count(grams / 20)} appam`, note: `${g} g raw rice` };
  // Ingredients that go into a batter, sambar or chutney are listed as the dish, not separately.
  if (id === "uradWhole" && /idli|dosa/.test(d)) return { qty: "in the batter", note: `${g} g urad` };
  if (id === "toorDal" && d.includes("sambar")) return { qty: `${half(grams / 20)} katori sambar`, note: `${g} g dal` };
  if (["drumstick", "tomato", "onion"].includes(id) && d.includes("sambar")) return { qty: "in the sambar", note: `${g} g` };
  if (id === "coconutFresh" && d.includes("chutney")) return { qty: `${half(grams / 8)} tbsp chutney`, note: `${g} g coconut` };
  if (id === "potato" && d.includes("masala dosa")) return { qty: "dosa filling", note: `${g} g potato` };
  // Herbs and spices: spoons, cloves, sprigs and pinches.
  const spoon = (gPerTsp: number) => (grams / gPerTsp < 0.4 ? "a pinch" : `${half(grams / gPerTsp)} tsp`);
  if (id === "garlic") return { qty: plural(count(grams / 3), "clove") };
  if (id === "ginger") return { qty: `${half(grams / 6)} inch piece` };
  if (id === "curryLeaves") return { qty: plural(half(grams / 2), "sprig") };
  if (id === "corianderLeaves") return { qty: `${half(grams / 4)} tbsp chopped` };
  if (id === "mint") return { qty: `${half(grams / 3)} tbsp chopped` };
  if (id === "greenChilli") return { qty: plural(count(grams / 3), "chilli", "chillies") };
  if (id === "elaichi") return { qty: plural(count(grams / 0.2), "pod") };
  if (id === "cloves") return { qty: plural(count(grams / 0.1), "clove") };
  if (id === "hing") return { qty: "a pinch" };
  const TSP: Record<string, number> = { turmeric: 3, blackPepper: 2.5, jeera: 2, methiSeeds: 4, ajwain: 2.5, corianderSeeds: 2 };
  if (TSP[id]) return { qty: spoon(TSP[id]) };
  if (id === "coconutWater") return { qty: plural(half(grams / 200), "glass", "glasses") };
  if (id === "ghee" || id.endsWith("Oil")) return { qty: `${half(grams / 5)} tsp` };
  if (["milkCow", "milkLowFat", "milkSkim", "milkBuffalo", "buttermilk"].includes(id)) return { qty: grams >= 150 ? plural(half(grams / 200), "glass", "glasses") : `${half(grams / 150)} cup` };
  if (id === "coconutMilk") return { qty: `${count(grams / 15)} tbsp` };
  if (id === "curd" || id === "greekYogurt") return { qty: grams >= 60 ? `${half(grams / 150)} katori` : `${count(grams / 15)} tbsp` };
  if (id === "paneer" || id === "tofu") return { qty: `${count(grams / 25)} matchbox-size pieces`, note: `${g} g` };
  if (["chickenBreast", "chickenRaw", "goatLeg"].includes(id)) return { qty: `${half(grams / 100)} palm-size portion`, note: `${g} g ${id === "chickenBreast" ? "cooked" : "raw"}` };
  if (["rohu", "catla", "pomfret", "mackerel", "sardine", "salmon"].includes(id)) return { qty: plural(half(grams / 80), "medium piece"), note: `${g} g` };
  if (["prawns", "prawnsRaw", "tuna", "sprouts"].includes(id)) return { qty: `${half(grams / 100)} katori` };
  if (PIECE[id]) {
    const [each, one, many] = PIECE[id];
    return { qty: plural(half(grams / each), one, many) };
  }
  if (NUTS[id]) return { qty: `${count(grams / NUTS[id][0])} ${NUTS[id][1]}` };
  if (TBSP[id]) return { qty: `${half(grams / TBSP[id])} tbsp` };
  if (COOKED_KATORI[id]) return { qty: `${half(grams / COOKED_KATORI[id])} katori cooked`, note: `${g} g raw` };
  if (["papaya", "pomegranate", "pineapple", "grapes", "watermelon", "muskmelon", "sweetCorn", "peas"].includes(id)) return { qty: `${half(grams / 150)} katori` };
  if (["ragi", "makki", "kuttu", "rajgira", "jowar", "bajra"].includes(id)) return { qty: `${half(grams / 10)} tbsp flour` };
  // Remaining vegetables: cooked as sabzi or eaten as salad.
  if (grams >= 75) return { qty: `${half(grams / 150)} katori`, note: `${g} g raw` };
  return { qty: "a handful", note: `${g} g` };
}

/** Clock times for each meal, from the client's wake-up time. Offsets in minutes. */
const OFFSETS: Record<string, number> = { Breakfast: 90, "Mid-morning snack": 270, Lunch: 420, "Evening snack": 630, Dinner: 810, Bedtime: 930 };
/** "HH:MM" → minutes after midnight (fallback when the value is missing or malformed). */
export function toMinutes(hhmm: string | undefined, fallback = "06:30"): number {
  const [h, m] = (hhmm && /^\d{1,2}:\d{2}$/.test(hhmm) ? hhmm : fallback).split(":").map(Number);
  return h * 60 + m;
}
/** Minutes after midnight → "6:30 pm". */
export function clock(min: number): string {
  const t = ((min % 1440) + 1440) % 1440;
  const hh = Math.floor(t / 60);
  return `${((hh + 11) % 12) + 1}:${String(t % 60).padStart(2, "0")} ${hh < 12 ? "am" : "pm"}`;
}
/** When a meal is eaten, in minutes after midnight. */
export function mealMinutes(label: string, wake = "06:30", meals = 5): number {
  // Three meals a day: dinner a little earlier, there is no evening snack to bridge to it.
  const off = (OFFSETS[label] ?? 0) - (meals === 3 && label === "Dinner" ? 30 : 0);
  return (toMinutes(wake) + off) % 1440;
}
export function mealTime(label: string, wake = "06:30", meals = 5): string {
  return clock(mealMinutes(label, wake, meals));
}
