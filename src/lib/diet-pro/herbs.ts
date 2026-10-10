/**
 * Diet Pro: herbs and supplements that may SUPPORT a client's health conditions, with how to take them,
 * the evidence and who must not. Conservative by design:
 *  - Nothing here cures a disease or replaces a prescribed medicine, and the wording never says so
 *    (Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954 bans "cure" claims for diabetes,
 *    blood pressure, obesity and other listed conditions).
 *  - Doses are the ones used in human trials or guidelines, and every entry names its source.
 *  - Pregnancy, breastfeeding and kidney disease switch herbal supplements off (kitchen amounts stay).
 */
import type { ConditionKey } from "./conditions";
import type { ClientProfile } from "./types";

export type HerbAdvice = {
  name: string;
  /** "kitchen" = food amounts; "herbal" = herbal supplement; "supplement" = nutrient supplement. */
  kind: "kitchen" | "herbal" | "supplement";
  /** When in the client's day it goes (also printed on the diet chart's daily routine). */
  when: string;
  how: string;
  why: string;
  caution: string;
  source: string;
  for: ConditionKey[];
};

const HERBS: HerbAdvice[] = [
  // ── Blood sugar ──
  {
    name: "Methi (fenugreek) seeds", kind: "kitchen", when: "On waking", for: ["diabetes", "pcos"],
    how: "Soak 1–2 tsp (5–10 g) seeds overnight in a glass of water; drink the water and chew the seeds in the morning, 20–30 min before breakfast.",
    why: "May lower fasting sugar and HbA1c a little in type 2 diabetes.",
    caution: "Can add to the effect of diabetes medicines — check sugar for low readings. Avoid in pregnancy. May cause gas; skip with chickpea or peanut allergy.",
    source: "Neelakantan et al., Nutr J 2014 (meta-analysis)",
  },
  {
    name: "Dalchini (Ceylon cinnamon)", kind: "kitchen", when: "With breakfast", for: ["diabetes", "pcos"],
    how: "½–1 tsp (1–3 g) ground Ceylon cinnamon a day in oats, curd or tea. Not more than 1 tsp.",
    why: "Small, inconsistent fall in fasting sugar in trials; a flavour that replaces sugar.",
    caution: "Buy Ceylon (true) cinnamon: common cassia contains coumarin, which can harm the liver in large amounts.",
    source: "Allen et al., Ann Fam Med 2013 (meta-analysis); EFSA coumarin opinion 2008",
  },
  // ── Blood pressure, cholesterol, heart ──
  {
    name: "Garlic (lahsun)", kind: "kitchen", when: "With lunch", for: ["hypertension", "cholesterol", "heart"],
    how: "1–2 fresh cloves a day, crushed and left 10 minutes before cooking or eating. Aged garlic extract (600–1,200 mg/day) is the form tested for blood pressure.",
    why: "Lowers blood pressure by about 8/5 mmHg in people with high BP; small effect on cholesterol.",
    caution: "Increases bleeding risk with blood thinners (warfarin, aspirin, clopidogrel); stop supplements 7 days before surgery. Can worsen acidity.",
    source: "Ried, J Nutr 2016 (meta-analysis)",
  },
  {
    name: "Isabgol (psyllium husk)", kind: "supplement", when: "Before lunch", for: ["cholesterol", "diabetes", "heart", "ibs", "fattyLiver"],
    how: "1 tsp (about 5 g) in a full glass of water, 15 min before lunch; build up to twice a day. Drink it at once before it thickens.",
    why: "Soluble fibre: lowers LDL cholesterol about 7 %, helps after-meal sugar and constipation-type IBS.",
    caution: "Always with a full glass of water. Take medicines 2 hours apart. Not with swallowing problems or bowel narrowing.",
    source: "Jovanovski et al., Am J Clin Nutr 2018; ACG IBS guideline 2021",
  },
  {
    name: "Omega-3 (fish oil, EPA + DHA)", kind: "supplement", when: "With dinner", for: ["cholesterol", "heart"],
    how: "Only for high triglycerides and only at the dose your doctor writes (prescription doses are 2–4 g EPA + DHA a day), with a meal.",
    why: "Lowers triglycerides by 20–30 % at prescription doses.",
    caution: "Bleeding risk with blood thinners; high doses linked to irregular heartbeat (AF). Fish allergy: avoid.",
    source: "AHA science advisory on omega-3 and triglycerides, 2019",
  },
  {
    name: "Gudhal (hibiscus) tea", kind: "herbal", when: "Evening", for: ["hypertension"],
    how: "1–2 cups a day: 1–2 g dried hibiscus petals steeped in hot water for 5 min, no sugar.",
    why: "Small trials show a modest fall in blood pressure.",
    caution: "Can add to BP medicines — watch for dizziness. Avoid in pregnancy.",
    source: "Serban et al., J Hypertens 2015 (meta-analysis)",
  },
  // ── Liver, thyroid ──
  {
    name: "Black coffee (no sugar)", kind: "kitchen", when: "Morning", for: ["fattyLiver"],
    how: "2–3 cups of plain filter or black coffee a day, before 2 pm.",
    why: "Coffee drinkers have less liver scarring in fatty liver (observational evidence).",
    caution: "Not with uncontrolled BP, palpitations or poor sleep. Milk and sugar cancel the benefit.",
    source: "AASLD practice guidance on MASLD, 2023",
  },
  // ── PCOS ──
  {
    name: "Pudina (spearmint) tea", kind: "herbal", when: "Morning and evening", for: ["pcos"],
    how: "2 cups a day of spearmint tea (a handful of fresh leaves or 1 tea bag per cup), no sugar.",
    why: "Small trials show lower free testosterone in PCOS; may help excess hair growth over months.",
    caution: "Mild reflux in some people. Not a substitute for the gynaecologist's treatment.",
    source: "Grant, Phytother Res 2010 (randomised trial)",
  },
  {
    name: "Myo-inositol", kind: "supplement", when: "Breakfast and dinner", for: ["pcos"],
    how: "2 g twice a day (4 g total) dissolved in water, with folic acid if planning pregnancy.",
    why: "May improve cycles and insulin resistance in PCOS.",
    caution: "Start only after discussing with the gynaecologist. Mild nausea or gas at first.",
    source: "International evidence-based PCOS guideline, 2023",
  },
  // ── Blood, bones ──
  {
    name: "Amla / lemon with iron-rich meals", kind: "kitchen", when: "With lunch and dinner", for: ["anaemia"],
    how: "1 amla, a few guava slices or lemon on dal, greens and millet meals. Keep tea and coffee 1 hour away from meals.",
    why: "Vitamin C can double iron absorption from plant foods.",
    caution: "None at food amounts.",
    source: "Hallberg et al., Am J Clin Nutr 1989; ICMR-NIN 2020",
  },
  {
    name: "Iron tablet (if prescribed)", kind: "supplement", when: "Morning, empty stomach", for: ["anaemia"],
    how: "Only at the dose your doctor prescribes. Taking it every other day can absorb better and upset the stomach less; take with water or lemon water, not tea, milk or calcium.",
    why: "Corrects iron-deficiency anaemia; food alone is slow once haemoglobin is low.",
    caution: "Constipation and dark stools are common. Never take iron without a blood test — too much iron is harmful.",
    source: "Stoffel et al., Lancet Haematol 2017; Anaemia Mukt Bharat",
  },
  {
    name: "Calcium + vitamin D3", kind: "supplement", when: "With dinner", for: ["osteoporosis", "menopause"],
    how: "Food first (milk, curd, paneer, ragi, til). If the diet gives less than ~1,000 mg, add 500 mg calcium with a meal; vitamin D3 at the dose that matches the blood test.",
    why: "Supports bone density alongside strength training.",
    caution: "Not with kidney stones history without the doctor's advice. Keep 2 hours apart from thyroid tablets and iron.",
    source: "ICMR-NIN 2020; Endocrine Society vitamin D guideline 2024",
  },
  // ── Joints, gout, kidney stones ──
  {
    name: "Haldi (turmeric) with black pepper", kind: "kitchen", when: "With lunch or dinner", for: ["jointPain"],
    how: "½ tsp turmeric with a pinch of black pepper in dal, sabzi or warm milk daily. Curcumin extract (500 mg twice a day with food) is the form tested for knee pain — only after asking the doctor.",
    why: "Curcumin reduced knee-arthritis pain in trials, similar to common painkillers in some studies.",
    caution: "Supplements (not kitchen haldi): rare liver injury, gallstones, bleeding with blood thinners; stop 2 weeks before surgery.",
    source: "Daily et al., J Med Food 2016 (meta-analysis); LiverTox (NIH)",
  },
  {
    name: "Adrak (ginger)", kind: "kitchen", when: "Morning", for: ["jointPain", "gerd"],
    how: "1-inch piece (about 1–2 g dried equivalent) a day in tea or cooking.",
    why: "Modest pain relief in arthritis trials; helps nausea.",
    caution: "Large doses add to blood thinners. If ginger tea worsens your acidity, stop.",
    source: "Bartels et al., Osteoarthritis Cartilage 2015 (meta-analysis)",
  },
  {
    name: "Cherries / vitamin C", kind: "kitchen", when: "Evening snack", for: ["gout"],
    how: "A handful of cherries (about 10–12) or a vitamin C-rich fruit (amla, guava, orange) daily.",
    why: "Cherry intake was linked with fewer gout flares; vitamin C lowers uric acid slightly.",
    caution: "Not a replacement for uric-acid medicine (allopurinol/febuxostat). Avoid high-dose vitamin C with kidney stones.",
    source: "Zhang et al., Arthritis Rheum 2012; Juraschek et al., Arthritis Care Res 2011",
  },
  {
    name: "Nimbu paani (lemon water)", kind: "kitchen", when: "Through the day", for: ["kidneyStones"],
    how: "Juice of 2 lemons (about ½ cup) a day spread in your water bottle, no sugar, plus 2.5–3 L total fluid.",
    why: "Lemon citrate helps stop calcium stones forming; fluid is the most important step.",
    caution: "Use a straw or rinse — acid can wear tooth enamel.",
    source: "EAU urolithiasis guideline 2023",
  },
  // ── Gut ──
  {
    name: "Peppermint oil capsules", kind: "herbal", when: "Before meals", for: ["ibs"],
    how: "Enteric-coated capsules (180–225 mg) 2–3 times a day, 30 min before meals, for 4–8 weeks. Swallow whole.",
    why: "Relieves IBS pain and bloating in trials.",
    caution: "Can worsen acid reflux — skip with acidity. Not for children or in pregnancy without advice.",
    source: "ACG clinical guideline: IBS, 2021",
  },
  {
    name: "Jeera, ajwain or saunf after meals", kind: "kitchen", when: "After lunch and dinner", for: ["ibs", "gerd"],
    how: "½ tsp roasted saunf or jeera chewed, or jeera-ajwain water (1 tsp each boiled in 2 cups water, cooled) after heavy meals.",
    why: "Traditional digestive aids; evidence is limited, but they are safe at food amounts.",
    caution: "Large amounts of ajwain are not advised in pregnancy.",
    source: "Traditional use (Ayurveda); food-level amounts",
  },
];

/** Every client: kitchen herbs that replace salt and sugar. */
const EVERYONE: HerbAdvice = {
  name: "Herbs instead of extra salt", kind: "kitchen", when: "Every meal", for: [],
  how: "Season with jeera, dhania, pudina, adrak, lahsun, haldi, kali mirch and lemon so food tastes good with less salt.",
  why: "Lower salt lowers blood pressure; herbs add flavour and antioxidants.",
  caution: "None at kitchen amounts.",
  source: "WHO sodium guideline 2012",
};

/** Herbal and supplement advice for this client's conditions, with safety switches applied. */
export function herbAdvice(p: ClientProfile): { items: HerbAdvice[]; notes: string[] } {
  const c = p.conditions;
  const active = new Set(Object.entries(c).filter(([, v]) => v).map(([k]) => k as ConditionKey));
  const notes: string[] = [
    "These support your treatment — they do not cure a disease or replace any medicine. Never stop or change a prescribed medicine on your own.",
    "Tell your doctor before starting any herbal supplement if you take medicines (especially for diabetes, blood pressure, thyroid or blood thinning).",
  ];
  const noSupplements = !!(c.pregnant || c.lactating || c.ckd);
  if (c.pregnant || c.lactating) notes.push("Pregnancy / breastfeeding: herbal and nutrient supplements are left out — take only what your obstetrician prescribes. Kitchen amounts of herbs are fine.");
  if (c.ckd) notes.push("Kidney disease: no herbal supplements without the nephrologist — several herbs and supplements strain the kidneys or raise potassium.");
  if (c.fattyLiver || c.hypothyroid) notes.push("Avoid giloy, ashwagandha, garcinia and green-tea extract pills unless your doctor approves: they have been linked to liver injury, and ashwagandha can change thyroid levels.");
  const seen = new Set<string>();
  const items = HERBS.filter((h) => h.for.some((k) => active.has(k)))
    .filter((h) => !(noSupplements && h.kind !== "kitchen"))
    // Peppermint relaxes the food-pipe valve: not with reflux. Fenugreek: not in pregnancy.
    .filter((h) => !(c.gerd && h.name.startsWith("Peppermint")))
    .filter((h) => !(c.pregnant && h.name.startsWith("Methi")))
    .filter((h) => !(c.kidneyStones && h.name.startsWith("Calcium")) || !!c.osteoporosis)
    .filter((h) => (seen.has(h.name) ? false : (seen.add(h.name), true)));
  return { items: [...items, EVERYONE], notes };
}

/** One line for the diet chart's daily routine, e.g. "On waking: methi water · Before lunch: isabgol". */
export function herbRoutine(p: ClientProfile): string {
  const { items } = herbAdvice(p);
  return items
    .filter((h) => h.for.length && h.kind !== "supplement")
    .map((h) => `${h.when}: ${h.name.split(" (")[0].toLowerCase()}`)
    .join(" · ");
}
