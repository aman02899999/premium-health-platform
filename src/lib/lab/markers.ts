// The marker library: every test the analyser understands, with the names labs print for it,
// unit conversions, and plain-language education. Admins can override any of it from
// /admin/blood-report (see overrides.ts); this file is the default.
//
// Ranges and guideline bands are filled in only from an official page that was actually read,
// with that page in `sources`. A marker without a cited range still works: the member's own
// report range is used, and with neither the status is "unknown".
//
// Education only (YMYL rule): no diagnosis, no medicine names or doses, Ayurveda as support.
import { CITED, type Cited } from "./cited";
import type { Advice, Marker, PanelId } from "./types";

export const PANELS: { id: PanelId; name: string; hint: string }[] = [
  { id: "cbc", name: "Complete blood count (CBC)", hint: "Haemoglobin, white cells, platelets" },
  { id: "diabetes", name: "Blood sugar", hint: "Fasting, after-meal, HbA1c" },
  { id: "lipid", name: "Lipid profile", hint: "Cholesterol and triglycerides" },
  { id: "liver", name: "Liver function (LFT)", hint: "SGOT, SGPT, bilirubin, proteins" },
  { id: "kidney", name: "Kidney function (KFT/RFT)", hint: "Creatinine, urea, uric acid" },
  { id: "electrolytes", name: "Electrolytes and minerals", hint: "Sodium, potassium, calcium" },
  { id: "thyroid", name: "Thyroid", hint: "TSH, T3, T4" },
  { id: "iron", name: "Iron studies", hint: "Iron, TIBC, ferritin" },
  { id: "vitamins", name: "Vitamins", hint: "B12, vitamin D" },
  { id: "inflammation", name: "Inflammation", hint: "CRP, ESR" },
];

const DOCTOR_SOON = "Show this report to your doctor at your next visit, and sooner if you feel unwell.";
const DOCTOR_PROMPT = "Please see a doctor in the next few days so they can look at this with the rest of your report and your symptoms.";

// Shared advice, so the same pattern reads the same everywhere.
const ANAEMIA_LOW: Advice = {
  meaning: "A low value here is one of the signs of anaemia, which means your blood carries less oxygen than it should. In India the commonest causes are low iron, low B12 or folate, heavy periods, and inherited traits like thalassaemia minor. The cause matters more than the number.",
  lifestyle: [
    "Eat iron-rich foods daily: dals, rajma, chana, green leafy vegetables, eggs, fish or meat if you eat them.",
    "Have vitamin C with meals (lemon, amla, guava, oranges) to absorb more iron.",
    "Keep tea and coffee at least an hour away from meals; they block iron absorption.",
  ],
  ayurveda: [
    "Traditional kitchens use jaggery with roasted chana, dates, and moringa (drumstick) leaves as iron-rich foods. They support a good diet but cannot correct real anaemia on their own.",
  ],
  doctor: "Don't start iron tablets on your own. Low iron, low B12 and thalassaemia trait look similar on a CBC but need different care, so please see a doctor who can order the right follow-up tests (ferritin, B12, sometimes Hb electrophoresis).",
};

const HIGH_RBC: Advice = {
  meaning: "A high value can come from dehydration on the day of the test, smoking, living at altitude, or less often a condition where the body makes too many red cells.",
  lifestyle: ["Drink enough water and repeat the test if you were dehydrated.", "If you smoke, this is one more reason to stop."],
  doctor: DOCTOR_PROMPT,
};

const INDEX_LOW: Advice = {
  meaning: "Small or pale red cells usually point to low iron or an inherited trait like thalassaemia minor. Read it with your haemoglobin and ferritin.",
  lifestyle: ANAEMIA_LOW.lifestyle,
  doctor: "Ask your doctor whether you need ferritin or Hb electrophoresis before any supplement is started.",
};

const INDEX_HIGH: Advice = {
  meaning: "Large red cells are often linked to low vitamin B12 or folate, which is common in vegetarians. Alcohol, thyroid problems and some medicines can also do this.",
  lifestyle: ["Include milk, curd, paneer and eggs (if you eat them) for B12.", "Eat green leafy vegetables and dals for folate.", "Cut down alcohol."],
  doctor: "Ask your doctor about checking vitamin B12 and folate.",
};

const WBC_LOW: Advice = {
  meaning: "Fewer white cells can follow a recent viral fever (including dengue), some medicines, or low B12. It can lower your guard against infections.",
  lifestyle: ["Wash hands often and avoid crowded places while it is low.", "Eat freshly cooked food and avoid street food for now."],
  doctor: "Please see a doctor soon, and straight away if you have a fever, as infections can get serious faster when this is low.",
};

const WBC_HIGH: Advice = {
  meaning: "More white cells usually means your body is fighting an infection or inflammation. Stress, smoking and some medicines can also raise it. Rarely it is a sign of a blood disorder.",
  lifestyle: ["Rest and stay well hydrated if you're unwell.", "Repeat the test after you recover if your doctor suggests it."],
  doctor: DOCTOR_PROMPT,
};

const DIFF_SHIFT: Advice = {
  meaning: "The mix of white cell types shifts with infections, allergies, viral fevers and worms. On its own a small shift rarely means much; your doctor reads it with your total WBC and symptoms.",
  lifestyle: ["Note any fever, cough, allergy or stomach symptoms to tell your doctor."],
  doctor: DOCTOR_SOON,
};

const SUGAR_HIGH: Advice = {
  meaning: "Your blood sugar is higher than the healthy range. This can mean prediabetes or diabetes, but one reading isn't a diagnosis: doctors confirm it with a repeat test or HbA1c.",
  lifestyle: [
    "Walk 10–15 minutes after each main meal.",
    "Fill half the plate with vegetables, a quarter with dal, paneer, eggs or chicken, and a quarter with roti or rice.",
    "Cut sugary drinks, sweets and maida snacks; prefer whole grains and millets.",
    "Aim for 7 hours of sleep and at least 150 minutes of activity a week.",
  ],
  ayurveda: [
    "Methi (fenugreek) seeds, jamun and bitter gourd are traditional foods for blood sugar. They can support diet changes but never replace medicines your doctor prescribes, and they can add to the effect of diabetes tablets.",
  ],
  doctor: "Please see a doctor to confirm what this means for you. If you already take diabetes medicine, don't change it yourself.",
};

const SUGAR_LOW: Advice = {
  meaning: "Low blood sugar can cause shaking, sweating, confusion or fainting. In people on diabetes medicine it's often from a skipped meal or too strong a dose.",
  lifestyle: ["Don't skip meals, especially before exercise.", "If you feel shaky and sweaty, take something sweet like glucose, juice or sugar and then a proper snack."],
  doctor: "Tell your doctor about this reading, especially if you take diabetes medicine. If someone is confused or fainting, get emergency help.",
};

const LIPID_HIGH: Advice = {
  meaning: "This raises the chance of fat building up in your arteries over the years. Your doctor judges the whole picture: age, BP, sugar, smoking and family history.",
  lifestyle: [
    "Cut deep-fried food, vanaspati, bakery items and processed meats.",
    "Add oats, dals, nuts, flaxseed and fruit for fibre.",
    "Move daily: brisk walks, cycling or gym sessions.",
    "Lose a little belly fat if you have some; even 5% of your weight helps.",
  ],
  ayurveda: ["Garlic and arjuna bark are traditional heart-support herbs. Evidence is limited, and they can interact with blood thinners, so check with your doctor first."],
  doctor: "Ask your doctor about your overall heart risk and your target numbers. Don't start or stop cholesterol medicine on your own.",
};

const LIVER_HIGH: Advice = {
  meaning: "A raised liver enzyme means liver cells are under some stress. In India the commonest reason is fatty liver from belly fat, sugar and alcohol. Viral hepatitis, some medicines and heavy exercise just before the test can also raise it.",
  lifestyle: [
    "Stop alcohol until your doctor reviews this.",
    "Cut sugar, sweet drinks and fried food; lose weight slowly if you need to.",
    "Avoid heavy weight training for 2 days before a repeat test.",
  ],
  ayurveda: ["Bhumi amla and kutki are used traditionally for the liver, but some herbal products have themselves harmed livers. Don't take any herbal mix for the liver without your doctor's OK."],
  doctor: DOCTOR_PROMPT,
};

const BILI_HIGH: Advice = {
  meaning: "Raised bilirubin can make the eyes or skin look yellow (jaundice). A mild rise with normal liver enzymes is often Gilbert's syndrome, which is harmless. Higher levels can mean liver, gallbladder or blood problems.",
  lifestyle: ["Avoid alcohol and drink enough water."],
  doctor: "Please see a doctor soon, and straight away if your eyes or skin turn yellow, your urine is dark, or you have belly pain or fever.",
};

const PROTEIN_LOW: Advice = {
  meaning: "Low protein in the blood can come from a low-protein diet, liver or kidney problems, or long illness.",
  lifestyle: ["Have a protein food at every meal: dal, paneer, curd, eggs, soy, chicken or fish."],
  doctor: DOCTOR_PROMPT,
};

const KIDNEY_HIGH: Advice = {
  meaning: "A raised value can mean the kidneys are filtering less well. It can also rise for a day with dehydration, heavy exercise, a high-protein meal or creatine supplements.",
  lifestyle: [
    "Drink enough water unless a doctor has limited your fluids.",
    "Stop creatine and avoid heavy workouts for 2–3 days before a repeat test.",
    "Avoid painkillers like ibuprofen or diclofenac unless a doctor prescribes them.",
    "Keep BP and sugar under control; they are the biggest kidney risks.",
  ],
  doctor: "Please see a doctor. Kidney numbers are judged on trends and with a urine test, so one value needs a follow-up.",
};

const URIC_HIGH: Advice = {
  meaning: "High uric acid can cause gout (sudden painful joints, often the big toe) and kidney stones. Belly fat, alcohol, sweet drinks and some medicines raise it.",
  lifestyle: [
    "Drink plenty of water.",
    "Cut beer and spirits, and sweet drinks with fructose.",
    "Limit organ meat, red meat and some seafood; dals are fine in normal amounts.",
    "Lose weight slowly; crash diets can trigger gout.",
  ],
  ayurveda: ["Giloy and triphala are used traditionally for joint health. They can support but don't replace treatment, and giloy isn't safe for everyone."],
  doctor: "See a doctor if you get joint pain or swelling, or if the value stays high on a repeat test.",
};

const ELECTROLYTE: (what: string) => { low: Advice; high: Advice } = (what) => ({
  low: {
    meaning: `Low ${what} can come from vomiting, loose motions, too much water, some BP or water tablets, or hormone problems. Large drops can affect the heart and brain.`,
    lifestyle: ["If you've had vomiting or loose motions, use ORS rather than plain water."],
    doctor: "Please see a doctor soon. Get emergency help if there is confusion, fainting, a fast or irregular heartbeat, or severe weakness.",
  },
  high: {
    meaning: `High ${what} can come from dehydration, kidney problems, some medicines, or a sample that was handled late in the lab.`,
    lifestyle: ["Drink enough water unless a doctor has limited your fluids.", "Don't take salt substitutes or mineral supplements until your doctor reviews this."],
    doctor: "Please see a doctor soon. Get emergency help if there is chest discomfort, a fast or irregular heartbeat, or severe weakness.",
  },
});

const THYROID_UNDER: Advice = {
  meaning: "This pattern can mean an underactive thyroid (hypothyroidism), which is common in Indian women. It can cause tiredness, weight gain, hair fall, constipation and irregular periods.",
  lifestyle: [
    "Test in the morning, before your thyroid tablet if you take one.",
    "Stop biotin supplements 2–3 days before testing; they upset thyroid results.",
    "Use iodised salt.",
  ],
  ayurveda: ["Ashwagandha is sometimes used traditionally, but it can change thyroid levels and isn't suitable for everyone. Ask your doctor first."],
  doctor: "Please see a doctor. Thyroid treatment and its dose are decided by a doctor from TSH and T4 together.",
};

const THYROID_OVER: Advice = {
  meaning: "This pattern can mean an overactive thyroid, or too high a dose of thyroid tablets. It can cause weight loss, a fast heartbeat, sweating and anxiety.",
  lifestyle: ["Stop biotin supplements 2–3 days before testing.", "Limit caffeine if you feel your heart racing."],
  doctor: "Please see a doctor. If you take thyroid tablets, don't change the dose yourself.",
};

const IRON_LOW: Advice = {
  meaning: "Low iron stores are the commonest nutrient gap in India, especially in women. They cause tiredness, breathlessness on stairs and hair fall, even before haemoglobin drops.",
  lifestyle: ANAEMIA_LOW.lifestyle,
  ayurveda: ANAEMIA_LOW.ayurveda,
  doctor: "Please see a doctor. They'll decide whether you need iron, which form, and for how long, and look for the reason your iron is low.",
};

const IRON_HIGH: Advice = {
  meaning: "High iron or ferritin can come from infection or inflammation, liver problems, alcohol, iron tablets taken too long, or an inherited iron overload.",
  lifestyle: ["Stop iron supplements unless a doctor prescribed them.", "Avoid alcohol."],
  doctor: DOCTOR_PROMPT,
};

const VIT_LOW: (what: string) => Advice = (what) => ({
  meaning: `Low ${what} is very common in India. It's linked to tiredness, low mood, aches, and in the long run weaker bones or nerves.`,
  lifestyle:
    what === "vitamin D"
      ? ["Get 15–20 minutes of midday sun on your arms and legs a few times a week.", "Include milk, curd, eggs and fish if you eat them."]
      : ["Include milk, curd, paneer and eggs (if you eat them) every day.", "Vegetarians and people on long-term acidity or diabetes medicines are more likely to be low."],
  doctor: `Please see a doctor. They'll decide whether you need ${what} supplements and how much. Very high doses taken without advice can cause harm.`,
});

const VIT_HIGH: (what: string) => Advice = (what) => ({
  meaning: `A high ${what} level is usually from supplements or injections. ${what === "vitamin D" ? "Very high vitamin D can raise calcium and harm the kidneys." : "On its own it is rarely harmful, but unexplained high B12 is sometimes checked further."}`,
  lifestyle: ["Pause supplements until your doctor reviews this."],
  doctor: DOCTOR_PROMPT,
});

const INFLAM_HIGH: Advice = {
  meaning: "This shows inflammation somewhere in the body: an infection, an injury, joint disease or long-term conditions like belly fat. It doesn't say where.",
  lifestyle: ["Repeat the test after you've recovered from any infection.", "Regular activity, good sleep and losing belly fat lower long-term inflammation."],
  ayurveda: ["Turmeric (haldi) in food is a traditional anti-inflammatory spice. It supports a healthy diet but doesn't treat the cause of inflammation."],
  doctor: DOCTOR_PROMPT,
};

type Def = Omit<Marker, "ranges" | "sources"> & Partial<Pick<Marker, "ranges" | "sources">>;
const m = (d: Def): Marker => {
  const c: Cited | undefined = CITED[d.id];
  return { ...d, ranges: c?.ranges ?? d.ranges ?? [], bands: c?.bands ?? d.bands, sources: c?.sources ?? d.sources ?? [] };
};

const CELLS = [
  { unit: "/ul", factor: 0.001 },
  { unit: "cells/ul", factor: 0.001 },
  { unit: "10^9/l", factor: 1 },
  { unit: "x10^9/l", factor: 1 },
  { unit: "10^3/ul", factor: 1 },
  { unit: "x10^3/ul", factor: 1 },
  { unit: "thou/ul", factor: 1 },
  { unit: "k/ul", factor: 1 },
];

export const MARKERS: Marker[] = [
  // ───────── CBC ─────────
  m({ id: "hemoglobin", name: "Haemoglobin", panel: "cbc", unit: "g/dL", aliases: ["Hemoglobin", "Hb", "HGB", "Hgb", "Haemoglobin (Hb)"], altUnits: [{ unit: "g/L", factor: 0.1 }, { unit: "gm/dl", factor: 1 }, { unit: "gm%", factor: 1 }, { unit: "g%", factor: 1 }], about: "The protein in red blood cells that carries oxygen from your lungs to the rest of your body.", low: ANAEMIA_LOW, high: HIGH_RBC, guide: "cbc" }),
  m({ id: "rbc", name: "Red blood cell count", panel: "cbc", unit: "million/uL", aliases: ["RBC", "RBC count", "Total RBC", "Red cell count", "Erythrocyte count", "Total RBC count"], altUnits: [{ unit: "10^6/ul", factor: 1 }, { unit: "x10^6/ul", factor: 1 }, { unit: "mill/cumm", factor: 1 }, { unit: "million/cumm", factor: 1 }, { unit: "10^12/l", factor: 1 }, { unit: "mil/ul", factor: 1 }], about: "How many red blood cells you have in a small amount of blood.", low: ANAEMIA_LOW, high: HIGH_RBC, guide: "cbc" }),
  m({ id: "hematocrit", name: "Haematocrit (PCV)", panel: "cbc", unit: "%", aliases: ["Hematocrit", "HCT", "PCV", "Packed cell volume", "Haematocrit"], about: "The share of your blood made up of red cells.", low: ANAEMIA_LOW, high: HIGH_RBC, guide: "cbc" }),
  m({ id: "mcv", name: "MCV", panel: "cbc", unit: "fL", aliases: ["Mean corpuscular volume", "Mean cell volume"], about: "The average size of your red blood cells.", low: INDEX_LOW, high: INDEX_HIGH, guide: "cbc" }),
  m({ id: "mch", name: "MCH", panel: "cbc", unit: "pg", aliases: ["Mean corpuscular hemoglobin", "Mean corpuscular haemoglobin", "Mean cell hemoglobin"], about: "The average amount of haemoglobin in each red cell.", low: INDEX_LOW, high: INDEX_HIGH, guide: "cbc" }),
  m({ id: "mchc", name: "MCHC", panel: "cbc", unit: "g/dL", aliases: ["Mean corpuscular hemoglobin concentration", "Mean corpuscular haemoglobin concentration"], altUnits: [{ unit: "g/L", factor: 0.1 }, { unit: "%", factor: 1 }], about: "How concentrated the haemoglobin is inside your red cells.", low: INDEX_LOW, high: { ...INDEX_HIGH, meaning: "A high MCHC is uncommon. It can come from a lab issue with the sample or, rarely, an inherited red cell condition." }, guide: "cbc" }),
  m({ id: "rdw", name: "RDW", panel: "cbc", unit: "%", aliases: ["RDW-CV", "Red cell distribution width", "Red cell distribution width CV"], about: "How much your red cells vary in size. A high value often shows up early in iron or B12 deficiency.", high: { ...INDEX_LOW, meaning: "Red cells of mixed sizes often show up early in iron, B12 or folate deficiency, before haemoglobin drops." }, guide: "cbc" }),
  m({ id: "wbc", name: "White blood cell count (TLC)", panel: "cbc", unit: "10^3/uL", aliases: ["WBC", "WBC count", "TLC", "Total leucocyte count", "Total leukocyte count", "Total WBC count", "Leucocytes", "Leukocytes", "White cell count"], altUnits: CELLS, about: "The cells that fight infection.", low: WBC_LOW, high: WBC_HIGH, guide: "cbc" }),
  m({ id: "neutrophils", name: "Neutrophils", panel: "cbc", unit: "%", aliases: ["Neutrophil", "Polymorphs", "Neutrophils %", "Segmented neutrophils", "Neut"], about: "The white cells that fight bacterial infections first.", low: DIFF_SHIFT, high: DIFF_SHIFT, guide: "cbc" }),
  m({ id: "lymphocytes", name: "Lymphocytes", panel: "cbc", unit: "%", aliases: ["Lymphocyte", "Lymphocytes %", "Lymph"], about: "The white cells that fight viruses and make antibodies.", low: DIFF_SHIFT, high: DIFF_SHIFT, guide: "cbc" }),
  m({ id: "monocytes", name: "Monocytes", panel: "cbc", unit: "%", aliases: ["Monocyte", "Monocytes %", "Mono"], about: "White cells that clean up germs and damaged cells.", high: DIFF_SHIFT, guide: "cbc" }),
  m({ id: "eosinophils", name: "Eosinophils", panel: "cbc", unit: "%", aliases: ["Eosinophil", "Eosinophils %", "Eos"], about: "White cells involved in allergies and fighting worms.", high: { ...DIFF_SHIFT, meaning: "Raised eosinophils are common with allergies, asthma, skin conditions and stomach worms." }, guide: "cbc" }),
  m({ id: "basophils", name: "Basophils", panel: "cbc", unit: "%", aliases: ["Basophil", "Basophils %", "Baso"], about: "A small group of white cells involved in allergic reactions.", high: DIFF_SHIFT, guide: "cbc" }),
  m({ id: "platelets", name: "Platelet count", panel: "cbc", unit: "10^3/uL", aliases: ["Platelets", "PLT", "Platelet", "Thrombocytes", "Thrombocyte count"], altUnits: [...CELLS, { unit: "lakh/ul", factor: 100 }, { unit: "lakhs/ul", factor: 100 }, { unit: "lakh/cumm", factor: 100 }, { unit: "lakhs/cumm", factor: 100 }], about: "Small cells that help your blood clot.", low: { meaning: "Low platelets are common during dengue and other viral fevers. Some medicines, alcohol and a large spleen can also lower them. Very low counts raise the risk of bleeding.", lifestyle: ["During a fever, drink plenty of fluids: ORS, coconut water, soups.", "Avoid painkillers like ibuprofen, aspirin or diclofenac unless a doctor prescribes them."], ayurveda: ["Papaya leaf extract is popular during dengue. Studies are small, and it's not a substitute for medical monitoring."], doctor: "Please see a doctor soon. Get emergency help for any bleeding from the gums or nose, black stools, blood in vomit or urine, or a severe headache." }, high: { meaning: "High platelets often follow an infection, inflammation, iron deficiency or recent surgery. Rarely it's a bone marrow condition.", lifestyle: ["Repeat the test after you recover from any illness, if your doctor suggests it."], doctor: DOCTOR_PROMPT }, guide: "cbc" }),
  m({ id: "mpv", name: "MPV", panel: "cbc", unit: "fL", aliases: ["Mean platelet volume"], about: "The average size of your platelets. It's mostly read together with the platelet count.", guide: "cbc" }),
  m({ id: "esr", name: "ESR", panel: "inflammation", unit: "mm/hr", aliases: ["Erythrocyte sedimentation rate", "Sed rate", "ESR (Westergren)", "Westergren ESR", "E.S.R."], altUnits: [{ unit: "mm/1st hr", factor: 1 }, { unit: "mm/h", factor: 1 }, { unit: "mm in 1st hour", factor: 1 }], about: "How fast red cells settle in a tube. It goes up with inflammation, infection, anaemia, pregnancy and age.", high: INFLAM_HIGH }),

  // ───────── Blood sugar ─────────
  m({ id: "glucose-fasting", name: "Fasting blood glucose", panel: "diabetes", unit: "mg/dL", aliases: ["FBS", "FBG", "Fasting blood sugar", "Fasting glucose", "Glucose fasting", "Plasma glucose fasting", "Blood sugar fasting", "Glucose (F)", "FPG", "Fasting plasma glucose"], altUnits: [{ unit: "mmol/L", factor: 18.016 }], about: "Your blood sugar after not eating for 8–10 hours.", low: SUGAR_LOW, high: SUGAR_HIGH, guide: "fasting-glucose" }),
  m({ id: "glucose-pp", name: "Post-meal blood glucose (PP)", panel: "diabetes", unit: "mg/dL", aliases: ["PPBS", "PPBG", "Post prandial blood sugar", "Postprandial glucose", "Glucose PP", "Blood sugar PP", "2 hour post meal glucose", "Glucose post prandial", "PP sugar"], altUnits: [{ unit: "mmol/L", factor: 18.016 }], about: "Your blood sugar 2 hours after a meal.", low: SUGAR_LOW, high: SUGAR_HIGH, guide: "fasting-glucose" }),
  m({ id: "glucose-random", name: "Random blood glucose", panel: "diabetes", unit: "mg/dL", aliases: ["RBS", "Random blood sugar", "Glucose random", "Blood sugar random"], altUnits: [{ unit: "mmol/L", factor: 18.016 }], about: "Your blood sugar at any time of day, whatever you last ate.", low: SUGAR_LOW, high: SUGAR_HIGH, guide: "fasting-glucose" }),
  m({ id: "hba1c", name: "HbA1c", panel: "diabetes", unit: "%", aliases: ["Glycated haemoglobin", "Glycated hemoglobin", "Glycosylated hemoglobin", "Glycosylated haemoglobin", "A1c", "HbA1C", "Hemoglobin A1c", "Hb A1c", "Haemoglobin A1c", "Hb A1c IFCC", "Glycosylated"], about: "Your average blood sugar over the last 2–3 months.", high: SUGAR_HIGH, guide: "hba1c" }),

  // ───────── Lipid profile ─────────
  m({ id: "cholesterol-total", name: "Total cholesterol", panel: "lipid", unit: "mg/dL", aliases: ["Cholesterol", "Cholesterol total", "Serum cholesterol", "TC", "Total cholesterol (TC)"], altUnits: [{ unit: "mmol/L", factor: 38.67 }], about: "All the cholesterol in your blood: the helpful and the harmful kinds together.", high: LIPID_HIGH, guide: "lipid-profile" }),
  m({ id: "ldl", name: "LDL cholesterol", panel: "lipid", unit: "mg/dL", aliases: ["LDL", "LDL-C", "LDL cholesterol direct", "Low density lipoprotein", "Bad cholesterol", "LDL cholesterol calculated", "Direct LDL"], altUnits: [{ unit: "mmol/L", factor: 38.67 }], about: "The 'bad' cholesterol that builds up in artery walls.", high: LIPID_HIGH, guide: "lipid-profile" }),
  m({ id: "hdl", name: "HDL cholesterol", panel: "lipid", unit: "mg/dL", aliases: ["HDL", "HDL-C", "HDL cholesterol direct", "High density lipoprotein", "Good cholesterol"], altUnits: [{ unit: "mmol/L", factor: 38.67 }], about: "The 'good' cholesterol that carries extra cholesterol away from arteries. Higher is better.", low: { meaning: "Low HDL is very common in Indians and adds to heart risk. Inactivity, belly fat, smoking and refined carbs lower it.", lifestyle: ["Exercise most days; it's the best way to raise HDL.", "Stop smoking.", "Swap maida and sugar for whole grains, nuts and seeds."], doctor: "Ask your doctor to look at this with your other heart-risk numbers." }, guide: "lipid-profile" }),
  m({ id: "triglycerides", name: "Triglycerides", panel: "lipid", unit: "mg/dL", aliases: ["TG", "Triglyceride", "Serum triglycerides", "TGL"], altUnits: [{ unit: "mmol/L", factor: 88.57 }], about: "A blood fat that rises with sugar, refined carbs and alcohol.", high: { ...LIPID_HIGH, meaning: "High triglycerides usually come from sugar, refined carbs, alcohol and belly fat, and often travel with fatty liver and prediabetes. They should be tested after a 10–12 hour fast." }, guide: "lipid-profile" }),
  m({ id: "vldl", name: "VLDL cholesterol", panel: "lipid", unit: "mg/dL", aliases: ["VLDL", "Very low density lipoprotein", "VLDL-C", "VLDL cholesterol calculated"], altUnits: [{ unit: "mmol/L", factor: 38.67 }], about: "A cholesterol carrier that mostly tracks your triglycerides.", high: LIPID_HIGH, guide: "lipid-profile" }),
  m({ id: "non-hdl", name: "Non-HDL cholesterol", panel: "lipid", unit: "mg/dL", aliases: ["Non HDL", "Non-HDL-C", "Non HDL cholesterol"], altUnits: [{ unit: "mmol/L", factor: 38.67 }], about: "Total cholesterol minus HDL: all the cholesterol that can clog arteries.", high: LIPID_HIGH, guide: "lipid-profile" }),
  m({ id: "chol-hdl-ratio", name: "Total cholesterol / HDL ratio", panel: "lipid", unit: "ratio", aliases: ["TC/HDL ratio", "Cholesterol/HDL ratio", "CHOL/HDL ratio", "Total cholesterol HDL ratio"], about: "A quick heart-risk ratio. Lower is better.", high: LIPID_HIGH, guide: "lipid-profile" }),

  // ───────── Liver ─────────
  m({ id: "bilirubin-total", name: "Total bilirubin", panel: "liver", unit: "mg/dL", aliases: ["Bilirubin", "Bilirubin total", "T. bilirubin", "TBIL", "Serum bilirubin total"], altUnits: [{ unit: "umol/L", factor: 1 / 17.1 }], about: "A yellow pigment made when old red cells break down. The liver clears it.", high: BILI_HIGH, guide: "liver-enzymes" }),
  m({ id: "bilirubin-direct", name: "Direct bilirubin", panel: "liver", unit: "mg/dL", aliases: ["Bilirubin direct", "Conjugated bilirubin", "D. bilirubin", "DBIL"], altUnits: [{ unit: "umol/L", factor: 1 / 17.1 }], about: "The bilirubin the liver has already processed. A rise points to the liver or bile ducts.", high: BILI_HIGH, guide: "liver-enzymes" }),
  m({ id: "bilirubin-indirect", name: "Indirect bilirubin", panel: "liver", unit: "mg/dL", aliases: ["Bilirubin indirect", "Unconjugated bilirubin", "I. bilirubin", "IBIL"], altUnits: [{ unit: "umol/L", factor: 1 / 17.1 }], about: "Bilirubin not yet processed by the liver. A mild rise alone is often Gilbert's syndrome.", high: BILI_HIGH, guide: "liver-enzymes" }),
  m({ id: "alt", name: "ALT (SGPT)", panel: "liver", unit: "U/L", aliases: ["SGPT", "ALT", "Alanine aminotransferase", "Alanine transaminase", "SGPT/ALT", "ALT/SGPT"], altUnits: [{ unit: "IU/L", factor: 1 }], about: "A liver enzyme. It leaks into the blood when liver cells are stressed.", high: LIVER_HIGH, guide: "liver-enzymes" }),
  m({ id: "ast", name: "AST (SGOT)", panel: "liver", unit: "U/L", aliases: ["SGOT", "AST", "Aspartate aminotransferase", "Aspartate transaminase", "SGOT/AST", "AST/SGOT"], altUnits: [{ unit: "IU/L", factor: 1 }], about: "An enzyme found in the liver, heart and muscles. Heavy workouts can raise it for a day or two.", high: LIVER_HIGH, guide: "liver-enzymes" }),
  m({ id: "alp", name: "Alkaline phosphatase (ALP)", panel: "liver", unit: "U/L", aliases: ["ALP", "Alkaline phosphatase", "Alk phos", "SAP"], altUnits: [{ unit: "IU/L", factor: 1 }], about: "An enzyme from the liver, bile ducts and bones. It's naturally higher in growing teenagers and in pregnancy.", high: { ...LIVER_HIGH, meaning: "High ALP can come from the bile ducts, the liver, or bones (including growth in teenagers and low vitamin D). Your doctor reads it with GGT and bilirubin." }, guide: "liver-enzymes" }),
  m({ id: "ggt", name: "GGT", panel: "liver", unit: "U/L", aliases: ["Gamma GT", "GGTP", "Gamma glutamyl transferase", "Gamma glutamyl transpeptidase", "Gamma-GT"], altUnits: [{ unit: "IU/L", factor: 1 }], about: "A liver enzyme that rises with alcohol, fatty liver and bile duct problems.", high: LIVER_HIGH, guide: "liver-enzymes" }),
  m({ id: "protein-total", name: "Total protein", panel: "liver", unit: "g/dL", aliases: ["Protein total", "Total proteins", "Serum protein", "TP"], altUnits: [{ unit: "g/L", factor: 0.1 }, { unit: "gm/dl", factor: 1 }], about: "All the protein in your blood: albumin plus globulins.", low: PROTEIN_LOW, high: { meaning: "High total protein can come from dehydration or, less often, from long-term inflammation or a blood protein disorder.", lifestyle: ["Drink enough water before a repeat test."], doctor: DOCTOR_PROMPT }, guide: "liver-enzymes" }),
  m({ id: "albumin", name: "Albumin", panel: "liver", unit: "g/dL", aliases: ["Serum albumin", "ALB"], altUnits: [{ unit: "g/L", factor: 0.1 }, { unit: "gm/dl", factor: 1 }], about: "The main protein made by your liver. It keeps fluid inside your blood vessels.", low: PROTEIN_LOW, high: { meaning: "High albumin is almost always from dehydration.", lifestyle: ["Drink enough water and repeat if your doctor suggests it."], doctor: DOCTOR_SOON }, guide: "liver-enzymes" }),
  m({ id: "globulin", name: "Globulin", panel: "liver", unit: "g/dL", aliases: ["Serum globulin", "GLOB"], altUnits: [{ unit: "g/L", factor: 0.1 }, { unit: "gm/dl", factor: 1 }], about: "Proteins that include antibodies. Total protein minus albumin.", high: { meaning: "High globulin can come from long-term infection or inflammation, liver disease or, rarely, a blood protein disorder.", lifestyle: [], doctor: DOCTOR_PROMPT }, guide: "liver-enzymes" }),
  m({ id: "ag-ratio", name: "A/G ratio", panel: "liver", unit: "ratio", aliases: ["Albumin globulin ratio", "A:G ratio", "Albumin/globulin ratio", "AG ratio"], about: "Albumin divided by globulin. It helps your doctor read the protein results together.", low: { meaning: "A low ratio means relatively less albumin or more globulin. It's read with the two numbers it comes from.", lifestyle: [], doctor: DOCTOR_SOON }, guide: "liver-enzymes" }),

  // ───────── Kidney ─────────
  m({ id: "creatinine", name: "Creatinine", panel: "kidney", unit: "mg/dL", aliases: ["Serum creatinine", "S. creatinine", "Creat", "CREA"], altUnits: [{ unit: "umol/L", factor: 1 / 88.4 }], about: "A waste product from muscles that healthy kidneys clear. Muscular people and creatine users run higher.", low: { meaning: "Low creatinine usually just means lower muscle mass. It is rarely a concern.", lifestyle: ["Strength training and enough protein build muscle."], doctor: DOCTOR_SOON }, high: KIDNEY_HIGH, guide: "creatinine" }),
  m({ id: "egfr", name: "eGFR", panel: "kidney", unit: "mL/min/1.73m2", aliases: ["Estimated GFR", "GFR estimated", "eGFR CKD EPI", "eGFR by MDRD", "eGFR MDRD", "Estimated glomerular filtration rate", "GFR", "eGFR (CKD-EPI)"], altUnits: [{ unit: "ml/min/1.73m²", factor: 1 }, { unit: "ml/min", factor: 1 }, { unit: "ml/min/1.73", factor: 1 }, { unit: "ml/min/1.73 sq.m", factor: 1 }], about: "An estimate of how well your kidneys filter, worked out from creatinine, age and sex. Higher is better.", low: KIDNEY_HIGH, guide: "creatinine" }),
  m({ id: "urea", name: "Blood urea", panel: "kidney", unit: "mg/dL", aliases: ["Urea", "Serum urea", "S. urea"], altUnits: [{ unit: "mmol/L", factor: 6.006 }], about: "A waste product from protein that the kidneys clear.", high: KIDNEY_HIGH, guide: "creatinine" }),
  m({ id: "bun", name: "BUN", panel: "kidney", unit: "mg/dL", aliases: ["Blood urea nitrogen", "Urea nitrogen"], altUnits: [{ unit: "mmol/L", factor: 2.801 }], about: "The nitrogen part of blood urea. Some labs report this instead of urea.", high: KIDNEY_HIGH, guide: "creatinine" }),
  m({ id: "uric-acid", name: "Uric acid", panel: "kidney", unit: "mg/dL", aliases: ["Serum uric acid", "S. uric acid", "Urate", "UA"], altUnits: [{ unit: "umol/L", factor: 1 / 59.48 }], about: "A waste product from purines in food and your own cells. Too much forms crystals in joints.", high: URIC_HIGH, guide: "uric-acid" }),

  // ───────── Electrolytes and minerals ─────────
  m({ id: "sodium", name: "Sodium", panel: "electrolytes", unit: "mmol/L", aliases: ["Na", "Na+", "Serum sodium", "S. sodium"], altUnits: [{ unit: "mEq/L", factor: 1 }], about: "Keeps the water balance in your body and helps nerves work.", ...ELECTROLYTE("sodium") }),
  m({ id: "potassium", name: "Potassium", panel: "electrolytes", unit: "mmol/L", aliases: ["K", "K+", "Serum potassium", "S. potassium"], altUnits: [{ unit: "mEq/L", factor: 1 }], about: "Keeps your heartbeat and muscles working normally.", ...ELECTROLYTE("potassium") }),
  m({ id: "chloride", name: "Chloride", panel: "electrolytes", unit: "mmol/L", aliases: ["Cl", "Cl-", "Serum chloride"], altUnits: [{ unit: "mEq/L", factor: 1 }], about: "Works with sodium to keep fluid and acid levels balanced.", ...ELECTROLYTE("chloride") }),
  m({ id: "bicarbonate", name: "Bicarbonate", panel: "electrolytes", unit: "mmol/L", aliases: ["HCO3", "Total CO2", "CO2", "Serum bicarbonate", "TCO2"], altUnits: [{ unit: "mEq/L", factor: 1 }], about: "Shows your blood's acid balance.", ...ELECTROLYTE("bicarbonate") }),
  m({ id: "calcium", name: "Calcium", panel: "electrolytes", unit: "mg/dL", aliases: ["Ca", "Serum calcium", "Total calcium", "S. calcium", "Calcium total"], altUnits: [{ unit: "mmol/L", factor: 4.008 }], about: "Needed for bones, muscles, nerves and the heart.", low: { ...ELECTROLYTE("calcium").low, meaning: "Low calcium is often linked to low vitamin D or low albumin. It can cause tingling and cramps." }, high: { ...ELECTROLYTE("calcium").high, meaning: "High calcium can come from too much vitamin D or calcium supplements, or from overactive parathyroid glands." } }),
  m({ id: "magnesium", name: "Magnesium", panel: "electrolytes", unit: "mg/dL", aliases: ["Mg", "Serum magnesium"], altUnits: [{ unit: "mmol/L", factor: 2.431 }], about: "Helps muscles, nerves and heart rhythm.", ...ELECTROLYTE("magnesium") }),
  m({ id: "phosphorus", name: "Phosphorus", panel: "electrolytes", unit: "mg/dL", aliases: ["Phosphate", "Inorganic phosphorus", "Serum phosphorus", "PO4", "Phosphorous", "Phosphorous inorganic", "Phosphorus inorganic"], altUnits: [{ unit: "mmol/L", factor: 3.097 }], about: "Works with calcium to build bones.", ...ELECTROLYTE("phosphorus") }),

  // ───────── Thyroid ─────────
  m({ id: "tsh", name: "TSH", panel: "thyroid", unit: "uIU/mL", aliases: ["Thyroid stimulating hormone", "Thyrotropin", "TSH ultrasensitive", "Ultrasensitive TSH", "TSH 3rd generation", "S. TSH"], altUnits: [{ unit: "mIU/L", factor: 1 }, { unit: "mU/L", factor: 1 }, { unit: "uIU/ml", factor: 1 }], about: "The brain's signal to your thyroid. High TSH usually means the thyroid is underactive; low usually means overactive.", low: THYROID_OVER, high: THYROID_UNDER, guide: "tsh" }),
  m({ id: "t4-free", name: "Free T4", panel: "thyroid", unit: "ng/dL", aliases: ["FT4", "Free thyroxine", "Free T4 (FT4)"], altUnits: [{ unit: "pmol/L", factor: 1 / 12.87 }], about: "The active form of the main thyroid hormone.", low: THYROID_UNDER, high: THYROID_OVER, guide: "t3-t4" }),
  m({ id: "t3-free", name: "Free T3", panel: "thyroid", unit: "pg/mL", aliases: ["FT3", "Free triiodothyronine", "Free T3 (FT3)"], altUnits: [{ unit: "pmol/L", factor: 0.651 }], about: "The most active thyroid hormone, made mostly from T4.", low: THYROID_UNDER, high: THYROID_OVER, guide: "t3-t4" }),
  m({ id: "t4-total", name: "Total T4", panel: "thyroid", unit: "ug/dL", aliases: ["T4", "Thyroxine", "Total thyroxine", "T4 total"], altUnits: [{ unit: "nmol/L", factor: 1 / 12.87 }], about: "All the T4 in your blood, bound and free.", low: THYROID_UNDER, high: THYROID_OVER, guide: "t3-t4" }),
  m({ id: "t3-total", name: "Total T3", panel: "thyroid", unit: "ng/dL", aliases: ["T3", "Triiodothyronine", "Total triiodothyronine", "T3 total"], altUnits: [{ unit: "nmol/L", factor: 65.1 }, { unit: "ng/mL", factor: 100 }], about: "All the T3 in your blood, bound and free.", low: THYROID_UNDER, high: THYROID_OVER, guide: "t3-t4" }),

  // ───────── Iron ─────────
  m({ id: "iron", name: "Serum iron", panel: "iron", unit: "ug/dL", aliases: ["Iron", "S. iron", "Fe", "Iron serum"], altUnits: [{ unit: "umol/L", factor: 5.585 }, { unit: "mcg/dL", factor: 1 }], about: "The iron moving in your blood right now. It changes through the day, so it's read with ferritin and TIBC.", low: IRON_LOW, high: IRON_HIGH, guide: "ferritin" }),
  m({ id: "tibc", name: "TIBC", panel: "iron", unit: "ug/dL", aliases: ["Total iron binding capacity", "Iron binding capacity"], altUnits: [{ unit: "umol/L", factor: 5.585 }, { unit: "mcg/dL", factor: 1 }], about: "How much iron your blood could carry. It goes up when your body is short of iron.", high: IRON_LOW, guide: "ferritin" }),
  m({ id: "transferrin-saturation", name: "Transferrin saturation", panel: "iron", unit: "%", aliases: ["TSAT", "Iron saturation", "% saturation", "Transferrin saturation %", "Percent saturation"], about: "How full your iron carriers are.", low: IRON_LOW, high: IRON_HIGH, guide: "ferritin" }),
  m({ id: "ferritin", name: "Ferritin", panel: "iron", unit: "ng/mL", aliases: ["Serum ferritin", "S. ferritin"], altUnits: [{ unit: "ug/L", factor: 1 }, { unit: "mcg/L", factor: 1 }], about: "Your body's iron store. It drops before haemoglobin does, but it also rises with any infection.", low: IRON_LOW, high: IRON_HIGH, guide: "ferritin" }),

  // ───────── Vitamins ─────────
  m({ id: "vitamin-b12", name: "Vitamin B12", panel: "vitamins", unit: "pg/mL", aliases: ["B12", "Vit B12", "Cobalamin", "Cyanocobalamin", "Vitamin B12 (cobalamin)", "Vitamin B12 cyanocobalamin"], altUnits: [{ unit: "pmol/L", factor: 1.355 }], about: "Needed for nerves, red blood cells and energy. It comes mostly from animal foods, so vegetarians often run low.", low: VIT_LOW("vitamin B12"), high: VIT_HIGH("vitamin B12"), guide: "vitamin-b12" }),
  m({ id: "vitamin-d", name: "Vitamin D (25-OH)", panel: "vitamins", unit: "ng/mL", aliases: ["Vitamin D", "25 OH vitamin D", "25-hydroxy vitamin D", "25 hydroxy cholecalciferol", "Vit D", "Vitamin D total", "Vitamin D3", "25(OH)D", "Vitamin D 25 hydroxy"], altUnits: [{ unit: "nmol/L", factor: 1 / 2.496 }], about: "Needed for strong bones, muscles and immunity. Your skin makes it from sunlight.", low: VIT_LOW("vitamin D"), high: VIT_HIGH("vitamin D"), guide: "vitamin-d" }),

  // ───────── Inflammation ─────────
  m({ id: "crp", name: "CRP", panel: "inflammation", unit: "mg/L", aliases: ["C-reactive protein", "C reactive protein", "CRP quantitative", "Quantitative CRP"], altUnits: [{ unit: "mg/dL", factor: 10 }], about: "A protein the liver makes when there is inflammation or infection.", high: INFLAM_HIGH, guide: "crp" }),
  m({ id: "hs-crp", name: "hs-CRP", panel: "inflammation", unit: "mg/L", aliases: ["High sensitivity CRP", "hsCRP", "High sensitivity C-reactive protein", "Cardiac CRP"], altUnits: [{ unit: "mg/dL", factor: 10 }], about: "A more sensitive CRP test, used to read low-grade inflammation linked to heart risk.", high: INFLAM_HIGH, guide: "crp" }),
];
