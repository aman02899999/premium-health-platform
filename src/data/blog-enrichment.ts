import type { Article } from "@/types";
import { ARTICLES } from "./editorial";

export type BlogEnrichment = {
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  inlineImage: string;
  inlineImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  authorRole: string;
  extraBody: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  extraFaqs: { q: string; a: string }[];
  extraReferences: { title: string; source: string; year?: string; url?: string }[];
  readMinutes: number;
};

const PX = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200`;

export const BLOG_ENRICHMENT: Record<string, BlogEnrichment> = {
  "complete-indian-guide-type-2-diabetes": {
    heroImage: PX(11852051),
    heroImageAlt: "Diabetes monitoring equipment beside a fresh vegetable salad on a wooden table",
    heroImageCredit: "Towfiqu barbhuiya / Pexels",
    inlineImage: PX(29148133),
    inlineImageAlt: "Traditional Indian thali with paneer curry, rice and naan served on a wooden table",
    seoTitle: "Type 2 Diabetes in India: Complete Guide to Sugar Control, Diet, Medicines & Screening (2026)",
    seoDescription: "India's evidence-based type 2 diabetes playbook: HbA1c targets, Indian diabetes plate with millets, post-meal walks, metformin to insulin, Ayurveda add-ons, and annual eye-kidney-foot screening.",
    keywords: ["type 2 diabetes India", "HbA1c target", "Indian diabetes diet", "millets diabetes", "metformin", "diabetes screening", "post-meal walk"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "HbA1c targets and monitoring rhythm",
        paragraphs: [
          "For most non-pregnant adults, the ADA-EASD consensus target is HbA1c below 7.0%, with tighter goals (below 6.5%) for younger patients without complications and relaxed goals (below 8.0%) for frail elderly or those with limited life expectancy. The target is always individualised — a 32-year-old with new diabetes and a 78-year-old with heart failure should never chase the same number.",
          "Monitoring has two layers. HbA1c every 3 months until stable, then every 6 months, shows the trend. Home fasting plus 2-hour post-meal readings (paired testing around the same meal, 2–3 days a week) reveal which meals spike you. Continuous glucose monitors are optional but useful for insulin users or frequent lows.",
        ],
        bullets: ["Fasting target for most: 80–130 mg/dL; 2-hr post-meal: below 180 mg/dL (ADA)", "Log meal + walk + reading together — patterns beat isolated numbers", "Recheck HbA1c 3 months after any medicine change"],
      },
      {
        heading: "The 7-day Indian starter meal framework",
        paragraphs: [
          "Instead of a rigid chart, use a repeating framework. Breakfast anchors protein (moong cheela with paneer, vegetable oats with curd, or besan cheela with sprouts). Lunch follows the plate method with millet-rice rotation. Dinner stays light and early — soup plus grilled paneer or fish with sabzi — finished 3 hours before sleep.",
          "Snacks are planned, not grabbed: roasted chana (30 g), one fruit with 10 almonds, sprouted moong chaat, or buttermilk with flax. Beverages default to water, buttermilk, lemon water and unsweetened green tea. Sugary chai is the single highest-yield swap — each daily cup with 2 spoons of sugar adds roughly 10 g of pure sucrose.",
        ],
        bullets: ["Rotate foxtail, barnyard, ragi and jowar across the week — variety improves adherence", "Keep 2 emergency meals (sprouts + curd; vegetable soup + paneer) for late office days", "Festival sweets: one small portion after a protein-rich meal, not on an empty stomach"],
      },
      {
        heading: "Strength training: the glucose sink most Indians skip",
        paragraphs: [
          "Muscle disposes of roughly 80% of post-meal glucose, yet most Indian exercise advice stops at walking. Two to three weekly sessions of bodyweight or band resistance — squats to a chair, wall push-ups, rows with a band, dead-bugs for core — measurably improve insulin sensitivity within 8–12 weeks in trials.",
          "Start with 15 minutes twice a week, one day apart, stopping 2 repetitions before failure. People with retinopathy, uncontrolled BP (above 160/100) or foot ulcers need medical clearance and modified programs first.",
        ],
        bullets: ["Order matters: strength session + 10-min walk beats either alone for next-meal spikes", "Protein 1.2–1.6 g/kg/day preserves muscle during weight loss", "Track waist monthly — 5 cm loss often moves HbA1c more than 5 kg on the scale"],
      },
      {
        heading: "Sick-day rules and hypoglycaemia safety",
        paragraphs: [
          "Illness, vomiting or fasting disrupt sugar balance. As a rule, never stop basal/long-acting medicines without guidance, check sugar more often, stay hydrated with small frequent sips, and seek care for persistent vomiting, fruity breath, rapid breathing or confusion — possible ketoacidosis even with modest sugar readings on SGLT2 inhibitors.",
          "If you take insulin or sulfonylureas (glimepiride, glipizide), memorise the 15-15 rule: 15 g fast sugar (4 glucose tablets or 120 ml juice), recheck in 15 minutes, repeat if still below 70, then eat a snack. Carry glucose always and wear identification.",
        ],
        bullets: ["SGLT2 inhibitors are often paused during vomiting, fasting or before surgery — confirm your personal plan", "Recurrent night sweats or morning headaches warrant a 3 am sugar check for nocturnal lows", "Teach one family member the hypo signs: sweating, tremor, confusion, unusual behaviour"],
      },
      {
        heading: "Annual complication screening, demystified",
        paragraphs: [
          "Diabetes harms vessels silently, so screening follows a calendar, not symptoms. Every year: dilated eye exam, urine albumin-creatinine ratio plus eGFR, foot exam with monofilament and pulses, lipid profile, ECG as advised, and BP review. Dental and depression screening are often missed but guideline-recommended.",
          "Between visits, the daily foot check takes 60 seconds: tops, soles (mirror), between toes, nails and footwear. Any blister, crack or non-healing wound beyond 2–3 days needs prompt — not routine — care, because diabetic foot infections escalate fast.",
        ],
      },
    ],
    extraFaqs: [
      { q: "What HbA1c should I target?", a: "Below 7.0% for most adults, tighter if young and healthy, relaxed if elderly or frail. Your doctor individualises it — chasing a non-diabetic number with frequent lows is worse than a stable 7.2%." },
      { q: "Are millets really better than rice?", a: "Foxtail, barnyard and ragi typically raise post-meal sugar less than the same quantity of white rice, and add fibre and minerals. Portion still matters — a katori, not a mountain." },
      { q: "When is insulin needed?", a: "When HbA1c stays above target on combinations, during pregnancy, major illness or surgery, or with very high sugars at diagnosis. Starting insulin protects organs; it is not a punishment or a failure." },
      { q: "Can I fast (Navratri, Ramzan, Karva Chauth) with diabetes?", a: "Often yes with a pre-fast medicine review, hydration planning and more frequent checks — especially on insulin or sulfonylureas. Never fast without a plan if sugars are uncontrolled." },
    ],
    extraReferences: [
      { title: "Standards of Medical Care in Diabetes", source: "American Diabetes Association", year: "2025", url: "https://diabetes.org/" },
      { title: "ICMR Guidelines for Management of Type 2 Diabetes", source: "ICMR", year: "2018", url: "https://www.icmr.gov.in/" },
      { title: "WHO HEARTS-D module for diabetes management", source: "World Health Organization", url: "https://www.who.int/" },
    ],
    readMinutes: 22,
  },

  "indian-guide-blood-pressure": {
    heroImage: PX(8088852),
    heroImageAlt: "Senior adult checking blood pressure with a digital monitor at home",
    heroImageCredit: "Yaroslav Shuraev / Pexels",
    inlineImage: PX(7659573),
    inlineImageAlt: "Healthcare worker measuring a patient's blood pressure with a sphygmomanometer",
    seoTitle: "High Blood Pressure in India: Home Monitoring, 5 g Salt Plan & Medicines (2026)",
    seoDescription: "Control hypertension below 130/80: correct home BP technique, Indian low-salt DASH eating, amlodipine/losartan explained, and when high BP is an emergency.",
    keywords: ["high blood pressure India", "home BP monitoring", "low salt diet", "DASH diet India", "amlodipine", "hypertension emergency"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "How to measure BP correctly at home",
        paragraphs: [
          "Technique decides truth. Rest seated for 5 minutes, back supported, feet flat, arm at heart level on a table, correct cuff size (bladder covering 80% of arm), no talking, no chai/coffee/exercise/smoking in the prior 30 minutes. Take two readings a minute apart and average them.",
          "For diagnosis or titration, log morning (before medicines/breakfast) and evening readings for 7 days, discard day one, and average the rest. Bring the log — not a single casual reading — to every visit.",
        ],
        bullets: ["Upper-arm monitors beat wrist devices for accuracy; validate against ESH/STRIDE lists", "Check both arms first; use the higher arm thereafter", "Recalibrate yearly and replace cuffs that no longer fit snugly"],
      },
      {
        heading: "The Indian low-salt kitchen: where sodium actually hides",
        paragraphs: [
          "Table salt is only the visible third. Bread (300–500 mg sodium per 100 g), biscuits, namkeen, pickles (a single amla pickle can carry 500+ mg), papad, sauces, processed cheese and restaurant gravies deliver the rest. Reading labels for one month permanently changes shopping habits.",
          "Potassium-rich foods — banana, moong, curd, coconut water — help most hypertensives, but kidney disease and ARB/spironolactone users must restrict potassium. Salt substitutes (potassium chloride) need the same caution.",
        ],
        bullets: ["Cook with 1 measured teaspoon of salt for the full day; flavour with lemon, amchur, pepper, herbs", "Restaurant hack: request less salt, gravies on the side, extra salad", "Track BP 2 weeks after each salt cut — visible drops reinforce the habit"],
      },
      {
        heading: "Medicines: combinations, timing and adherence",
        paragraphs: [
          "Most Indians need two agents for sustained control — commonly amlodipine plus an ARB (losartan/telmisartan), with a thiazide-type diuretic added next. Single-pill combinations improve adherence dramatically and are preferred when available.",
          "Take medicines at the same time daily, linked to an existing habit (after brushing). Ankle swelling with amlodipine is common and usually harmless; a dry cough suggests ACE-inhibitor class and warrants a switch discussion — never a silent stop.",
        ],
      },
      {
        heading: "Hypertensive emergency vs urgency: know the difference",
        paragraphs: [
          "Readings above 180/120 with chest pain, breathlessness, vision change, weakness or confusion are an emergency — go to hospital immediately without trying to 'bring it down' at home. The same numbers without any symptoms still need same-day (not same-minute) evaluation.",
          "Never chew extra BP tablets, take someone else's medicine, or use sublingual nifedipine at home — rapid uncontrolled drops can precipitate stroke. Call your doctor or emergency services for guidance.",
        ],
      },
    ],
    extraFaqs: [
      { q: "What is the target BP?", a: "Below 130/80 for most adults with diabetes, kidney or heart disease; below 140/90 is the minimum for all. Home averages run ~5 points lower than clinic — your doctor reconciles both." },
      { q: "Can I stop medicines once BP is normal?", a: "Normal readings mean treatment is working, not that hypertension is cured. Stopping typically rebounds within days to weeks. Dose reductions happen only with sustained control plus weight/salt/alcohol improvements." },
      { q: "Does stress alone cause hypertension?", a: "Stress spikes readings acutely; chronic hypertension reflects vessel, kidney and hormonal regulation. Manage stress for wellbeing, but don't skip medicines expecting meditation alone to control sustained hypertension." },
      { q: "Are wrist BP monitors okay?", a: "Upper-arm oscillometric devices are more reliable. If you must use a wrist device, keep the wrist exactly at heart level and validate readings against a clinic device." },
    ],
    extraReferences: [
      { title: "WHO HEARTS Technical Package for Hypertension", source: "WHO", url: "https://www.who.int/" },
      { title: "India Hypertension Control Initiative Protocol", source: "MoHFW / ICMR", url: "https://www.mohfw.gov.in/" },
    ],
    readMinutes: 16,
  },

  "understanding-thyroid-health": {
    heroImage: PX(6129444),
    heroImageAlt: "Doctor discussing health records with a patient in a clinic",
    heroImageCredit: "RDNE Stock project / Pexels",
    inlineImage: PX(4047146),
    inlineImageAlt: "Blood samples in test tubes prepared for thyroid and laboratory testing",
    seoTitle: "Thyroid Health (India): TSH Testing, Levothyroxine Timing, Diet & Myths (2026)",
    seoDescription: "Hypothyroidism explained for Indians: TSH + FT4 interpretation, the 30-minute levothyroxine rule, biotin interference, pregnancy targets, and nutrition that actually helps.",
    keywords: ["thyroid India", "TSH test", "hypothyroidism", "levothyroxine timing", "Hashimoto", "thyroid diet myths"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "Reading your thyroid report: TSH, FT4, anti-TPO",
        paragraphs: [
          "TSH screens, free T4 confirms. High TSH with low FT4 means overt hypothyroidism needing treatment. High TSH with normal FT4 is subclinical — treated only in pregnancy, planned pregnancy, TSH above 10, or with symptoms/goitre. Anti-TPO antibodies identify Hashimoto's autoimmunity, the dominant Indian cause.",
          "Always test in the morning before your levothyroxine dose, and pause biotin (common in hair-gummy supplements) for 48–72 hours — biotin falsely lowers TSH and falsely raises FT4 on many assays, mimicking hyperthyroidism.",
        ],
        bullets: ["Pregnancy targets are tighter (often TSH below 2.5 in trimester 1) — inform your doctor immediately", "Acute illness distorts thyroid labs; defer routine testing until recovery", "One abnormal TSH needs repeat plus FT4 before lifelong labelling"],
      },
      {
        heading: "Dose titration without the roller-coaster",
        paragraphs: [
          "Levothyroxine has a 7-day half-life, so TSH lags any change by 6–8 weeks. Rechecking earlier causes yo-yo dosing. Keep brand, timing and diet consistent between tests, and list iron, calcium, PPIs, estrogen and seizure medicines — all alter requirements.",
          "Persistent fatigue despite normal TSH is common and rarely fixed by pushing TSH lower. Check hemoglobin, ferritin, B12, vitamin D, sleep apnea and depression before blaming the thyroid dose.",
        ],
      },
      {
        heading: "Weight, hair fall and periods: setting expectations",
        paragraphs: [
          "Correcting hypothyroidism typically restores 2–4 kg of myxedema fluid, not 15 kg of fat — sustained weight needs the same diet-activity fundamentals. Hair shedding slows 3–6 months after TSH normalises; simultaneous iron, B12 and protein correction speeds recovery.",
          "Heavy or irregular periods improve with treatment, but PCOS, fibroids and perimenopause coexist often. Thyroid optimisation is step one, not the whole gynaecology workup.",
        ],
      },
      {
        heading: "Supplements and herbs: what helps, what harms",
        paragraphs: [
          "Iodised salt meets iodine needs for most Indians; kelp and iodine mega-doses can trigger or worsen thyroid autoimmunity. Selenium (1–2 Brazil nuts or eggs) and correcting iron/B12/D deficiencies support overall function.",
          "Ashwagandha may raise thyroid hormones and has triggered thyrotoxicosis in case reports — avoid self-use while titrating, and disclose it before every TSH review.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Why must I wait 30–60 minutes after the tablet?", a: "Food, chai, coffee, milk, iron, calcium and antacids all block absorption. Water-only dosing with a gap keeps levels predictable — the commonest cause of 'resistant' hypothyroidism is actually poor timing." },
      { q: "Can hypothyroidism be cured?", a: "Hashimoto's hypothyroidism is usually lifelong but perfectly controlled with one daily tablet. Postpartum or drug-induced cases sometimes resolve — your doctor retests before declaring permanence." },
      { q: "Should I avoid cabbage and cauliflower?", a: "Normal cooked portions are fine. Goitrogenic effects appear only with massive raw intake plus iodine deficiency — banning everyday sabzis harms nutrition more than it helps thyroid." },
      { q: "TSH normal but I still feel tired — what next?", a: "Review sleep (apnea screen), hemoglobin/ferritin, B12, vitamin D, depression, medicines and activity. Adjusting levothyroxine into the suppressed range risks atrial fibrillation and bone loss." },
    ],
    extraReferences: [
      { title: "ATA Guidelines for Hypothyroidism", source: "American Thyroid Association", url: "https://www.thyroid.org/" },
      { title: "Endocrine Society Thyroid Guidance", source: "Endocrine Society", url: "https://www.endocrine.org/" },
    ],
    readMinutes: 15,
  },

  "indian-nutrition-heart-health": {
    heroImage: PX(10992750),
    heroImageAlt: "Heart-shaped arrangement of nutritious whole grains symbolising heart health",
    heroImageCredit: "Engin Akyurt / Pexels",
    inlineImage: PX(5966153),
    inlineImageAlt: "Overhead view of nuts, beans and seeds arranged for healthy eating",
    seoTitle: "Indian Heart-Healthy Diet: DASH-Thali Plan, Oils, Nuts & LDL Targets (2026)",
    seoDescription: "Protect your heart without giving up tadka: oil rotation, 30 g nuts, 30 g fibre, millet swaps, salt limits and LDL targets with cardiologist-approved Indian meals.",
    keywords: ["heart healthy diet India", "DASH diet Indian", "LDL cholesterol diet", "mustard oil vs groundnut", "nuts heart", "low salt Indian food"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "LDL targets: one number does not fit all",
        paragraphs: [
          "LDL goals depend on risk: below 100 mg/dL for moderate risk, below 70 for high risk (diabetes, established heart disease), below 55 after recent heart attack or with multiple events. Diet alone typically lowers LDL 10–15% — meaningful, but high-risk patients still need statins for proven protection.",
          "Always interpret the full panel: high triglycerides with low HDL (the common Indian atherogenic pattern) needs sugar, alcohol and refined-carb control alongside LDL management. Lp(a), checked once in a lifetime, refines family-risk assessment.",
        ],
        bullets: ["Recheck lipids 4–12 weeks after diet or statin changes", "Fasting is no longer mandatory for routine panels unless triglycerides are the focus", "Report severe muscle pain with dark urine on statins promptly (rare rhabdomyolysis)"],
      },
      {
        heading: "Oil decoded: rotation, smoke point and quantity",
        paragraphs: [
          "Rotate mustard (good MUFA + omega-3 ALA, high pungency means less salt needed), groundnut (neutral, high smoke point for tadka) and sesame; keep coconut and palm as occasional traditional uses, not daily bases. Vanaspati (partially hydrogenated) trans fat should be zero.",
          "Quantity dominates quality debates: 3 teaspoons of visible fat per person per day covers tadka, roti and sabzi. Measure with a spoon for two weeks — most families discover they use double.",
        ],
      },
      {
        heading: "A week of heart-smart Indian meals",
        paragraphs: [
          "Breakfasts rotate: oats-banana-walnut porridge, vegetable poha with peanuts and sprouts, ragi dosa with sambar. Lunches anchor brown rice or millet plus sambar/dal, two sabzis, curd and salad. Dinners go light: grilled fish or paneer with stir-fry and soup.",
          "Eating out rules: tandoor over makhani, extra salad, roti over naan, buttermilk over sweet lassi, and a 10-minute walk after. One restaurant meal weekly fits; daily office-canteen fried food does not.",
        ],
      },
      {
        heading: "Alcohol, smoking and sleep: the non-food two-thirds",
        paragraphs: [
          "No safe alcohol threshold exists for heart protection — the 'red wine benefit' was confounding. Any reduction helps; binge episodes trigger arrhythmias. Tobacco in any form (cigarette, bidi, gutka) multiplies heart-attack risk within months of quitting the curve starts falling.",
          "Sleep under 6 hours raises BP and arrhythmia risk; loud snoring with daytime sleepiness needs apnea evaluation, not just earplugs. Stress management (breathing, prayer, music, counselling) supports adherence to everything above.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Is ghee bad for the heart?", a: "Ghee is mostly saturated fat — teaspoons for flavour are fine, katoris are not. For high LDL, prioritise mustard/groundnut/olive as base oils and keep ghee occasional and measured." },
      { q: "How many nuts per day?", a: "About 30 g (a small handful) of unsalted almonds, walnuts, peanuts or pistachios. Salted, fried or honey-coated versions reverse the benefit." },
      { q: "Can diet replace my statin?", a: "Rarely in high-risk patients. Diet plus statin together give the largest risk reduction; stopping statins after a cardiac event without cardiology advice is dangerous." },
      { q: "Is coconut oil heart-healthy?", a: "It raises LDL more than unsaturated oils. Occasional traditional use is acceptable, but it should not be the daily cooking base for anyone with heart risk." },
    ],
    extraReferences: [
      { title: "AHA/ACC Guideline on Blood Cholesterol", source: "AHA/ACC", url: "https://www.heart.org/" },
      { title: "Lipid Association of India Consensus", source: "LAI", year: "2020", url: "https://lipidindia.org/" },
    ],
    readMinutes: 14,
  },

  "ayurvedic-herbs-evidence-uses-safety": {
    heroImage: PX(30688214),
    heroImageAlt: "Ground turmeric spice in a burlap sack under natural light",
    heroImageCredit: "Denys Gromov / Pexels",
    inlineImage: PX(31280796),
    inlineImageAlt: "Colourful Indian spice powders arranged in bowls on a dark background",
    seoTitle: "Ayurvedic Herbs Guide: 20 Herbs with Evidence Grades, Safety & Interactions (2026)",
    seoDescription: "Ashwagandha to triphala with honest evidence ratings: traditional uses, trial signals, drug interactions, pregnancy warnings and how to buy tested AYUSH-licensed products.",
    keywords: ["ayurvedic herbs evidence", "ashwagandha safety", "turmeric curcumin", "herb drug interactions", "AYUSH licensed products", "giloy liver"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "How to read an herb label like a pharmacist",
        paragraphs: [
          "Three lines matter: the Latin binomial (Withania somnifera, not just 'herbal blend'), the plant part and extract ratio or standardisation (root extract, 5% withanolides), and the per-capsule dose with batch number and expiry. 'Proprietary blend 500 mg' with ten ingredients hides every dose — avoid it.",
          "AYUSH licence numbers, GMP marks and third-party heavy-metal/microbial testing statements separate serious manufacturers from repackers. Loose powders from unsealed sacks carry the highest adulteration risk, including the infamous lead-chromate yellow in turmeric.",
        ],
        bullets: ["Standardised extract > crude powder for predictable dosing", "Check for added piperine (boosts absorption but also drug interactions)", "Photograph the label — your doctor needs exact names in an emergency"],
      },
      {
        heading: "The big-five interaction patterns to memorise",
        paragraphs: [
          "Most herb-drug harm follows five patterns: additive blood-sugar lowering (methi, karela, gudmar, jamun with diabetes medicines), additive sedation (ashwagandha, brahmi with sleep/anxiety drugs and alcohol), bleeding risk (turmeric, garlic, ginkgo with aspirin/warfarin), thyroid shifts (ashwagandha, kelp, high-dose iodine), and blood-pressure/potassium effects (crude licorice raising BP, diuretic herbs lowering potassium).",
          "Piperine (black pepper extract) deserves special mention: it inhibits drug-metabolising enzymes and can raise levels of many prescriptions — take it only with pharmacist review if you use regular medicines.",
        ],
      },
      {
        heading: "Pregnancy, surgery and organ disease: red-line rules",
        paragraphs: [
          "Pregnancy red lines: avoid ashwagandha, high-dose turmeric/curcumin, aloe latex, crude licorice and most concentrated extracts — food-level spices in normal cooking remain fine. Stop sedating and blood-thinning herbs 2 weeks before planned surgery and disclose everything to the anaesthetist.",
          "Liver disease red lines: avoid giloy (rare but serious injury reports, often adulterated species), high-dose green-tea extract and kava. Kidney disease red lines: avoid potassium-rich 'renal herb' mixes, star fruit products and NSAID-like folk remedies.",
        ],
      },
      {
        heading: "Building a safe home herbal shelf",
        paragraphs: [
          "A sensible starter shelf fits in one box: Ceylon cinnamon for flavour, methi seeds, haldi for cooking (not mega-dose capsules), ginger for nausea, Triphala for occasional constipation, and tulsi tea for comfort. Each has a defined role, food-level dosing and known cautions.",
          "Review the shelf every 6 months with your doctor and Vaidya together: what helped, what didn't, what interacts with new prescriptions. Herbs that earn their place stay; the rest leave.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Are AYUSH-licensed products automatically safe?", a: "Licensing ensures manufacturing standards, not zero risk. Dose, interactions, pregnancy status and your liver/kidney health still decide safety — licensed plus supervised is the standard." },
      { q: "Can I take ashwagandha with thyroid medicine?", a: "Only with monitoring — ashwagandha may raise thyroid hormone levels and has triggered thyrotoxicosis in reports. Never adjust levothyroxine around an herb without TSH retesting." },
      { q: "Why did my 'liver-safe' herb raise liver enzymes?", a: "Adulteration, wrong species (common with giloy), excessive dose, alcohol synergy or individual susceptibility. Stop the product, see your doctor, and bring the exact pack for identification." },
      { q: "Food vs extract — which should I choose?", a: "Food-level use (haldi in dal, methi seeds soaked) suits daily life. Extracts suit short, supervised courses for specific goals with defined stop dates and monitoring." },
    ],
    extraReferences: [
      { title: "Ayurvedic Pharmacopoeia of India", source: "Ministry of AYUSH", url: "https://ayush.gov.in/" },
      { title: "WHO Guidelines on Safety Monitoring of Herbal Medicines", source: "WHO", url: "https://www.who.int/" },
    ],
    readMinutes: 18,
  },

  "indian-food-guide-metabolic-health": {
    heroImage: PX(8818723),
    heroImageAlt: "Person serving a traditional Indian thali with a variety of dishes",
    heroImageCredit: "Yan Krukau / Pexels",
    inlineImage: PX(27959280),
    inlineImageAlt: "Wooden bowl of mixed millets and lentils viewed from above",
    seoTitle: "Indian Metabolic Health Diet: 6 Food Swaps for Sugar, Triglycerides & Liver (2026)",
    seoDescription: "Move HbA1c, triglycerides and liver fat with Indian food swaps: millet rotation, protein breakfasts, fibre targets, oil budgets and a weekly shopping list.",
    keywords: ["metabolic health diet India", "millets vs rice", "triglycerides diet", "fatty liver diet", "Indian diet HbA1c", "fibre protein plate"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "Carbohydrate quality: GI, portion and pairing",
        paragraphs: [
          "Glycaemic index ranks carbs, but glycaemic load (GI × portion) decides your spike. A small katori of white rice with dal-vegetables often spikes less than a large 'healthy' millet khichdi eaten alone. Order matters too: salad and protein first, grains last, slows absorption measurably.",
          "Practical rotation: foxtail and barnyard millet mimic rice best for beginners (start 50:50), ragi suits roti and porridge, jowar-bajra suit winter rotis. Keep one grain per meal and vary across the week for micronutrient breadth.",
        ],
        bullets: ["Target 25–30 g fibre/day: vegetables + whole grains + flax/methi + fruit", "Protein 0.8–1.2 g/kg (higher in weight loss) distributed across meals", "No liquid calories: juices, cold drinks and sugary chai spike fastest"],
      },
      {
        heading: "Triglycerides: the sugar-alcohol-fat triangle",
        paragraphs: [
          "High triglycerides (above 150 mg/dL) in Indians usually trace to sweets, refined carbs, alcohol and excess calories — not dietary fat alone. Cutting sugary drinks and bakery, capping alcohol (ideally zero for high TG), and losing 5–7% weight often drops TG 20–30% within 3 months.",
          "Very high TG (above 500) risks pancreatitis and needs urgent medical management plus strict fat restriction — diet tweaks alone are insufficient and delay is dangerous.",
        ],
      },
      {
        heading: "Liver fat: the 7–10% rule and coffee note",
        paragraphs: [
          "MASLD (fatty liver) reverses with gradual 7–10% weight loss — roughly 0.5 kg/week. Mediterranean-Indian plates (vegetables, millets, pulses, nuts, curd, fish), zero alcohol and no sugary drinks are the prescription; no proven 'liver-cleanse' tonic exists.",
          "Observational studies link 2–3 cups of daily coffee (less sugar) to better liver outcomes, but coffee is a complement to weight loss, not a substitute. Rapid crash loss above 1 kg/week can paradoxically worsen liver inflammation.",
        ],
      },
      {
        heading: "Weekly shopping list that makes it automatic",
        paragraphs: [
          "Systems beat willpower. Weekly staples: 2 millets (foxtail + ragi), oats, 3 dals (moong, masoor, toor), seasonal vegetables (5 kg), 2 fruits, curd, paneer/eggs, peanuts, flax and methi seeds. Monthly: mustard + groundnut oils, whole spices, psyllium backup.",
          "Prep Sunday: soak and sprout moong, boil chana, chop salad vegetables, roast peanuts/makhana, and portion oats. A stocked kitchen makes the healthy choice the easy choice on tired weeknights.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Which millet is best for diabetes?", a: "Foxtail and barnyard have the most rice-like texture with lower glycaemic impact; ragi adds calcium. Rotate rather than marrying one — variety improves nutrients and adherence." },
      { q: "Can I eat fruit with high sugar?", a: "Yes — whole fruit (guava, papaya, apple, berries) with nuts or curd. Avoid juices, large mango/banana loads alone, and dried-fruit piles that concentrate sugar." },
      { q: "How fast should triglycerides fall?", a: "With consistent diet, alcohol control and weight loss, meaningful drops appear in 8–12 weeks. If TG stays above 200 despite honest effort, discuss medicines — genetics often contribute." },
      { q: "Is intermittent fasting safe for metabolic health?", a: "A 12-hour overnight fast (7:30 pm to 7:30 am) suits many. Longer fasts need supervision on diabetes/BP medicines and are unsuitable in pregnancy, teens and eating-disorder history." },
    ],
    extraReferences: [
      { title: "ICMR-NIN Nutrient Requirements for Indians", source: "ICMR-NIN", year: "2020", url: "https://www.nin.res.in/" },
      { title: "AASLD Guidance on NAFLD/MASLD", source: "AASLD", url: "https://www.aasld.org/" },
    ],
    readMinutes: 13,
  },

  "pcos-complete-guide-indian-women": {
    heroImage: PX(32661596),
    heroImageAlt: "South Asian woman practising yoga outdoors in vibrant attire",
    heroImageCredit: "Anil Sharma / Pexels",
    inlineImage: PX(6129441),
    inlineImageAlt: "Healthcare professional consulting a patient about diagnosis and care",
    seoTitle: "PCOS in Indian Women: Rotterdam Diagnosis, Lifestyle-First Care & Fertility (2026)",
    seoDescription: "Periods, acne, hair fall, weight and fertility in PCOS: how diagnosis really works, strength-first lifestyle, metformin and hormonal options, and fertility pathways.",
    keywords: ["PCOS India", "PCOS diagnosis Rotterdam", "PCOS diet", "PCOS fertility", "irregular periods", "metformin PCOS"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "Diagnosis done right: Rotterdam plus exclusions",
        paragraphs: [
          "PCOS needs 2 of 3 Rotterdam criteria: irregular/absent ovulation, clinical or biochemical androgen excess (acne, hirsutism, hair thinning, high testosterone), and polycystic ovaries on ultrasound. Crucially, thyroid disease, high prolactin, late-onset CAH and Cushing's must be excluded first — ultrasound alone never diagnoses PCOS.",
          "Teens need extra caution: irregular cycles in the first 2–3 years after menarche are often physiological. Labelling too early causes needless anxiety; watchful follow-up with lifestyle is usually correct.",
        ],
        bullets: ["Baseline labs: TSH, prolactin, HbA1c, lipids, vitamin D, androgens as indicated", "Pelvic ultrasound timing matters — early follicular phase in cycling women", "Document hirsutism (Ferriman-Gallwey) and acne severity to track treatment response"],
      },
      {
        heading: "The lifestyle prescription that restores ovulation",
        paragraphs: [
          "Five to ten percent weight loss restores ovulation in many women with overweight PCOS — not through a magic diet but sustained energy deficit with high protein (1.2–1.6 g/kg) and low-GI carbs. Strength training 3x/week improves insulin sensitivity more than cardio alone in trials.",
          "Sleep 7–8 hours and stress management directly affect androgens and cravings. Inositol (myo-inositol) has modest supportive evidence as an adjunct; it complements — never replaces — lifestyle and prescribed medicines.",
        ],
      },
      {
        heading: "Medicines: when each option fits",
        paragraphs: [
          "Combined hormonal pills regulate bleeding, acne and hirsutism when pregnancy isn't planned; they don't 'cure' PCOS but protect the endometrium and skin while lifestyle works. Metformin suits insulin resistance, prediabetes or metformin-responsive cycles — GI side effects ease with slow titration and extended-release forms.",
          "For fertility, letrozole is first-line ovulation induction under specialist monitoring, outperforming clomiphene in PCOS trials. Weight optimisation before conception improves every downstream outcome for mother and baby.",
        ],
      },
      {
        heading: "Skin and hair: timelines that prevent despair",
        paragraphs: [
          "Acne improves in 3–6 months on consistent treatment (topical retinoids/benzoyl peroxide plus hormonal regulation where indicated); hirsutism needs 6–12 months because hair cycles are slow — laser works best on dark hair with light skin after hormones stabilise. Hair shedding (telogen effluvium) recovers 3–6 months after iron, thyroid and crash-diet triggers are fixed.",
          "Avoid waxing/threading irritants during active acne flares, and never use steroid fairness creams — they worsen acne, pigmentation and rebound flares.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Can PCOS be cured permanently?", a: "No permanent cure exists, but symptoms often remit fully with sustained habits — regular cycles, clear skin and natural conception are realistic goals, not miracles." },
      { q: "Do I need metformin if my sugar is normal?", a: "Sometimes — for anovulation with documented insulin resistance or prediabetes. With normal metabolism and regular cycles on lifestyle alone, many women don't need it." },
      { q: "Will hormonal pills harm future fertility?", a: "No — fertility typically returns within months of stopping. Pills protect the uterus and skin in the interim; they don't 'mask damage' when monitored properly." },
      { q: "What should my PCOS diet look like?", a: "Low-GI, high-protein, high-fibre Indian plates: millet + dal + sabzi + salad + curd, protein at breakfast, no sugary drinks, dinner by 7:30–8 pm. Consistency beats any 30-day plan." },
    ],
    extraReferences: [
      { title: "International Evidence-Based PCOS Guideline", source: "ESHRE/ASRM", year: "2023", url: "https://www.eshre.eu/" },
      { title: "ICMR PCOS Management Guidance", source: "ICMR", url: "https://www.icmr.gov.in/" },
    ],
    readMinutes: 17,
  },

  "fatty-liver-reversal-guide": {
    heroImage: PX(11409327),
    heroImageAlt: "Vibrant vegetable salad with pomegranate seeds in a bowl",
    heroImageCredit: "Anthony Rahayel / Pexels",
    inlineImage: PX(16731602),
    inlineImageAlt: "Fresh green spinach leaves bundled together showing vibrant foliage",
    seoTitle: "Fatty Liver (MASLD): Stages, FIB-4, Diet & 7–10% Reversal Plan (2026)",
    seoDescription: "Most early fatty liver is reversible: FIB-4 staging, zero-alcohol rule, Mediterranean-Indian plates, statin safety and the gradual weight-loss target that heals liver fat.",
    keywords: ["fatty liver reversal", "MASLD diet", "FIB-4 score", "NAFLD India", "liver fat weight loss", "statins fatty liver"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "Staging without fear: ultrasound, enzymes and FIB-4",
        paragraphs: [
          "Ultrasound detects fat; liver enzymes (ALT/AST) hint at inflammation; FIB-4 (age, AST, ALT, platelets) estimates fibrosis risk from routine labs. Low FIB-4 with early steatosis means lifestyle-first management with periodic rechecks; high FIB-4 needs hepatology referral and elastography.",
          "Normal enzymes don't exclude fatty liver — up to half of early MASLD has normal ALT. Conversely, mild enzyme bumps with obesity and diabetes usually reflect steatosis, not emergency liver failure.",
        ],
        bullets: ["Ask for FIB-4 calculation at your next LFT review — it takes 30 seconds", "Elastography (FibroScan) quantifies stiffness when fibrosis is suspected", "Biopsy is now rare, reserved for unclear or advanced cases"],
      },
      {
        heading: "Alcohol truth: why 'moderate' still harms MASLD",
        paragraphs: [
          "With existing liver fat, even moderate alcohol accelerates fibrosis — the 'one drink is fine' logic doesn't apply. Zero alcohol is the safest target until fat resolves and enzymes normalise, and binge episodes are particularly injurious.",
          "Social strategies help: soda-lime default, driving duty, early exits, and honest one-liners ('liver rest year — doctor's orders') that end negotiation without lectures.",
        ],
      },
      {
        heading: "Medicines in fatty liver: statins, diabetes drugs and what to avoid",
        paragraphs: [
          "Statins are safe in most MASLD and strongly indicated — heart disease, not liver failure, kills most fatty-liver patients. Mild transient enzyme rises occur; serious injury is rare with monitoring. Pioglitazone and vitamin E help only selected biopsy-proven NASH under specialists.",
          "Avoid unsupervised 'liver tonics', high-dose herbal extracts and painkiller excess (paracetamol within limits is fine; alcohol-paracetamol combination is not). Review all supplements at every visit.",
        ],
      },
      {
        heading: "Exercise prescription for liver fat",
        paragraphs: [
          "Both aerobic (150 min/week brisk walking, cycling, swimming) and resistance training (2x/week) reduce liver fat even without major weight loss — a crucial message for normal-weight ('lean') MASLD, common in India. Post-meal walks add glycaemic benefit.",
          "Track waist and triglycerides monthly; recheck LFT and FIB-4 in 6–12 months. Plateaus beyond 3 months warrant dietitian review, sleep-apnea screening and thyroid/medicine audit.",
        ],
      },
    ],
    extraFaqs: [
      { q: "What FIB-4 value is reassuring?", a: "Below 1.3 (below 2.0 above age 65) suggests low advanced-fibrosis risk. Intermediate and high scores need elastography and hepatology input — your doctor interprets trends, not one value." },
      { q: "Do I need a liver tonic or cleanse?", a: "No proven tonic reverses MASLD. Habits do. Spend the tonic budget on vegetables, a dietitian visit and walking shoes instead." },
      { q: "Can lean people get fatty liver?", a: "Yes — lean MASLD is well recognised in India, driven by visceral fat, insulin resistance and genetics. The same diet-activity prescription applies, with normal-BMI weight goals." },
      { q: "Is coffee really good for the liver?", a: "Observational data link 2–3 cups daily (less sugar) to better liver outcomes. It's a reasonable adjunct — not a treatment — alongside weight, sugar and alcohol control." },
    ],
    extraReferences: [
      { title: "AASLD Practice Guidance on NAFLD/MASLD", source: "AASLD", url: "https://www.aasld.org/" },
      { title: "INASL Guidance on NAFLD", source: "Indian National Association for Study of the Liver", url: "https://www.inasl.org.in/" },
    ],
    readMinutes: 14,
  },

  "sleep-apnea-indian-guide": {
    heroImage: PX(8261178),
    heroImageAlt: "Woman sleeping peacefully in a dimly lit bedroom",
    heroImageCredit: "Ron Lach / Pexels",
    inlineImage: PX(9787785),
    inlineImageAlt: "Woman resting in bed wearing an eye mask for better sleep",
    seoTitle: "Sleep Apnea in India: Snoring Red Flags, Home Sleep Study & CPAP Guide (2026)",
    seoDescription: "Loud snoring with daytime sleepiness? Learn STOP-Bang screening, home vs lab sleep studies, CPAP adaptation, weight and alcohol levers, and driving safety.",
    keywords: ["sleep apnea India", "snoring treatment", "home sleep study", "CPAP", "STOP-Bang", "daytime sleepiness"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "STOP-Bang: the 2-minute self-screen",
        paragraphs: [
          "Score one point each: loud Snoring, daytime Tiredness, Observed pauses, high blood Pressure, BMI above 35 (lower thresholds apply for Asians — consider above 27.5 with belly fat), Age above 50, Neck above 40 cm (men) / 36 cm (women), and male Gender. Scores 0–2 suggest low risk, 3–4 intermediate, 5+ high — but any witnessed pauses with sleepiness deserve evaluation regardless.",
          "Epworth Sleepiness Scale above 10 (dozing in meetings, traffic, conversations) corroborates significant daytime impact. Road accidents from drowsy driving are a leading apnea harm — long-distance drivers should screen proactively.",
        ],
      },
      {
        heading: "Home sleep study vs lab PSG: which test when",
        paragraphs: [
          "Home polygraphy (type 3) records airflow, effort, oxygen and pulse overnight at home — sufficient for most straightforward loud-snoring-plus-sleepiness cases. In-lab polysomnography adds brain waves, leg movements and video, needed for complex, mild-symptom or comorbid cases (heart failure, COPD overlap, narcolepsy suspicion).",
          "Results report AHI (apneas + hypopneas per hour): below 5 normal, 5–15 mild, 15–30 moderate, above 30 severe — interpreted alongside symptoms and oxygen dips, not as a lone number.",
        ],
        bullets: ["Avoid alcohol and sedatives on test night — they worsen indices artificially", "Sleep normally; 'best behaviour' nights underestimate disease", "Repeat testing after major weight change or if symptoms persist on treatment"],
      },
      {
        heading: "CPAP success: mask, pressure and the first two weeks",
        paragraphs: [
          "CPAP is first-line for moderate-severe apnea: gentle air pressure splints the airway open. Modern auto-CPAP with heated humidification and nasal or pillow masks suits most; full-face masks help mouth breathers. Correct fitting solves most 'I can't tolerate it' cases — ask for a mask trial, not a single pickup.",
          "Adaptation plan: wear the mask watching TV for 30 minutes daily for 3 days, then half-nights, then full nights. Nasal congestion, dry mouth and mask marks all have fixes (humidity, chin strap, liner, size change). Most adapt within 1–2 weeks with support.",
        ],
      },
      {
        heading: "Beyond CPAP: weight, position, alcohol and surgery",
        paragraphs: [
          "Ten percent weight loss halves AHI in many patients; bariatric surgery helps severe obesity with apnea. Side-sleeping (tennis-ball technique, positional trainers) helps positional apnea. Evening alcohol relaxes airway muscles and must go — the worst snoring nights follow drinking.",
          "Mandibular advancement devices suit mild-moderate apnea or CPAP-intolerant patients via sleep dentists. Airway surgery (septoplasty, tonsillectomy, UPPP) helps selected anatomy after sleep-medicine evaluation — never as blind first steps.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Is snoring always sleep apnea?", a: "No — simple snoring without pauses, gasping or daytime sleepiness is common and often benign. Witnessed breathing pauses, morning headaches and irresistible daytime drowsiness point toward apnea." },
      { q: "Can I just use an anti-snore device from the internet?", a: "Unsupervised gadgets delay diagnosis and miss severe disease. Screen first (STOP-Bang), test appropriately, then choose proven therapy — devices complement, not replace, evaluation." },
      { q: "Will losing weight cure my apnea?", a: "It often improves it dramatically and sometimes resolves mild cases, but moderate-severe apnea usually needs CPAP alongside weight efforts. Treat now, slim steadily — don't wait." },
      { q: "Is CPAP lifelong?", a: "For most moderate-severe patients, yes — like spectacles for vision. Reassessment after major weight loss or surgery sometimes allows step-down, guided by repeat testing." },
    ],
    extraReferences: [
      { title: "AASM Clinical Practice Guideline for OSA", source: "American Academy of Sleep Medicine", url: "https://aasm.org/" },
      { title: "Indian Initiative on Obstructive Sleep Apnoea Guidelines", source: "INOSA", url: "https://www.nccn.net/" },
    ],
    readMinutes: 13,
  },

  "anemia-mukt-bharat-home-guide": {
    heroImage: PX(5272169),
    heroImageAlt: "Fresh vegetable salad with pomegranate seeds in a blue bowl",
    heroImageCredit: "Denys Gromov / Pexels",
    inlineImage: PX(35496297),
    inlineImageAlt: "Fresh pomegranates with exposed seeds displayed at a market stall",
    seoTitle: "Anemia in India: CBC + Ferritin + B12 Workup, Iron Absorption & Treatment (2026)",
    seoDescription: "Fatigue, pallor, hair fall? Type your anemia first — iron vs B12 vs thalassemia trait — then fix absorption (vitamin C timing), heavy periods and the 3-month refill rule.",
    keywords: ["anemia India", "iron deficiency", "ferritin test", "vitamin B12 deficiency", "heavy periods anemia", "iron tablets absorption"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "The three-test workup: CBC, ferritin, B12",
        paragraphs: [
          "Hemoglobin tells you anemia exists; MCV hints the type (low in iron deficiency/thalassemia trait, high in B12/folate deficiency); ferritin below 30 ng/mL confirms depleted iron stores even when hemoglobin is borderline; B12 below 200 pg/mL (or 200–300 with symptoms) flags the vegetarian-gap deficiency that iron alone never fixes.",
          "Thalassemia trait — common in Sindhi, Punjabi, Gujarati and Bengali communities — shows low MCV with normal/high RBC count and normal ferritin. Mislabelled as iron deficiency, it collects years of useless iron. HPLC confirmation takes one test.",
        ],
        bullets: ["Add CRP when ferritin is borderline — infection falsely raises it", "Check stool occult blood and deworming status in unexplained iron deficiency", "Heavy-period history (PBAC chart) belongs in every woman's anemia workup"],
      },
      {
        heading: "Iron absorption: timing beats dose",
        paragraphs: [
          "Take iron with vitamin C (amla, lemon, guava) on a relatively empty stomach, 2 hours away from chai, coffee, calcium, antacids and thyroid tablets. Alternate-day dosing absorbs better than daily mega-doses for many, with fewer gut effects — discuss the schedule, don't just double tablets.",
          "Expect black stools (normal) and possible constipation or nausea (manageable with dose timing, hydration and fibre). Hemoglobin rises ~1–2 g/dL in 4–8 weeks; continue 3 months beyond normalisation to refill ferritin — stopping at 'normal Hb' guarantees relapse.",
        ],
      },
      {
        heading: "Heavy periods: treating the leak",
        paragraphs: [
          "Changing pads every 1–2 hours, clots larger than a coin, bleeding beyond 7 days, or flooding through protection all define heavy menstrual bleeding — the commonest leak behind women's anemia. Fibroids, adenomyosis, polyps, copper IUDs and thyroid disease are treatable causes, not destiny.",
          "Tranexamic acid (non-hormonal, during menses), hormonal options (pills, LNG-IUS) and fibroid procedures each fit different situations. Iron refills stores while gynaecology fixes the tap — doing only one fails.",
        ],
      },
      {
        heading: "Anemia Mukt Bharat: what the programme offers",
        paragraphs: [
          "India's Anemia Mukt Bharat strategy provides weekly iron-folic acid across age groups, deworming, fortified foods and behaviour-change counselling through schools, anganwadis and health centres. Pregnant women receive daily IFA with haemoglobin tracking.",
          "Use the programme as your supply chain and your doctor as your diagnostician: free tablets work only when the type, dose, duration and cause are all correct.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Why is my ferritin low but hemoglobin normal?", a: "Stores deplete months before hemoglobin falls — the ideal catch window. Early treatment now prevents full anemia plus improves energy, hair and restless legs." },
      { q: "Which iron is best — ferrous sulfate, fumarate, ascorbate?", a: "All work when absorbed; ascorbate and bisglycinate forms are often gentler on the gut. Elemental iron content and consistent timing matter more than brand." },
      { q: "Can I take iron with thyroid medicine?", a: "Never together — separate by 4 hours. Morning thyroid tablet, evening iron with vitamin C is a common workable split." },
      { q: "Do vegetarians need B12 forever?", a: "B12 comes only from animal foods and fortified/supplement sources, so vegetarians need ongoing intake — dairy helps but rarely suffices alone. Recheck yearly after correction." },
    ],
    extraReferences: [
      { title: "Anemia Mukt Bharat Operational Guidelines", source: "MoHFW", url: "https://anemiamuktbharat.info/" },
      { title: "WHO Guideline on Iron Supplementation", source: "WHO", url: "https://www.who.int/" },
    ],
    readMinutes: 12,
  },

  "yoga-blood-sugar-beginners": {
    heroImage: PX(32661595),
    heroImageAlt: "Woman practising yoga outdoors in traditional attire surrounded by greenery",
    heroImageCredit: "Anil Sharma / Pexels",
    inlineImage: PX(32629853),
    inlineImageAlt: "Woman practising yoga outdoors by a serene water body",
    seoTitle: "Yoga for Blood Sugar: 20-Min Beginner Plan with Safety Modifications (2026)",
    seoDescription: "A practical morning yoga flow for diabetes — warm-up, standing sequence, breathing — plus post-meal walks, knee/heart/pregnancy modifications and what to track.",
    keywords: ["yoga diabetes", "yoga blood sugar", "surya namaskar diabetes", "pranayama", "post-meal walk", "yoga beginners India"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "Why yoga helps sugar: three mechanisms",
        paragraphs: [
          "First, muscular work: standing flows and Surya Namaskar contract large leg and trunk muscles, the same glucose-disposing tissue strength training targets. Second, stress reduction: slow breathing and meditation lower cortisol and adrenaline that drive dawn and stress hyperglycaemia. Third, behaviour: a morning practice anchors sleep timing, breakfast discipline and medicine adherence.",
          "Trials show modest HbA1c improvements (typically 0.3–0.8%) when yoga adds to — not replaces — diet, walking and medicines. Expect support, not miracles, and measure with paired pre/post readings.",
        ],
      },
      {
        heading: "The full 20-minute sequence, pose by pose",
        paragraphs: [
          "Minutes 0–5 (warm-up): march in place, ankle circles, hip circles, cat-cow 8 rounds, gentle side bends. Minutes 5–15 (standing flow, 2 rounds): Tadasana → Urdhva Hastasana → Uttanasana (knees soft) → Ashwa Sanchalanasana → Chaturanga (knees down) → Bhujangasana → Adho Mukha → step forward and repeat other side. Hold each 3–5 breaths.",
          "Minutes 15–20 (breathing + close): Anulom-Vilom 8 rounds, Bhramari 5 rounds, 1-minute seated stillness. Pair with a 10-minute walk after breakfast and dinner on the same day.",
        ],
        bullets: ["Breathe through the nose; never strain or hold breath forcefully", "Keep a chair/wall nearby for balance in the first month", "On low-energy days, do breathing + walk only — consistency beats intensity"],
      },
      {
        heading: "Safety modifications that matter",
        paragraphs: [
          "Knees: replace lunges with high-knee marches, skip kneeling flows, use chair-supported squats. Heart disease/uncontrolled BP: avoid inversions, breath retention and hot yoga; keep intensity conversational. Pregnancy: no prone poses, deep twists or backbends after trimester 1 — join a prenatal batch.",
          "Retinopathy: avoid head-below-heart holds and straining; neuropathy: inspect feet before/after, practice on clean mats, never walk barefoot on rough ground. Hypoglycaemia risk on insulin/sulfonylureas: check sugar before practice, carry glucose, and prefer post-breakfast slots.",
        ],
      },
      {
        heading: "Tracking: prove it works for you",
        paragraphs: [
          "For 2 weeks, log fasting + 2-hr post-breakfast sugar on yoga days vs rest days, plus sleep hours and medicine timing. Most see 10–30 mg/dL lower post-meal readings on practice days within a fortnight — visible proof that sustains the habit.",
          "Share the log at your next diabetes review. Dose reductions, when earned, happen on data — never pre-emptively because 'yoga started'.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Morning or evening yoga for sugar?", a: "Morning practice plus post-meal walks wins for most — it sets circadian rhythm and breakfast discipline. Evening gentle flows help sleep; avoid vigorous flows within 2 hours of bed." },
      { q: "How is yoga different from walking for diabetes?", a: "Walking gives more minutes of moderate cardio; yoga adds strength, balance, flexibility and stress physiology. The combination outperforms either alone in trials." },
      { q: "Can seniors with knee pain do this?", a: "Yes with chair-supported modifications and no kneeling or deep squats. Start with breathing + seated/standing-supported moves and progress monthly with a teacher." },
      { q: "Which pranayama is safe daily?", a: "Anulom-Vilom and Bhramari suit most beginners. Skip Kapalbhati with uncontrolled BP, hernia, recent surgery, pregnancy or retinopathy unless a teacher individualises it." },
    ],
    extraReferences: [
      { title: "Yoga and Glycaemia: Systematic Reviews of RCTs", source: "Peer-reviewed journals", url: "https://pubmed.ncbi.nlm.nih.gov/" },
      { title: "IDF Guidance on Physical Activity and Diabetes", source: "International Diabetes Federation", url: "https://idf.org/" },
    ],
    readMinutes: 11,
  },

  "vitamin-d-sunshine-paradox": {
    heroImage: PX(8497994),
    heroImageAlt: "Woman stretching outdoors in a peaceful sunlit park",
    heroImageCredit: "Liliana Drew / Pexels",
    inlineImage: PX(37692641),
    inlineImageAlt: "Woman basking in sunlight amidst vibrant green foliage",
    seoTitle: "Vitamin D Deficiency in India: Testing, 60K Correction & Maintenance (2026)",
    seoDescription: "Why most urban Indians are deficient despite tropical sun — 25-OH testing, weekly 60,000 IU courses, D3 vs D2, calcium pairing and safe sun exposure.",
    keywords: ["vitamin D deficiency India", "vitamin D test", "D3 60K", "cholecalciferol dose", "vitamin D sun exposure", "calcium vitamin D"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "Testing: 25-OH vitamin D, done right",
        paragraphs: [
          "The correct test is 25-hydroxy vitamin D: below 20 ng/mL deficient, 20–30 insufficient, 30–100 sufficient. No fasting needed. Retest 8–12 weeks after a correction course, then yearly — testing monthly wastes money since levels move slowly.",
          "Pair the first test with calcium, and add PTH/alkaline phosphatase when deficiency is severe or bone pain/fractures exist. Normal calcium with low D is typical early; low calcium with tingling needs prompt evaluation.",
        ],
        bullets: ["Same lab for retests — assays vary between labs", "Note supplements taken in the prior month on the requisition", "Screen the household: spouses and teens often share the deficiency"],
      },
      {
        heading: "Correction: the 60K protocol and maintenance",
        paragraphs: [
          "Standard Indian correction is cholecalciferol (D3) 60,000 IU once weekly for 8–12 weeks with a fat-containing meal or milk — D is fat-soluble and absorbs poorly on an empty stomach. Severe deficiency or malabsorption sometimes needs longer courses under supervision.",
          "After correction, maintain with 1,000–2,000 IU daily or 60,000 IU monthly (not weekly forever — indiscriminate mega-dosing causes hypercalcemia with thirst, stones and confusion). Recheck yearly.",
        ],
      },
      {
        heading: "Sun: what actually works in Indian cities",
        paragraphs: [
          "UVB synthesis needs direct midday sun (roughly 11 am–2 pm) on arms and face for 15–20 minutes, 3x/week — glass, sunscreen, full covering, pollution and dark skin all reduce it. Office workers behind glass get essentially zero UVB all winter.",
          "Treat sun as maintenance support, not correction therapy: it sustains replete levels but rarely fixes established deficiency alone. Never burn for vitamin D — short, frequent exposures beat weekend marathons.",
        ],
      },
      {
        heading: "Calcium pairing and bone basics",
        paragraphs: [
          "Vitamin D without calcium builds nothing: adults need ~1,000 mg calcium/day (ragi, sesame, groundnuts, curd, milk, leafy greens). Postmenopausal women and the elderly need combined assessment — DEXA scans guide osteoporosis treatment, not D levels alone.",
          "Falls prevention completes the picture: strength, balance, vision correction and home safety (lighting, rails, non-slip mats) matter as much as any capsule for fracture prevention.",
        ],
      },
    ],
    extraFaqs: [
      { q: "D3 or D2 — which should I take?", a: "D3 (cholecalciferol) raises and sustains levels better and is the standard Indian formulation. D2 suits only specific vegan/pharmacy situations." },
      { q: "Can I take 60K weekly permanently?", a: "No — it's a correction course, not maintenance. After 8–12 weeks, step down to daily low-dose or monthly 60K with yearly retesting to avoid toxicity." },
      { q: "Why am I deficient despite morning walks?", a: "Early-morning and evening sun has little UVB; glass blocks it fully; pollution scatters it. Midday brief exposures help, but testing plus supplements correct reliably." },
      { q: "Does vitamin D boost immunity against all infections?", a: "Correcting deficiency supports immune function, but mega-doses don't supercharge immunity. Vaccines, sleep, nutrition and hand hygiene matter far more." },
    ],
    extraReferences: [
      { title: "Endocrine Society Clinical Practice Guideline: Vitamin D", source: "Endocrine Society", url: "https://www.endocrine.org/" },
      { title: "Indian Menopause Society Guidance on Vitamin D", source: "IMS", url: "https://indianmenopausesociety.org/" },
    ],
    readMinutes: 10,
  },

  "millets-for-diabetes-india-guide": {
    heroImage: PX(1640777),
    heroImageAlt: "Assorted millets in wooden bowls — foxtail, little, barnyard, kodo — Indian ancient grains",
    heroImageCredit: "Mareefe / Pexels",
    inlineImage: PX(1099680),
    inlineImageAlt: "Indian millet thali with dal, sabzi and curd — balanced low-GI meal",
    seoTitle: "Millets for Diabetes India: Low-GI Swap Guide Foxtail Little Barnyard Kodo (2026)",
    seoDescription: "Replace white rice with low-GI millets: foxtail GI 50.8, little 52, barnyard 50 — diabetic-friendly, fibre-rich, 50:50 start, thali-builder + millet-swap + tracking.",
    keywords: ["millets diabetes India", "low GI millets", "foxtail millet GI", "little millet", "barnyard millet", "millet swap"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "GI, fibre, protein — why millets win",
        paragraphs: [
          "Foxtail millet GI 50.8, little millet GI 52, barnyard millet GI 50, kodo millet GI 65 vs white rice GI 73, brown rice GI 68, roti GI 62 — lower GI + more fibre 2-3x + more protein + minerals iron, calcium, magnesium. ICMR-NIN + ICAR data.",
          "One katori cooked millet ~120 kcal, fibre 2-3g, protein 3g — vs white rice 130 kcal, fibre 0.5g, protein 2g. Small swap, big metabolic impact when paired with dal + veg + curd.",
        ],
      },
      {
        heading: "Cooking millets without bloating",
        paragraphs: [
          "Soak 6h, rinse well, cook soft with extra water (1:2.5 ratio), add pinch salt + ghee, pair with dal + curd + buttermilk for probiotic + easy digestion. Start 50:50 white rice + millet for 1 week.",
          "Storage: dry millets 6 months in airtight, cooked 2 days fridge. Batch cook Sunday + portion for week — adherence hack.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Which millet best for diabetes?", a: "Little millet GI 52, foxtail GI 50.8, barnyard GI 50, kodo GI 65 — all lower than white rice GI 73. Start 50:50 mix, watch portion 1 katori, pair with dal + veg + curd for balanced GI." },
      { q: "Can millets cause thyroid issues?", a: "Millets contain goitrogens but normal cooked portions safe for most — avoid massive raw millet + iodine deficiency combo. Iodised salt + varied diet + TSH monitoring if hypothyroid." },
    ],
    extraReferences: [
      { title: "ICMR-NIN Millet Guidelines", source: "ICMR-NIN", year: "2020" },
      { title: "ICAR Indian Institute of Millets Research", source: "ICAR", url: "https://millets.res.in/" },
    ],
    readMinutes: 12,
  },

  "intermittent-fasting-india-safe-guide": {
    heroImage: PX(1640777),
    heroImageAlt: "Navratri fasting thali with kuttu, fruits, curd — Indian fasting foods",
    heroImageCredit: "Pexels / Food",
    inlineImage: PX(1099680),
    inlineImageAlt: "Intermittent fasting clock 16:8 with Indian thali — safe guide",
    seoTitle: "Intermittent Fasting India: 16:8, Navratri, Ekadashi Safe Guide (2026)",
    seoDescription: "Intermittent fasting 16:8 + Navratri + Ekadashi — who should avoid, hydration, breaking fast, diabetes safety, fasting planner + premium + WhatsApp.",
    keywords: ["intermittent fasting India", "Navratri fasting", "Ekadashi", "16:8 fasting", "fasting diabetes", "fasting planner"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "16:8 vs 12:12 — what suits Indians",
        paragraphs: [
          "12:12 overnight fast (7:30pm dinner to 7:30am breakfast) suits most Indians — circadian + digestion + sleep friendly. 14:10 and 16:8 (12pm-8pm eating) need supervision if diabetic on insulin/sulfonylurea, elderly, pregnant, history eating disorder.",
          "Breaking fast: water + fruit + curd first, then dal + veg + millet roti — avoid oily + sugary immediately. Hydration: 2-3L water + buttermilk + coconut water + ORS if hot.",
        ],
      },
      {
        heading: "Fasting + diabetes safety checklist",
        paragraphs: [
          "Avoid fasting if HbA1c >10, recurrent hypos, elderly, pregnant, kidney disease, on insulin/sulfonylurea without plan. If fasting, check sugar more often, carry glucose, break if <70 or >250, inform family.",
          "Medicine timing: discuss with doctor pre-fast — SGLT2 inhibitors often paused during vomiting/fasting/surgery, insulin/sulfonylurea dose reduced. Never self-adjust without guidance.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Can I do 16:8 daily?", a: "12:12 daily safe for most; 16:8 needs supervision if diabetic, elderly, pregnant, eating disorder history. Start 12:12, extend gradually, monitor energy + sugar + mood." },
      { q: "What to eat during Navratri?", a: "Kuttu, singhara, sama, sabudana — but sabudana high GI 70+. Prefer kuttu + curd + fruits + nuts + hydration, avoid fried. Use /fasting-planner for balanced Navratri thali + premium calendar." },
    ],
    extraReferences: [{ title: "ICMR Fasting & Diabetes Guidance", source: "ICMR" }],
    readMinutes: 11,
  },

  "high-protein-vegetarian-india-guide": {
    heroImage: PX(1640777),
    heroImageAlt: "High protein vegetarian Indian thali with dal, paneer, soya chunks, sprouts, curd",
    heroImageCredit: "Pexels / Food",
    inlineImage: PX(1099680),
    inlineImageAlt: "Vegetarian protein sources India — dal, soya, paneer, sprouts, curd, whey",
    seoTitle: "High Protein Vegetarian India: Dal Soya Paneer Sprouts 1.2-1.6g/kg Guide (2026)",
    seoDescription: "Hit protein 1.2-1.6g/kg vegetarian: dal 9g, soya 52g, paneer 18g, sprouts 7g, curd, whey 25g — Indian thali + tracking + premium + affiliate.",
    keywords: ["high protein vegetarian India", "soya chunks protein", "dal protein", "paneer protein", "vegetarian protein 1.2g/kg", "protein thali"],
    authorRole: "BHG Editorial Team · Evidence-reviewed health writers",
    extraBody: [
      {
        heading: "How to hit 100g protein vegetarian — sample day",
        paragraphs: [
          "Breakfast: 2 moong cheela + paneer 100g = 15g protein. Lunch: dal 2 katori 18g + curd 1 katori 6g + 2 roti 6g + sabzi. Snack: sprouts 1 katori 14g + peanuts 30g 7g + fruit. Dinner: soya chunks 40g dry = 20g + curd 6g + millet roti 3g + sabzi. Total ~95g + whey 1 scoop 25g = 120g if needed.",
          "Distribution matters: 20-30g per meal + 10g snacks = muscle + satiety + sugar control. Track via /nutrition-tracker + /health-calculators protein calc.",
        ],
      },
      {
        heading: "Soya, paneer, whey — safety + quality",
        paragraphs: [
          "Soya chunks 52g/100g dry, complete amino, iron, calcium — soak 10 min hot water, rinse, cook with masala. Paneer 18g/100g, calcium, but saturated fat — 100g/day max if high LDL. Whey 25g/scoop, Informed-Choice tested, food first.",
          "Kidney disease: protein 0.6-0.8g/kg + nephrology guidance, avoid whey + soya excess. Gout: dal + soya moderate, hydrate, avoid purine excess + alcohol.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Is soya safe daily?", a: "Yes — 40-50g dry soya chunks 2-3x/week safe for most, complete protein + iron + calcium. Soak + rinse + cook well, pair with vitamin C for iron absorption. Avoid if soy allergy." },
      { q: "Which whey to buy?", a: "Concentrate 80% whey, 25g/scoop, Informed-Choice or Labdoor tested, no added sugar, Rs2500-4500/kg. Check /api/affiliate/click + gtag + Product JSON-LD + affiliate-disclosure." },
    ],
    extraReferences: [{ title: "ICMR-NIN Protein Requirements 2020", source: "ICMR-NIN", year: "2020" }],
    readMinutes: 13,
  },
};

export type EnrichedArticle = Article & {
  heroImage: string;
  heroImageAlt: string;
  heroImageCredit: string;
  inlineImage: string;
  inlineImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  authorRole: string;
};

export function getEnrichedArticle(slug: string): EnrichedArticle | undefined {
  const base = ARTICLES.find((a) => a.slug === slug);
  const en = BLOG_ENRICHMENT[slug];
  if (!base || !en) return base as EnrichedArticle | undefined;
  return {
    ...base,
    heroImage: en.heroImage,
    heroImageAlt: en.heroImageAlt,
    heroImageCredit: en.heroImageCredit,
    inlineImage: en.inlineImage,
    inlineImageAlt: en.inlineImageAlt,
    seoTitle: en.seoTitle,
    seoDescription: en.seoDescription,
    keywords: en.keywords,
    authorRole: en.authorRole,
    body: [...base.body, ...en.extraBody],
    faqs: [...base.faqs, ...en.extraFaqs],
    references: [...base.references, ...en.extraReferences],
    readMinutes: en.readMinutes,
  };
}

export function getAllEnrichedArticles(): EnrichedArticle[] {
  return ARTICLES.map((a) => getEnrichedArticle(a.slug)!).filter(Boolean);
}

export const BLOG_CATEGORIES = Array.from(new Set(ARTICLES.map((a) => a.category)));
