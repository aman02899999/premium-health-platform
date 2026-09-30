import type { DiseaseDetail, DiseaseSummary } from "@/types";
import { DISEASE_MAP } from "./diseases-index";

type PillarOverride = Partial<DiseaseDetail>;

const COMMON_MED_SAFETY = [
  "Never stop, reduce or change prescribed medicines without medical supervision — sudden changes can be dangerous.",
  "Tell your doctor about all herbs, supplements and over-the-counter products you use.",
  "If you miss a dose, follow the leaflet or ask your pharmacist; never double-dose without guidance.",
  "Store medicines away from heat and moisture, common in Indian summers.",
];

const COMMON_SHOULD_NOT = [
  "Do not try unproven 'cure' claims from forwards or social media.",
  "Do not use someone else's prescription — same symptom does not mean same condition.",
  "Do not delay care for red-flag symptoms while trying only home remedies.",
  "Do not combine multiple sedating, BP-lowering or sugar-lowering products without supervision.",
];

const COMMON_WHEN_DOCTOR = [
  "Symptoms persist beyond 1–2 weeks despite basic measures",
  "You need repeated self-medication to stay comfortable",
  "You have diabetes, heart, kidney, liver disease or are pregnant",
  "You notice any emergency warning sign listed below",
];

function genericDetail(s: DiseaseSummary): DiseaseDetail {
  const name = s.name;
  return {
    ...s,
    definition: `${name} is a health condition affecting the ${s.system.toLowerCase()} system. This guide helps you understand its symptoms, causes, risk factors, diagnosis and management options — including modern medicine, Ayurveda perspectives, nutrition and lifestyle — so you can have better conversations with your doctor.`,
    quickFacts: [
      { label: "Body system", value: s.system },
      { label: "Category", value: s.category },
      { label: "Course", value: s.chronic ? "Often long-term (chronic)" : "Often short-term / episodic" },
      { label: "How common", value: s.common ? "Common in India" : "Less common" },
      { label: "Nutrition role", value: s.nutritionRelevance === "high" ? "High — diet matters a lot" : s.nutritionRelevance === "medium" ? "Moderate — diet supports care" : "Supportive" },
      { label: "Care level", value: s.severity === "emergency-aware" ? "Know emergency signs" : s.severity === "high" ? "Needs regular medical follow-up" : "Often managed with guidance" },
    ],
    causes: [
      `Multiple factors can contribute to ${name.toLowerCase()}, including genetics, lifestyle, infections or hormonal shifts depending on the subtype.`,
      "In India, diet patterns, sleep, stress, pollution and activity levels often modify risk.",
      "Sometimes no single cause is found; doctors treat the pattern and risk factors together.",
    ],
    types: [
      { name: "Common pattern", desc: `The typical presentation of ${name.toLowerCase()} seen in outpatient practice.` },
      { name: "Severe / complicated pattern", desc: "Less common but needs closer monitoring and specialist input." },
    ],
    diagnosis: [
      "Your doctor will take a history of symptoms, duration, family history and medicines.",
      "A focused physical examination checks relevant body systems.",
      "Basic blood tests or imaging may be advised to confirm the pattern and rule out mimics.",
      "Diagnosis is clinical plus tests — no single home observation confirms it.",
    ],
    investigations: [
      { test: "Basic blood work (CBC, sugar, kidney/liver as relevant)", purpose: "Finds underlying contributors and baselines" },
      { test: "Condition-specific test", purpose: "Confirms diagnosis; your doctor chooses based on presentation" },
      { test: "Follow-up markers", purpose: "Tracks response to treatment and lifestyle changes" },
    ],
    modernTreatment: [
      "Treatment depends on cause, severity and other conditions — there is no one-size-fits-all prescription.",
      "Doctors may advise medicines, procedures or watchful waiting with lifestyle measures.",
      "Follow-up visits help adjust the plan; report side effects early.",
      "Emergency presentations need hospital care, not home management.",
    ],
    ayurvedaView: [
      `In Ayurvedic literature, conditions resembling ${name.toLowerCase()} are discussed in classical texts with concepts of dosha, agni and srotas — these are traditional frameworks, not modern diagnoses.`,
      "Traditional approaches emphasise diet (pathya), daily routine (dinacharya), sleep and stress balance alongside classical formulations.",
      "Any Ayurvedic formulation should be used only after consultation with a qualified practitioner, especially if you take modern medicines or have kidney/liver disease.",
    ],
    herbsUsed: [
      { name: "Amla", slug: "amla", note: "Traditionally used as rasayana; food-level use is generally safe." },
      { name: "Turmeric", slug: "turmeric", note: "Traditional spice; high-dose extracts need medical guidance." },
    ],
    nutrition: [
      "Build plates around vegetables, whole grains, pulses, nuts and seeds with adequate protein.",
      "Limit refined sugar, sugary drinks, deep-fried snacks and excess salt.",
      "Eat at regular times; avoid very late heavy dinners.",
      "If diabetic, kidney or heart disease coexists, personalise with a dietitian.",
    ],
    lifestyle: [
      "Aim for 150 minutes/week of brisk walking or equivalent, as advised by your doctor.",
      "Prioritise 7–8 hours of sleep; keep screens away before bed.",
      "Manage stress with breathing, prayer, music or counselling support.",
      "Avoid tobacco and limit alcohol — both worsen most chronic conditions.",
    ],
    yogaActivity: [
      "Gentle yoga, stretching and pranayama can support flexibility, stress and breathing.",
      "Start slow (15–20 min/day) and avoid painful postures during flares.",
      "People with heart disease, hernia, glaucoma or pregnancy need modified practices.",
    ],
    homeopathyNote: [
      "Homeopathy is a separate system based on 'like cures like' and ultra-dilutions.",
      "High-quality clinical evidence for most claimed uses is limited or insufficient.",
      "Do not replace proven treatment for serious disease with only homeopathic products; discuss openly with your doctor.",
    ],
    evidenceNotes: [
      "Lifestyle measures (diet, activity, sleep, tobacco avoidance) carry the strongest evidence for prevention and risk reduction across chronic diseases.",
      "Modern medicines are evaluated in trials for benefit and harm; traditional and herbal options vary from moderate to insufficient evidence depending on the claim.",
      "Be cautious of 'guaranteed cure' claims — they are a red flag for misinformation.",
    ],
    shouldNotDo: [...COMMON_SHOULD_NOT],
    medicationSafety: [...COMMON_MED_SAFETY],
    complications: [
      "Ignoring persistent symptoms can allow preventable complications.",
      "Unsupervised medicines or supplements can harm liver, kidney or interact with prescriptions.",
    ],
    emergencySigns: [
      "Chest pain or pressure, severe breathlessness or fainting",
      "Sudden weakness, face droop or speech difficulty",
      "Severe bleeding, black stools or vomiting blood",
      "High fever with confusion or severe dehydration",
    ],
    whenToSeeDoctor: [...COMMON_WHEN_DOCTOR],
    faqs: [
      { q: `Can ${name.toLowerCase()} be cured permanently?`, a: "It depends on the cause. Some triggers resolve fully; many chronic patterns are managed well rather than 'cured'. Focus on control, prevention of complications and quality of life with your doctor's plan." },
      { q: "Can diet alone manage it?", a: "Nutrition powerfully supports care and sometimes reduces medicine needs, but do not stop prescribed treatment on diet alone without supervision." },
      { q: "Are Ayurvedic or herbal options safe?", a: "Food-level spices are usually fine, but concentrated extracts and classical formulations can interact with medicines or harm kidney/liver in some people. Always inform both your doctor and Ayurvedic practitioner." },
      { q: "When should I go to the emergency?", a: "For chest pain, severe breathlessness, sudden neuro symptoms, severe bleeding, fainting or confusion — seek urgent care immediately." },
    ],
    references: [
      { title: "WHO Fact Sheets — Chronic disease prevention", source: "World Health Organization" },
      { title: "Standard Treatment Guidelines", source: "Ministry of Health & Family Welfare, India" },
      { title: "Ayurvedic Pharmacopoeia of India (general reference)", source: "Ministry of AYUSH" },
    ],
    relatedDiseases: [],
    relatedMedicines: [],
    relatedHerbs: ["ashwagandha", "turmeric", "amla", "giloy"],
    relatedLabs: ["cbc", "fasting-glucose"],
    updatedAt: "2026-08-20",
    imagePrompt: `Premium editorial medical illustration of ${name} in an adult Indian human body, anatomically educational, clean modern healthcare infographic aesthetic, sophisticated Indian visual accents, realistic but non-graphic, high detail, professional medical publication quality, ultra-HD.`,
  };
}

const PILLARS: Record<string, PillarOverride> = {
  "type-2-diabetes": {
    definition:
      "Type 2 diabetes is a long-term metabolic condition where blood sugar stays higher than healthy because cells resist insulin and the pancreas cannot keep up. In India it often appears a decade earlier than in Western populations and is strongly linked to belly fat, diet patterns, sleep and inactivity. Good news: with early action, structured nutrition, activity, weight management and appropriate medicines, blood sugar can be controlled and complications delayed or prevented.",
    quickFacts: [
      { label: "Key marker", value: "HbA1c ≥ 6.5% (on lab testing)" },
      { label: "Fasting sugar", value: "≥126 mg/dL on repeat testing suggests diabetes" },
      { label: "Common in India", value: "Very common — 100M+ adults live with diabetes" },
      { label: "Course", value: "Chronic but highly manageable" },
      { label: "Nutrition role", value: "Very high — diet is foundational" },
      { label: "Reversible?", value: "Remission possible for some with weight loss; needs medical follow-up" },
    ],
    causes: [
      "Insulin resistance from excess visceral (belly) fat and inactivity",
      "Progressive beta-cell fatigue in the pancreas over years",
      "High intake of refined carbs, sugary drinks and ultra-processed foods",
      "Chronic sleep loss, stress and smoking which worsen insulin action",
      "Genetic predisposition — strong family clustering in Indian families",
      "Certain medicines (e.g., steroids) and hormonal conditions like PCOS",
    ],
    types: [
      { name: "Type 2 diabetes", desc: "Commonest; adult-onset but now seen in teens with obesity." },
      { name: "Prediabetes", desc: "HbA1c 5.7–6.4%; highest-value window for prevention." },
      { name: "Diabetes with complications", desc: "With eye, kidney, nerve or heart involvement needing intensive care." },
    ],
    diagnosis: [
      "Fasting plasma glucose, 2-hour post-meal glucose and HbA1c together give the picture.",
      "Repeat testing confirms the diagnosis — one reading is not enough.",
      "Doctors also check BP, weight, lipids, kidney (creatinine/eGFR, urine ACR) and eyes/feet.",
      "Screening is advised from age 30 in India, earlier with risk factors.",
    ],
    investigations: [
      { test: "HbA1c", purpose: "3-month average sugar; diagnosis + monitoring", slug: "hba1c" },
      { test: "Fasting glucose", purpose: "Baseline sugar control", slug: "fasting-glucose" },
      { test: "Lipid profile", purpose: "Heart-risk assessment", slug: "lipid-profile" },
      { test: "Creatinine + eGFR, urine ACR", purpose: "Kidney screening", slug: "creatinine" },
      { test: "Liver enzymes + ultrasound if fatty liver suspected", purpose: "Metabolic liver check", slug: "liver-enzymes" },
    ],
    modernTreatment: [
      "Lifestyle therapy is first-line for everyone: diet, 150+ min/week activity, weight, sleep, tobacco cessation.",
      "Metformin is commonly a first medicine; newer classes (SGLT2 inhibitors, GLP-1 RAs) help selected patients with heart/kidney/weight needs.",
      "Some people need combination tablets or insulin — needing insulin is not a failure; it protects organs.",
      "BP and cholesterol are treated aggressively because heart risk is high in diabetes.",
      "Annual eye, foot and kidney screening prevents silent damage.",
    ],
    ayurvedaView: [
      "Classical texts describe Madhumeha under Prameha with concepts of kapha-medodushti and ojas — a traditional lens, not a modern diagnosis.",
      "Traditional guidance emphasises pathya-apathya (wholesome diet), regular meal times, physical activity and weight balance.",
      "Formulations like Nishamalaki or Chandraprabha are traditionally discussed; they must not replace glucose-lowering medicines without supervision.",
      "Always coordinate Ayurvedic and modern care to avoid hypoglycaemia or interactions.",
    ],
    herbsUsed: [
      { name: "Methi (Fenugreek)", slug: "fenugreek", note: "Fibre-rich seeds may modestly support post-meal sugar; limited-moderate evidence." },
      { name: "Karela (Bitter Gourd)", slug: "bitter-gourd", note: "Traditional food; extracts may lower sugar — hypoglycaemia risk with medicines." },
      { name: "Gudmar", slug: "gudmar", note: "Traditionally called 'sugar destroyer'; limited evidence, use only with monitoring." },
      { name: "Jamun", slug: "jamun", note: "Traditional fruit/seed use; limited clinical evidence." },
    ],
    nutrition: [
      "Plate method: ½ vegetables, ¼ whole grains (brown rice, millets, whole wheat), ¼ protein (dal, paneer, soya, eggs, fish).",
      "Choose low-GI carbs: ragi, jowar, bajra, oats, whole moong; limit white rice, maida, sweets, juices.",
      "Add 25–30g fibre/day via vegetables, salads, flax and methi seeds.",
      "Protein 0.8–1.2 g/kg/day (higher if advised); distribute across meals.",
      "Use mustard/groundnut/olive oil in rotation; 3–4 tsp/day total visible fat.",
      "Avoid sugary chai, cold drinks, packaged juices; prefer buttermilk, lemon water, green tea.",
    ],
    lifestyle: [
      "Walk 10–15 min after each meal — it meaningfully lowers post-meal spikes.",
      "Strength train 2–3x/week; muscle is your glucose sink.",
      "Sleep 7–8 hours; even 2 nights of short sleep worsens insulin resistance.",
      "Check feet daily; diabetes dulls sensation and slows healing.",
      "Carry glucose tablets if on insulin or sulfonylureas.",
    ],
    yogaActivity: [
      "Surya namaskar, brisk walking, cycling and swimming improve insulin sensitivity.",
      "Yoga asanas like Trikonasana, Dhanurasana and Paschimottanasana support flexibility and stress (practice with a teacher).",
      "Pranayama and meditation help stress-linked sugar spikes.",
    ],
    homeopathyNote: [
      "No reliable evidence shows homeopathy controls blood sugar or prevents complications.",
      "Using only homeopathy while stopping proven medicines risks ketoacidosis, coma and organ damage.",
      "If you wish to explore it, keep all diabetes medicines and monitoring unchanged and inform your doctor.",
    ],
    evidenceNotes: [
      "Strong evidence: weight loss (5–10%), activity, metformin, SGLT2/GLP-1 in indicated groups, BP/statin control for heart protection.",
      "Moderate: structured low-GI Indian diets, millets vs white rice for post-meal control.",
      "Limited/mixed: cinnamon, methi, karela extracts — small trials, modest effects, product variability.",
      "Insufficient: claims of 'permanent cure in 7 days' or stopping all medicines with a single herb.",
    ],
    shouldNotDo: [
      "Do not stop diabetes medicines because one reading is normal.",
      "Do not follow extreme 'no-carb' or 'only-fruit' diets without supervision — hypoglycaemia and nutrient gaps are real.",
      "Do not trust 'sugar-cure' powders without labels or heavy-metal testing.",
      ...COMMON_SHOULD_NOT,
    ],
    medicationSafety: [...COMMON_MED_SAFETY, "Low-sugar symptoms (sweating, tremor, confusion) need fast carbs immediately — discuss a sick-day plan."],
    complications: ["Heart attack and stroke", "Kidney disease", "Eye disease (retinopathy)", "Foot ulcers and amputations", "Nerve damage (neuropathy)", "Fatty liver and infections"],
    emergencySigns: ["Blood sugar >300 with vomiting, fruity breath or confusion (possible DKA)", "Shaking, sweating, confusion (hypoglycaemia) — take fast sugar, seek help if not recovering", "Chest pain, sudden weakness or speech change", "Foot wound with fever, spreading redness or black colour"],
    whenToSeeDoctor: ["New excessive thirst/urination or unexplained weight loss", "HbA1c above target on two checks", "Recurrent lows or night sweats", ...COMMON_WHEN_DOCTOR],
    relatedDiseases: ["prediabetes", "insulin-resistance", "obesity", "fatty-liver", "high-blood-pressure", "high-cholesterol", "chronic-kidney-disease", "neuropathy"],
    relatedMedicines: ["metformin", "glimepiride", "dapagliflozin", "atorvastatin"],
    relatedHerbs: ["fenugreek", "bitter-gourd", "gudmar", "jamun", "cinnamon", "turmeric"],
    relatedLabs: ["hba1c", "fasting-glucose", "lipid-profile", "creatinine", "liver-enzymes"],
    faqs: [
      { q: "Can type 2 diabetes be reversed?", a: "Some people achieve remission (normal sugar without medicines) after major sustained weight loss, especially early in the disease. It needs medical supervision, continued monitoring and lifelong habits — remission is not a guaranteed cure." },
      { q: "Is rice completely banned?", a: "No. Portion, variety and pairing matter more. Smaller portions of brown rice or millets with dal, vegetables and salad blunt spikes far better than large white-rice meals." },
      { q: "Are methi or karela enough instead of medicines?", a: "They are supportive foods with modest, variable effects — not substitutes for prescribed medicines. If combined, monitor sugar closely to avoid lows." },
      { q: "How often should I check HbA1c?", a: "Typically every 3–6 months until stable, then 6-monthly, plus annual kidney, eye and foot screening. Your doctor personalises the schedule." },
      { q: "What sugar levels need emergency care?", a: "Very high sugar with vomiting/confusion, or low sugar that does not recover after fast carbs, needs urgent care. When in doubt, seek help." },
    ],
    references: [
      { title: "Standards of Medical Care in Diabetes", source: "American Diabetes Association", year: "2025" },
      { title: "ICMR Guidelines for Management of Type 2 Diabetes", source: "ICMR, India", year: "2018" },
      { title: "WHO HEARTS / Diabetes modules", source: "World Health Organization" },
    ],
  },
  "high-blood-pressure": {
    definition: "High blood pressure (hypertension) means arterial pressure stays ≥140/90 mmHg on repeated measurements. Called the 'silent killer', it usually has no symptoms until it damages the heart, brain, kidneys or eyes. In India, excess salt (papad, pickle, packaged snacks), belly fat, alcohol, sleep apnea and stress drive much of the burden — all modifiable alongside medicines.",
    quickFacts: [
      { label: "Normal", value: "<120/80 mmHg" },
      { label: "Hypertension", value: "≥140/90 (clinic) or ≥135/85 (home average)" },
      { label: "Salt target", value: "<5 g/day (about 1 tsp)" },
      { label: "Course", value: "Chronic, controllable" },
      { label: "Nutrition role", value: "Very high" },
      { label: "Key risk", value: "Heart attack, stroke, kidney disease" },
    ],
    causes: ["Excess salt and processed foods", "Overweight and inactivity", "Alcohol and tobacco", "Chronic stress and poor sleep", "Kidney, thyroid or sleep-apnea causes (secondary)", "Family history and age"],
    modernTreatment: ["DASH-style eating, salt <5g, weight, activity and alcohol limits help every patient.", "Common classes: CCBs (amlodipine), ARBs/ACE inhibitors, thiazide diuretics — often combined.", "Home BP monitoring (seated, rested, correct cuff) improves control.", "Never stop BP medicines suddenly; rebound surges can trigger emergencies."],
    herbsUsed: [
      { name: "Arjuna", slug: "arjuna", note: "Traditionally used for heart support; limited clinical evidence — not a BP substitute." },
      { name: "Garlic", slug: "garlic", note: "Modest BP effect in some trials; interacts with blood thinners." },
      { name: "Moringa", slug: "moringa", note: "Nutritious food; BP claims have limited evidence." },
    ],
    nutrition: ["Cut pickle, papad, namkeen, bread, biscuits, sauces, restaurant gravies — hidden salt is huge.", "Eat potassium-rich foods (banana, moong, curd, coconut water) unless kidney disease restricts potassium.", "Follow DASH: fruits, vegetables, whole grains, low-fat dairy, nuts, less red meat.", "Read labels: >400 mg sodium per 100 g is high."],
    emergencySigns: ["BP >180/120 with chest pain, breathlessness, vision change or weakness — emergency", "Sudden severe headache with vomiting or confusion", "Chest pressure or slurred speech — call emergency immediately"],
    relatedDiseases: ["heart-disease", "stroke", "chronic-kidney-disease", "type-2-diabetes", "sleep-apnea"],
    relatedMedicines: ["amlodipine", "losartan", "atorvastatin"],
    relatedHerbs: ["arjuna", "garlic", "moringa"],
    relatedLabs: ["lipid-profile", "creatinine", "fasting-glucose"],
    investigations: [
      { test: "Home + clinic BP average", purpose: "Confirms hypertension" },
      { test: "Creatinine/eGFR, urine routine", purpose: "Kidney impact", slug: "creatinine" },
      { test: "Lipid profile + ECG", purpose: "Heart-risk baseline", slug: "lipid-profile" },
    ],
    references: [
      { title: "WHO HEARTS Technical Package for Hypertension", source: "World Health Organization" },
      { title: "India Hypertension Control Initiative Guidelines", source: "MoHFW / ICMR" },
    ],
  },
  hypothyroidism: {
    definition: "Hypothyroidism means the thyroid makes too little hormone, slowing metabolism. Hashimoto's autoimmunity is the commonest cause in India. Fatigue, weight gain, hair fall, constipation, dry skin and feeling cold are typical. Once diagnosed with high TSH, daily levothyroxine — taken correctly on an empty stomach — restores balance for most people.",
    quickFacts: [
      { label: "Key test", value: "TSH (high) + low FT4" },
      { label: "Common cause", value: "Hashimoto's thyroiditis" },
      { label: "Treatment", value: "Daily levothyroxine, usually lifelong" },
      { label: "Course", value: "Chronic, well-controlled with medicine" },
      { label: "Nutrition role", value: "High — timing and nutrients matter" },
      { label: "Myth", value: "No herb reliably replaces thyroid hormone" },
    ],
    causes: ["Hashimoto's autoimmunity", "Iodine deficiency or excess", "Postpartum thyroiditis", "Thyroid surgery or radioiodine", "Certain drugs (amiodarone, lithium)"],
    modernTreatment: ["Levothyroxine 30–60 min before breakfast, away from iron/calcium/tea/coffee.", "Recheck TSH after 6–8 weeks of any dose change.", "Treat BP, lipids and anemia alongside; they often coexist.", "Pregnancy needs tighter control — inform your doctor immediately if pregnant."],
    nutrition: ["Take thyroid medicine with water only; wait before chai, milk or breakfast.", "Ensure selenium (1–2 brazil nuts or eggs), zinc and iron via diet; correct B12/D.", "Cruciferous vegetables are fine cooked in normal amounts — no need to ban them.", "Avoid kelp/iodine mega-supplements unless prescribed."],
    relatedDiseases: ["pcos", "obesity", "anemia", "high-cholesterol", "depression"],
    relatedMedicines: ["levothyroxine"],
    relatedLabs: ["tsh", "vitamin-b12", "lipid-profile"],
    relatedHerbs: ["ashwagandha", "brahmi"],
    herbsUsed: [
      { name: "Ashwagandha", slug: "ashwagandha", note: "May alter thyroid levels — avoid self-use with thyroid disease; discuss with doctor." },
      { name: "Brahmi", slug: "brahmi", note: "Traditional mind support; no thyroid-hormone replacement value." },
    ],
    references: [{ title: "ATA Hypothyroidism Guidelines", source: "American Thyroid Association" }],
  },
  pcos: {
    definition: "PCOS affects 1 in 5–6 Indian women of reproductive age — irregular periods, acne, hair fall, facial hair, weight gain and fertility challenges driven by insulin resistance and androgen excess. Diagnosis uses Rotterdam criteria (2 of 3: irregular ovulation, androgen signs, polycystic ovaries) after excluding thyroid and prolactin issues. Lifestyle is first-line and often restores cycles.",
    quickFacts: [
      { label: "Diagnosis", value: "Rotterdam criteria + exclusion tests" },
      { label: "Core driver", value: "Insulin resistance in most cases" },
      { label: "Weight", value: "5–10% loss often restores ovulation" },
      { label: "Course", value: "Chronic, highly manageable" },
      { label: "Nutrition role", value: "Very high" },
      { label: "Fertility", value: "Very treatable with guidance" },
    ],
    causes: ["Insulin resistance", "Family history", "Weight gain and inactivity", "Chronic stress and sleep loss"],
    modernTreatment: ["Lifestyle (diet + 150 min activity + sleep) is first-line for all.", "Hormonal pills regulate bleeding/acne when not trying to conceive.", "Metformin helps selected women with insulin resistance.", "Fertility medicines (letrozole) under specialist care when planning pregnancy."],
    nutrition: ["Low-GI, high-protein plates; 25–30 g fibre; whole grains over refined.", "Strength training 3x/week improves insulin sensitivity more than cardio alone.", "Limit sugary drinks, bakery, fried snacks; manage portions, not just foods.", "Correct vitamin D, B12 and iron — deficiencies worsen fatigue and hair fall."],
    herbsUsed: [
      { name: "Shatavari", slug: "shatavari", note: "Traditional women's-health herb; PCOS evidence is limited." },
      { name: "Cinnamon", slug: "cinnamon", note: "Small trials on insulin; modest, variable effects." },
      { name: "Fenugreek", slug: "fenugreek", note: "Fibre may help sugar; limited PCOS-specific data." },
    ],
    relatedDiseases: ["insulin-resistance", "type-2-diabetes", "obesity", "acne", "hair-loss", "infertility"].filter(Boolean),
    relatedMedicines: ["metformin"],
    relatedLabs: ["tsh", "fasting-glucose", "lipid-profile"],
    relatedHerbs: ["shatavari", "cinnamon", "fenugreek"],
    references: [{ title: "International Evidence-Based PCOS Guideline", source: "ESHRE / ASRM", year: "2023" }],
  },
  acidity: {
    definition: "Acidity — burning in the chest or upper stomach — usually reflects acid reflux or gastritis. Late dinners, spicy/oily food, excess chai/coffee, smoking, alcohol, stress and painkillers are classic Indian triggers. Most episodes settle with meal timing, trigger control and short medicines, but black stools, vomiting blood, weight loss or trouble swallowing need urgent evaluation.",
    nutrition: ["Eat dinner 3 hours before sleep; keep lunch the heaviest meal.", "Limit chilli, pickles, fried snacks, excess tea/coffee, chocolate, mint and carbonated drinks.", "Smaller frequent meals; avoid lying down right after eating.", "Raise head-end of bed 6–8 inches for night reflux."],
    modernTreatment: ["Antacids give quick relief; PPIs (omeprazole/pantoprazole) heal inflammation in courses.", "Test for H. pylori if ulcers or recurrent pain.", "Review NSAIDs, iron and supplements that irritate the stomach."],
    relatedDiseases: ["gerd", "gastritis", "peptic-ulcer", "ibs"],
    relatedMedicines: ["omeprazole", "pantoprazole"],
    relatedLabs: ["cbc"],
    relatedHerbs: ["licorice", "amla", "ginger"],
    herbsUsed: [
      { name: "Mulethi (Licorice)", slug: "licorice", note: "Deglycyrrhizinated forms traditionally soothe; crude long use raises BP." },
      { name: "Amla", slug: "amla", note: "Food-level use supports; limited ulcer-healing evidence." },
      { name: "Ginger", slug: "ginger", note: "May ease nausea; large doses can worsen heartburn in some." },
    ],
  },
  "fatty-liver": {
    definition: "Fatty liver (now called MASLD) means ≥5% liver fat, most often from belly fat, diabetes, high triglycerides and alcohol. It is usually silent until advanced — fatigue or right-side heaviness are vague clues. Ultrasound and liver enzymes detect it; fibrosis scores (FIB-4) stage risk. Weight loss of 7–10% can dramatically reduce liver fat — no proven 'liver-cleanse' shortcut exists.",
    nutrition: ["Mediterranean-Indian plate: vegetables, millets, pulses, nuts, curd, fish; minimal sweets and fried foods.", "Zero alcohol is safest with fatty liver; even 'moderate' drinking worsens it.", "Cut fructose: cold drinks, packaged juices, sweets, bakery.", "Coffee (2–3 cups/day, less sugar) is linked to better liver outcomes in observational studies."],
    modernTreatment: ["Weight, sugar, cholesterol and alcohol control are the treatment.", "Statins are safe in most fatty-liver patients and protect the heart.", "Vitamin E/pioglitazone only in selected biopsy-proven cases under specialists."],
    relatedDiseases: ["type-2-diabetes", "obesity", "high-triglycerides", "high-cholesterol"],
    relatedLabs: ["liver-enzymes", "lipid-profile", "hba1c"],
    relatedHerbs: ["turmeric", "amla", "fenugreek"],
    herbsUsed: [
      { name: "Turmeric", slug: "turmeric", note: "Small trials show modest liver-enzyme changes; not a standalone cure." },
      { name: "Amla", slug: "amla", note: "Antioxidant food; limited liver-specific evidence." },
    ],
  },
  asthma: {
    definition: "Asthma is chronic airway inflammation causing wheeze, cough (worse at night), chest tightness and breathlessness. In India, dust, traffic pollution, biomass smoke, viral colds and monsoon mould are major triggers. Inhaled controller medicines (not just reliever pumps) prevent attacks — inhalers are safe, non-addictive and the cornerstone of care.",
    modernTreatment: ["Daily inhaled corticosteroid (± LABA) prevents attacks; reliever (salbutamol) is for rescue.", "Technique matters more than brand — ask for a demo with spacer.", "Action plan: when to step up, when to seek emergency.", "Treat allergic rhinitis and GERD alongside — they worsen control."],
    emergencySigns: ["Cannot speak full sentences, lips blue, reliever not working — emergency", "Peak flow <50% of best — seek urgent care"],
    relatedDiseases: ["allergic-rhinitis", "sinusitis", "copd", "respiratory-allergies"],
    relatedHerbs: ["tulsi", "ginger", "turmeric"],
    herbsUsed: [
      { name: "Tulsi", slug: "tulsi", note: "Traditional respiratory herb; comforting as tea, not an attack treatment." },
      { name: "Ginger", slug: "ginger", note: "May soothe throat; no proven attack prevention." },
    ],
  },
  arthritis: {
    definition: "Arthritis means joint inflammation — pain, stiffness (especially morning), swelling and reduced motion. Osteoarthritis (wear) hits knees with age and weight; rheumatoid arthritis is autoimmune with symmetric small-joint swelling. Movement, weight and strength protect joints far more than rest alone; early treatment of inflammatory types prevents deformity.",
    modernTreatment: ["Exercise + weight control are first-line for osteoarthritis.", "Paracetamol/NSAIDs for flares with stomach/kidney caution.", "Rheumatoid needs DMARDs early under rheumatology — delay harms joints."],
    relatedDiseases: ["osteoarthritis", "rheumatoid-arthritis", "knee-pain", "gout", "osteoporosis"],
    relatedLabs: ["vitamin-d", "cbc", "uric-acid"],
    relatedHerbs: ["turmeric", "ginger", "ashwagandha"],
    herbsUsed: [
      { name: "Turmeric", slug: "turmeric", note: "Curcumin shows modest pain benefit in some trials; product quality varies." },
      { name: "Ginger", slug: "ginger", note: "Mild anti-inflammatory signals; supportive, not disease-modifying." },
    ],
  },
  migraine: {
    definition: "Migraine is a recurrent brain-sensitivity disorder — throbbing headache (often one-sided) with nausea, light/sound sensitivity, sometimes aura. Skipped meals, sleep loss, dehydration, stress, strong smells and hormonal shifts are classic Indian triggers. A headache diary plus trigger control prevents more attacks than painkillers alone.",
    modernTreatment: ["Acute: NSAIDs/triptans early in attack; avoid frequent self-medication (rebound).", "Preventive: beta-blockers, topiramate or newer CGRP options for frequent attacks.", "Screen for anemia, thyroid and eye strain as contributors."],
    emergencySigns: ["Thunderclap (worst-ever sudden headache), fever with neck stiffness, weakness or vision loss — emergency"],
    relatedDiseases: ["headache", "stress", "sleep-problems", "anxiety"],
    relatedHerbs: ["brahmi", "ginger"],
    herbsUsed: [
      { name: "Brahmi", slug: "brahmi", note: "Traditional mind herb; migraine evidence is limited." },
      { name: "Ginger", slug: "ginger", note: "May ease nausea alongside proven medicines." },
    ],
  },
  anemia: {
    definition: "Anemia means low hemoglobin — blood carries less oxygen, causing fatigue, pallor, breathlessness and hair fall. In India, iron deficiency from low intake, heavy periods, pregnancy and worms dominates; B12 deficiency is next in vegetarians. Treatment follows the cause — iron tablets help iron-deficiency anemia but not thalassemia or B12 deficiency.",
    nutrition: ["Pair iron foods (ragi, bajra, moong, groundnuts, jaggery, meat) with vitamin C (amla, lemon, guava).", "Take iron tablets away from chai/coffee and calcium; vitamin C improves absorption.", "Deworm as advised; treat heavy periods — the commonest leak in women."],
    modernTreatment: ["Iron (oral) for 3 months beyond normalisation to refill stores.", "B12/folate where deficient; IV iron for intolerance or severe deficiency.", "Transfusion only for severe/symptomatic cases under supervision."],
    relatedDiseases: ["iron-deficiency", "vitamin-b12-deficiency", "pregnancy-nutrition", "menstrual-health"],
    relatedLabs: ["cbc", "ferritin", "vitamin-b12"],
    relatedMedicines: ["iron-folic-acid"],
    relatedHerbs: ["moringa", "amla"],
    herbsUsed: [
      { name: "Moringa", slug: "moringa", note: "Iron-containing leafy food; supportive, not a substitute for iron therapy." },
      { name: "Amla", slug: "amla", note: "Vitamin C food that aids iron absorption." },
    ],
  },
  obesity: {
    definition: "Obesity — excess body fat, especially visceral — is India's fastest-growing root cause of diabetes, hypertension, PCOS, fatty liver, sleep apnea and knee arthritis. Indian BMI cutoffs are stricter (overweight ≥23, obese ≥25). Sustainable loss of 0.5 kg/week via diet, activity, sleep and behaviour beats crash diets every time.",
    nutrition: ["500–750 kcal/day deficit; protein 1.2–1.6 g/kg to protect muscle.", "Millets, pulses, vegetables, salads first; halve rice/roti portions; no liquid calories.", "Dinner early and light; 12-hour overnight fast suits many (not for pregnancy/diabetes on insulin without guidance)."],
    modernTreatment: ["Lifestyle program + behaviour support is first-line.", "Medicines (orlistat, GLP-1 RAs) for selected BMI/comorbidity under specialists.", "Bariatric surgery for severe obesity with complications after evaluation."],
    relatedDiseases: ["type-2-diabetes", "high-blood-pressure", "sleep-apnea", "pcos", "fatty-liver", "knee-pain"],
    relatedLabs: ["fasting-glucose", "lipid-profile", "tsh"],
    relatedHerbs: ["green-tea-note", "garcinia-note", "triphala"],
    herbsUsed: [
      { name: "Triphala", slug: "triphala", note: "Traditional digestive support; weight-loss evidence is limited." },
      { name: "Green tea (food)", slug: "green-tea", note: "Modest metabolism signals; sugary versions defeat the purpose." },
    ],
  },
  "high-cholesterol": {
    definition: "High cholesterol — especially LDL ('bad') — silently builds artery plaque. Indian risk is high at lower LDL due to small-dense particles, diabetes and Lp(a). Diet helps (~10–15% LDL drop), but moderate-high risk patients also need statins. Total cholesterol alone misleads; always interpret LDL, HDL, triglycerides and ratios together.",
    nutrition: ["Oats, barley, psyllium, methi, soya, nuts (30 g/day) lower LDL modestly.", "Replace palm/coconut excess and vanaspati with mustard/groundnut/olive; avoid trans fats.", "Fibre 30 g+, plant sterols via vegetables; limit sweets, fried snacks, processed meats."],
    modernTreatment: ["Statins are first-line for elevated risk; benefits far outweigh risks for indicated patients.", "Ezetimibe/PCSK9 for very high risk or statin intolerance under cardiology.", "Recheck lipids 4–12 weeks after changes; track liver and muscle symptoms."],
    relatedDiseases: ["atherosclerosis", "coronary-artery-disease", "type-2-diabetes", "fatty-liver"],
    relatedMedicines: ["atorvastatin"],
    relatedLabs: ["lipid-profile"],
    relatedHerbs: ["garlic", "arjuna", "fenugreek"],
    herbsUsed: [
      { name: "Garlic", slug: "garlic", note: "Small LDL reductions in some trials; variable products." },
      { name: "Arjuna", slug: "arjuna", note: "Traditional heart herb; cholesterol evidence is limited." },
    ],
  },
};

export function getDiseaseDetail(slug: string): DiseaseDetail | undefined {
  const s = DISEASE_MAP.get(slug);
  if (!s) return undefined;
  const base = genericDetail(s);
  const over = PILLARS[slug];
  if (!over) {
    base.relatedDiseases = pickRelated(s.slug);
    base.relatedMedicines = defaultMeds(s.system);
    base.relatedLabs = defaultLabs(s.system);
    return base;
  }
  return {
    ...base,
    ...over,
    slug: s.slug,
    name: over.name || s.name,
    short: over.short || s.short,
    relatedDiseases: over.relatedDiseases?.length ? over.relatedDiseases : pickRelated(s.slug),
    relatedMedicines: over.relatedMedicines || defaultMeds(s.system),
    relatedLabs: over.relatedLabs || defaultLabs(s.system),
    updatedAt: over.updatedAt || base.updatedAt,
    imagePrompt: over.imagePrompt || base.imagePrompt,
  } as DiseaseDetail;
}

function pickRelated(slug: string): string[] {
  const all = ["type-2-diabetes", "high-blood-pressure", "hypothyroidism", "pcos", "acidity", "fatty-liver", "anemia", "obesity", "high-cholesterol", "migraine", "asthma", "arthritis"];
  return all.filter((s) => s !== slug).slice(0, 6);
}

function defaultMeds(system: string): string[] {
  if (system.includes("Heart")) return ["amlodipine", "atorvastatin", "losartan"];
  if (system.includes("Metabolic")) return ["metformin", "atorvastatin"];
  if (system.includes("Digestive")) return ["omeprazole", "pantoprazole"];
  if (system.includes("Hormonal")) return ["levothyroxine", "metformin"];
  if (system.includes("Bone") || system.includes("Bones")) return ["paracetamol", "vitamin-d3"];
  return ["paracetamol", "omeprazole"];
}

function defaultLabs(system: string): string[] {
  if (system.includes("Metabolic") || system.includes("Heart")) return ["fasting-glucose", "lipid-profile", "hba1c"];
  if (system.includes("Hormonal")) return ["tsh", "vitamin-b12"];
  if (system.includes("Kidney")) return ["creatinine", "urine-routine"];
  if (system.includes("Bone") || system.includes("Bones")) return ["vitamin-d", "cbc"];
  return ["cbc", "fasting-glucose"];
}

export const PILLAR_SLUGS = Object.keys(PILLARS);

