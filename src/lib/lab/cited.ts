// Cited reference ranges and guideline bands, each copied from the official page named with it
// (read on the date in `checked`). Only numbers that appear on the page are here; where a page
// gives none, the marker has no entry and the member's own report range is used instead.
//
// MedlinePlus is the US National Library of Medicine's consumer site (a government source).
// Indian labs often print different ranges (machine, method, population), which is why the
// range on the member's own report always wins over these.
import type { Band, RefRange, Source } from "./types";

const CHECKED = "2026-10-28";
const CHECKED_29 = "2026-10-29";
const ency = (id: string, title: string): Source => ({ title, publisher: "MedlinePlus, U.S. National Library of Medicine", url: `https://medlineplus.gov/ency/article/${id}.htm`, checked: CHECKED });
const ency29 = (id: string, title: string): Source => ({ ...ency(id, title), checked: CHECKED_29 });
const labTest = (slug: string, title: string): Source => ({ title, publisher: "MedlinePlus, U.S. National Library of Medicine", url: `https://medlineplus.gov/lab-tests/${slug}/`, checked: CHECKED });

const ADULT = 18;
const both = (male: [number, number], female: [number, number]): RefRange[] => [
  { sex: "male", low: male[0], high: male[1], ageMin: ADULT },
  { sex: "female", low: female[0], high: female[1], ageMin: ADULT },
];

const RBC_INDICES = ency("003648", "RBC indices");
const DIFF = ency("003657", "Blood differential test");
const IRON = ency("003488", "Serum iron test");
const CHOL = labTest("cholesterol-levels", "Cholesterol levels: what you need to know");

export type Cited = { ranges?: RefRange[]; bands?: Band[]; sources: Source[] };

export const CITED: Record<string, Cited> = {
  // CBC
  hemoglobin: { ranges: both([13.8, 17.2], [12.1, 15.1]), sources: [ency("003645", "Hemoglobin")] },
  rbc: { ranges: both([4.2, 5.7], [3.8, 5.1]), sources: [ency("003644", "RBC count")] },
  hematocrit: { ranges: both([37, 48], [34, 43]), sources: [ency("003646", "Hematocrit")] },
  mcv: { ranges: [{ low: 79, high: 95 }], sources: [RBC_INDICES] },
  mch: { ranges: both([27, 33], [26, 33]), sources: [RBC_INDICES] },
  mchc: { ranges: [{ low: 32, high: 36 }], sources: [RBC_INDICES] },
  wbc: { ranges: [{ low: 4.5, high: 11 }], sources: [ency("003643", "WBC count")] },
  neutrophils: { ranges: [{ low: 40, high: 60 }], sources: [DIFF] },
  lymphocytes: { ranges: [{ low: 20, high: 40 }], sources: [DIFF] },
  monocytes: { ranges: [{ low: 2, high: 8 }], sources: [DIFF] },
  eosinophils: { ranges: [{ low: 1, high: 4 }], sources: [DIFF] },
  basophils: { ranges: [{ low: 0.5, high: 1 }], sources: [DIFF] },
  platelets: { ranges: [{ low: 150, high: 400 }], sources: [ency("003647", "Platelet count")] },
  esr: {
    // "Men under 50: less than 15 mm/hr; over 50: less than 20. Women under 50: less than 20; over 50: less than 30."
    ranges: [
      { sex: "male", high: 15, ageMin: ADULT, ageMax: 49 },
      { sex: "male", high: 20, ageMin: 50 },
      { sex: "female", high: 20, ageMin: ADULT, ageMax: 49 },
      { sex: "female", high: 30, ageMin: 50 },
    ],
    sources: [ency("003638", "ESR")],
  },

  // Blood sugar
  "glucose-fasting": { ranges: [{ low: 70, high: 99 }], sources: [ency("003482", "Blood sugar test")] },
  // "Most of the time, the blood glucose level will be 125 mg/dL or lower."
  "glucose-random": { ranges: [{ high: 125 }], sources: [ency("003482", "Blood sugar test")] },
  hba1c: {
    bands: [
      { label: "Normal", status: "normal", max: 5.7 },
      { label: "Prediabetes range", status: "high", min: 5.7, max: 6.5 },
      { label: "Diabetes range", status: "high", min: 6.5 },
    ],
    sources: [labTest("hemoglobin-a1c-hba1c-test", "Hemoglobin A1C (HbA1c) test"), ency("003640", "A1C test")],
  },

  // Lipids: MedlinePlus "healthy levels" for adults 20 and over.
  "cholesterol-total": { bands: [{ label: "Healthy", status: "normal", ageMin: 20, max: 200 }, { label: "Above healthy level", status: "high", ageMin: 20, min: 200 }], sources: [CHOL] },
  "non-hdl": { bands: [{ label: "Healthy", status: "normal", ageMin: 20, max: 130 }, { label: "Above healthy level", status: "high", ageMin: 20, min: 130 }], sources: [CHOL] },
  ldl: { bands: [{ label: "Healthy", status: "normal", ageMin: 20, max: 100 }, { label: "Above healthy level", status: "high", ageMin: 20, min: 100 }], sources: [CHOL] },
  hdl: {
    bands: [
      { label: "Low", status: "low", ageMin: 20, max: 40, sex: "male" },
      { label: "Low", status: "low", ageMin: 20, max: 50, sex: "female" },
      { label: "Best (60 or more)", status: "normal", ageMin: 20, min: 60 },
      { label: "OK, 60 or more is best", status: "normal", ageMin: 20, min: 40, max: 60, sex: "male" },
      { label: "OK, 60 or more is best", status: "normal", ageMin: 20, min: 50, max: 60, sex: "female" },
    ],
    sources: [CHOL],
  },
  triglycerides: {
    bands: [
      { label: "Healthy", status: "normal", ageMin: 20, max: 150 },
      { label: "Borderline high", status: "high", ageMin: 20, min: 150, max: 200 },
      { label: "High", status: "high", ageMin: 20, min: 200, max: 500 },
      { label: "Very high", status: "high", ageMin: 20, min: 500 },
    ],
    sources: [labTest("triglycerides-test", "Triglycerides test")],
  },

  // Liver
  "bilirubin-total": { ranges: [{ low: 0.1, high: 1.2 }], sources: [ency("003479", "Bilirubin blood test")] },
  "bilirubin-direct": { ranges: [{ high: 0.3 }], sources: [ency("003479", "Bilirubin blood test")] },
  alt: { ranges: [{ low: 4, high: 36 }], sources: [ency("003473", "Alanine transaminase (ALT) blood test")] },
  ast: { ranges: [{ low: 8, high: 33 }], sources: [ency("003472", "Aspartate aminotransferase (AST) blood test")] },
  alp: { ranges: [{ low: 40, high: 129, ageMin: ADULT }], sources: [ency("003470", "ALP blood test")] },
  ggt: { ranges: [{ low: 5, high: 40, ageMin: ADULT }], sources: [ency("003458", "Gamma-glutamyl transferase (GGT) blood test")] },
  "protein-total": { ranges: [{ low: 6.5, high: 8.1 }], sources: [ency("003483", "Total protein")] },
  albumin: { ranges: [{ low: 3.4, high: 5.4 }], sources: [ency("003480", "Albumin blood (serum) test")] },

  // Kidney
  bun: { ranges: [{ low: 6, high: 20 }], sources: [ency("003474", "BUN blood test")] },
  creatinine: { ranges: both([0.7, 1.3], [0.5, 0.95]), sources: [ency("003475", "Creatinine blood test")] },
  // "normal results range from 90 to 120"; older people normally have lower values.
  egfr: { ranges: [{ low: 90 }], sources: [ency("007305", "Glomerular filtration rate")] },
  "uric-acid": { ranges: both([4.0, 8.6], [3.0, 7.1]), sources: [ency("003476", "Uric acid blood test")] },

  // Electrolytes and minerals
  sodium: { ranges: [{ low: 135, high: 145 }], sources: [ency("003481", "Sodium blood test")] },
  potassium: { ranges: [{ low: 3.7, high: 5.2 }], sources: [ency("003484", "Potassium test")] },
  chloride: { ranges: [{ low: 98, high: 107 }], sources: [ency("003485", "Chloride test, blood")] },
  bicarbonate: { ranges: [{ low: 23, high: 29 }], sources: [ency("003469", "CO2 blood test")] },
  calcium: { ranges: [{ low: 8.8, high: 10.3 }], sources: [ency("003477", "Calcium blood test")] },
  magnesium: { ranges: [{ low: 1.7, high: 2.2 }], sources: [ency("003487", "Magnesium blood test")] },
  phosphorus: { ranges: [{ low: 2.8, high: 4.5, ageMin: ADULT }], sources: [ency("003478", "Phosphorus blood test")] },

  // Thyroid
  tsh: { ranges: [{ low: 0.4, high: 4.8 }], sources: [ency("003684", "TSH test")] },
  "t4-free": { ranges: [{ low: 0.8, high: 1.9 }], sources: [ency("003517", "Free T4 test")] },
  "t3-total": { ranges: [{ low: 78, high: 158, ageMin: 20 }], sources: [ency("003687", "T3 test")] },
  // The page gives 210–440 pg/dL (3.2–6.8 pmol/L), which is 2.1–4.4 pg/mL.
  "t3-free": { ranges: [{ low: 2.1, high: 4.4, ageMin: 20 }], sources: [ency("003687", "T3 test")] },

  // Iron
  iron: { ranges: both([59, 158], [37, 145]), sources: [IRON] },
  tibc: { ranges: both([171, 505], [149, 492]), sources: [IRON, ency("003489", "Total iron binding capacity")] },
  "transferrin-saturation": { ranges: both([20, 50], [15, 45]), sources: [IRON] },
  ferritin: { ranges: both([30, 400], [13, 150]), sources: [ency("003490", "Ferritin blood test")] },

  // Vitamins
  "vitamin-b12": { ranges: [{ low: 299, high: 1054 }], sources: [ency("003705", "Vitamin B12 level")] },
  // "Many experts recommend a level from 30 to 80 ng/mL."
  "vitamin-d": { ranges: [{ low: 30, high: 80 }], sources: [ency("003569", "25-hydroxy vitamin D test")] },
  folate: { ranges: [{ low: 2.7, high: 17 }], sources: [ency29("003686", "Folic acid test")] },

  // CBC extras
  reticulocytes: { ranges: [{ low: 0.77, high: 2.26, ageMin: ADULT }], sources: [ency29("003637", "Reticulocyte count")] },

  // Electrolytes
  "calcium-ionized": { ranges: [{ low: 4.8, high: 5.6, ageMin: ADULT }], sources: [ency29("003486", "Calcium, ionized")] },

  // Hormones. Women's ranges for oestrogen, progesterone, LH and FSH depend on the cycle day and
  // menopause, which we don't ask, so only the men's ranges are used and women see their lab's.
  "testosterone-total": {
    // "Male age 17 to 50 years: 249 to 836 ng/dL; over 50: 193 to 740. Female 17 to 50: 8.4 to 48.1; over 50: 2.9 to 40.1."
    ranges: [
      { sex: "male", low: 249, high: 836, ageMin: ADULT, ageMax: 50 },
      { sex: "male", low: 193, high: 740, ageMin: 51 },
      { sex: "female", low: 8.4, high: 48.1, ageMin: ADULT, ageMax: 50 },
      { sex: "female", low: 2.9, high: 40.1, ageMin: 51 },
    ],
    sources: [ency29("003707", "Testosterone")],
  },
  estradiol: { ranges: [{ sex: "male", low: 10, high: 50, ageMin: ADULT }], sources: [ency29("003711", "Estradiol blood test")] },
  progesterone: { ranges: [{ sex: "male", high: 1, ageMin: ADULT }], sources: [ency29("003714", "Serum progesterone")] },
  lh: { ranges: [{ sex: "male", low: 1.8, high: 8.6, ageMin: ADULT }], sources: [ency29("003708", "Luteinizing hormone (LH) blood test")] },
  fsh: { ranges: [{ sex: "male", low: 1.5, high: 12.4, ageMin: ADULT }], sources: [ency29("003710", "Follicle-stimulating hormone (FSH) blood test")] },
  // "Men: less than 20 ng/mL. Nonpregnant women: less than 25 ng/mL."
  prolactin: { ranges: [{ sex: "male", high: 20, ageMin: ADULT }, { sex: "female", high: 25, ageMin: ADULT }], sources: [ency29("003718", "Prolactin blood test")] },
  "dhea-s": {
    ranges: [
      { sex: "female", low: 45, high: 320, ageMin: 18, ageMax: 29 },
      { sex: "female", low: 40, high: 325, ageMin: 30, ageMax: 39 },
      { sex: "female", low: 25, high: 220, ageMin: 40, ageMax: 49 },
      { sex: "female", low: 15, high: 170, ageMin: 50, ageMax: 59 },
      { sex: "female", high: 145, ageMin: 60 },
      { sex: "male", low: 110, high: 510, ageMin: 18, ageMax: 29 },
      { sex: "male", low: 110, high: 370, ageMin: 30, ageMax: 39 },
      { sex: "male", low: 45, high: 345, ageMin: 40, ageMax: 49 },
      { sex: "male", low: 25, high: 240, ageMin: 50, ageMax: 59 },
      { sex: "male", high: 204, ageMin: 60 },
    ],
    sources: [ency29("003717", "DHEA-sulfate test")],
  },
  pth: { ranges: [{ low: 10, high: 65 }], sources: [ency29("003690", "Parathyroid hormone (PTH) blood test")] },
  "c-peptide": { ranges: [{ low: 0.3, high: 3.3 }], sources: [ency29("003701", "Insulin C-peptide test")] },

  // Heart risk
  "apo-b": { ranges: [{ low: 50, high: 150 }], sources: [ency29("003502", "Apolipoprotein B")] },
  lpa: { ranges: [{ high: 30 }], sources: [ency29("007262", "Lipoprotein-a")] },

  // Pancreas and muscle enzymes
  amylase: { ranges: [{ low: 40, high: 140 }], sources: [ency29("003464", "Amylase, blood")] },
  lipase: { ranges: [{ high: 160 }], sources: [ency29("003465", "Lipase test")] },
  ldh: { ranges: [{ low: 125, high: 220 }], sources: [ency29("003471", "Lactate dehydrogenase test")] },

  // Clotting: the ranges for people not on blood thinners.
  pt: { ranges: [{ low: 11, high: 13.5 }], sources: [ency29("003652", "Prothrombin time (PT)")] },
  inr: { ranges: [{ low: 0.8, high: 1.1 }], sources: [ency29("003652", "Prothrombin time (PT)")] },
  aptt: { ranges: [{ low: 25, high: 35 }], sources: [ency29("003653", "Partial thromboplastin time (PTT)")] },
  fibrinogen: { ranges: [{ low: 200, high: 400 }], sources: [ency29("003650", "Fibrinogen blood test")] },

  // Joints, infection, prostate
  "rheumatoid-factor": { ranges: [{ high: 15 }], sources: [ency29("003548", "Rheumatoid factor (RF)")] },
  // "A normal PSA level is considered to be up to 4.0 ng/mL ... below 2.5 for men in their 50s or younger."
  psa: { ranges: [{ sex: "male", high: 2.5, ageMin: ADULT, ageMax: 59 }, { sex: "male", high: 4, ageMin: 60 }], sources: [ency29("003346", "Prostate-specific antigen (PSA) blood test")] },
};
