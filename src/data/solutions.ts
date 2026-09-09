/**
 * Medical Solutions hub — every condition mapped to every responsible
 * solution pillar. Nothing here prescribes; it routes readers to the
 * right in-depth guides and to professional care.
 */

export type Pillar = {
  slug: string;
  name: string;
  hindi: string;
  tagline: string;
  href: string;
  evidence: string;
  icon: string;
};

export const PILLARS: Pillar[] = [
  { slug: "modern", name: "Modern Medicine", hindi: "आधुनिक चिकित्सा", tagline: "Diagnosis, medicines, procedures & emergency care", href: "/medicines", evidence: "Strong — guideline-backed", icon: "stethoscope" },
  { slug: "ayurveda", name: "Ayurveda", hindi: "आयुर्वेद", tagline: "Dosha, dinacharya, classical formulations & Panchakarma", href: "/ayurveda", evidence: "Traditional + emerging trials", icon: "sparkles" },
  { slug: "herbs", name: "Herbs & Botanicals", hindi: "जड़ी-बूटियाँ", tagline: "20 evidence-graded herbs with safety & interactions", href: "/herbs", evidence: "Varies: limited → moderate", icon: "leaf" },
  { slug: "nutrition", name: "Nutrition & Diet", hindi: "पोषण", tagline: "Indian plates, millets, diet plans & recipes", href: "/nutrition", evidence: "Strong for metabolic health", icon: "salad" },
  { slug: "yoga", name: "Yoga & Fitness", hindi: "योग", tagline: "Asana, walking, strength & breathing practices", href: "/yoga", evidence: "Moderate–strong", icon: "activity" },
  { slug: "mind", name: "Sleep & Mind", hindi: "नींद व मन", tagline: "Sleep hygiene, stress, anxiety & depression guides", href: "/mental-wellness", evidence: "Strong", icon: "brain" },
  { slug: "labs", name: "Tests & Screening", hindi: "जाँच", tagline: "Know which test, when, and what it means", href: "/lab-tests", evidence: "Strong", icon: "flask" },
  { slug: "homeopathy", name: "Homeopathy (Honest Guide)", hindi: "होम्योपैथी", tagline: "Principles, remedies & true evidence status", href: "/homeopathy", evidence: "Insufficient for most claims", icon: "droplets" },
];

export type SolutionMap = {
  condition: string;
  href: string;
  category: string;
  modern: string;
  ayurveda: string;
  nutrition: string;
  lifestyle: string;
  tests: string;
  emergency: string | null;
};

export const SOLUTION_FINDER: SolutionMap[] = [
  { condition: "Type 2 Diabetes", href: "/diseases/type-2-diabetes", category: "Metabolic", modern: "Metformin → combinations → insulin if needed; BP + statin protection", ayurveda: "Madhumeha pathya: millets, karela, methi; formulations only with monitoring", nutrition: "Plate method + millet rotation; 30 g fibre; no liquid sugar", lifestyle: "10-min post-meal walks + strength 2–3×/week; 7–8 h sleep", tests: "HbA1c 3–6 monthly; annual eye, kidney, foot", emergency: "Fruity breath + vomiting (DKA) or confusion with sweating (hypo) → emergency" },
  { condition: "High Blood Pressure", href: "/diseases/high-blood-pressure", category: "Heart", modern: "Amlodipine / ARB ± thiazide; home-BP guided titration", ayurveda: "Rakta-vata balance: stress routines; Arjuna only as adjunct", nutrition: "Salt <5 g/day; DASH-thali; potassium unless kidney-limited", lifestyle: "30-min brisk walk; weight loss; zero tobacco; limit alcohol", tests: "Home BP log; annual creatinine, lipids, ECG", emergency: "BP >180/120 with chest pain / vision change / weakness → emergency" },
  { condition: "Hypothyroidism", href: "/diseases/hypothyroidism", category: "Hormonal", modern: "Levothyroxine 30–60 min before food; TSH-guided dosing", ayurveda: "Agni-vata support; ashwagandha can shift thyroid — supervised only", nutrition: "Iodised salt; iron, B12, D correction; cooked crucifers fine", lifestyle: "Strength + walking for weight; consistent sleep", tests: "TSH 6–8 wks after dose change; FT4, anti-TPO as needed", emergency: null },
  { condition: "PCOS", href: "/diseases/pcos", category: "Hormonal", modern: "Lifestyle first; pills / metformin / letrozole per goal", ayurveda: "Artava-granthi view: weight + cycle routine; Shatavari adjunct", nutrition: "Low-GI, 1.2–1.6 g/kg protein; strength beats cardio alone", lifestyle: "Strength 3×/week; 8 h sleep; stress care", tests: "TSH, prolactin, HbA1c, androgens; Rotterdam criteria", emergency: null },
  { condition: "Acidity & GERD", href: "/diseases/acidity", category: "Digestive", modern: "PPI courses; H. pylori testing; alarm-symptom endoscopy", ayurveda: "Amlapitta: meal timing; amla, mulethi (DGL) soothing", nutrition: "Dinner 3 h before bed; limit chilli, fried food, excess chai", lifestyle: "Weight loss; head-end elevation; no post-meal lying", tests: "H. pylori stool/breath test when recurrent", emergency: "Vomiting blood, black stools, trouble swallowing → urgent" },
  { condition: "Fatty Liver (MASLD)", href: "/diseases/fatty-liver", category: "Digestive", modern: "7–10% weight loss is the drug; statins safe; FIB-4 staging", ayurveda: "Yakrit support via diet discipline; no proven cleanse", nutrition: "Zero alcohol; no sugary drinks; millet-pulse plates", lifestyle: "150 min/week activity; coffee 2–3 cups (less sugar)", tests: "LFT + ultrasound + FIB-4; lipids, HbA1c", emergency: null },
  { condition: "Asthma", href: "/diseases/asthma", category: "Respiratory", modern: "Daily inhaled controller + action plan; spacer technique", ayurveda: "Tamaka-shwasa: trigger routine; tulsi tea comfort only", nutrition: "Healthy weight; vitamin D adequacy", lifestyle: "Dust/pollution control; breathing exercises; flu vaccine", tests: "Spirometry; allergy review; inhaler technique check", emergency: "Can't speak full sentences / blue lips / reliever failing → emergency" },
  { condition: "Migraine", href: "/diseases/migraine", category: "Neuro", modern: "Triptans/NSAIDs early; preventives for frequent attacks", ayurveda: "Vata-pitta routine: sleep + meal regularity; brahmi adjunct", nutrition: "Never skip meals; hydrate; limit caffeine swings", lifestyle: "Headache diary; stress + screen breaks; regular sleep", tests: "Clinical diagnosis; scan only for red flags", emergency: "Thunderclap / fever+stiffness / weakness → emergency" },
  { condition: "Anemia", href: "/diseases/anemia", category: "Blood", modern: "Type first (ferritin/B12); iron course 3 mo beyond normal", ayurveda: "Pandu view: diet + digestion support alongside iron", nutrition: "Iron + vitamin C (amla/lemon); away from chai/calcium", lifestyle: "Deworming as advised; treat heavy periods", tests: "CBC + ferritin + B12; stool occult if unexplained", emergency: "Fainting, chest pain, black stools with pallor → urgent" },
  { condition: "Arthritis & Joint Pain", href: "/diseases/arthritis", category: "Bones", modern: "Exercise + weight first; NSAIDs short-term; DMARDs for RA", ayurveda: "Sandhigata-vata: oil massage, gentle heat; turmeric adjunct", nutrition: "Weight loss target; calcium + D; anti-inflammatory plates", lifestyle: "Low-impact strengthening; physio; heat/cold", tests: "X-ray; RA factor/anti-CCP, uric acid, vitamin D", emergency: "Single hot swollen joint with fever → emergency (septic)" },
  { condition: "High Cholesterol", href: "/diseases/high-cholesterol", category: "Heart", modern: "Statins for elevated risk; LDL targets by risk band", ayurveda: "Meda-dhatu diet discipline; garlic/arjuna adjuncts", nutrition: "Oats, methi, soya, 30 g nuts; zero trans fat", lifestyle: "Aerobic + strength; quit tobacco", tests: "Lipid profile 4–12 wks after changes; Lp(a) once", emergency: null },
  { condition: "Kidney Stones", href: "/diseases/kidney-stones", category: "Kidney", modern: "Hydration + pain control; size-based procedure decisions", ayurveda: "Ashmari: hydration routine; Varuna/punarnava adjuncts", nutrition: "2.5–3 L fluids; moderate salt + animal protein", lifestyle: "Don't hold urine; stay active", tests: "Ultrasound + urine routine; stone analysis if passed", emergency: "Fever + flank pain + vomiting → urgent (obstructed infection)" },
  { condition: "UTI", href: "/diseases/urinary-tract-infection", category: "Kidney", modern: "Culture-guided antibiotics; don't self-treat in pregnancy", ayurveda: "Mutrakrichra: hydration + hygiene routine", nutrition: "Plenty of fluids; unsweetened cranberry may help some", lifestyle: "Front-to-back hygiene; urinate after intercourse", tests: "Urine routine + culture before antibiotics", emergency: "High fever + back pain + vomiting → prompt (kidney infection)" },
  { condition: "Eczema & Skin Allergy", href: "/diseases/eczema", category: "Skin", modern: "Moisturiser-led care; topical steroids in flares; trigger diary", ayurveda: "Twak-vikara: gentle routines; neem external comfort", nutrition: "Balanced diet; no blanket food bans without testing", lifestyle: "Lukewarm short baths; cotton clothes; stress care", tests: "Clinical; patch testing for contact allergy", emergency: "Facial swelling + breathlessness → emergency (anaphylaxis)" },
  { condition: "Hair Fall", href: "/diseases/hair-loss", category: "Skin", modern: "Correct iron/B12/D/thyroid/protein; minoxidil per pattern", ayurveda: "Khalitya: scalp oiling + stress routine; bhringraj adjunct", nutrition: "Protein 1–1.2 g/kg; iron + C; crash-diet reversal", lifestyle: "Gentle handling; treat PCOS/thyroid drivers", tests: "Ferritin, B12, D, TSH; pull test + pattern exam", emergency: null },
  { condition: "Anxiety & Stress", href: "/diseases/anxiety", category: "Mind", modern: "Therapy ± medicines; rule out thyroid/B12/apnea mimics", ayurveda: "Manas support: routine, abhyanga, meditation", nutrition: "Regular meals; limit caffeine + alcohol", lifestyle: "Fixed wake time; daily walk; breathing practice", tests: "TSH, B12, D baseline; sleep review", emergency: "Self-harm thoughts → Tele-MANAS 14416 / emergency now" },
  { condition: "Insomnia", href: "/diseases/sleep-problems", category: "Mind", modern: "CBT-I first; apnea evaluation; cautious short sedatives", ayurveda: "Nidra routine: warm milk, oil foot massage, early dinner", nutrition: "No heavy late meals; limit evening caffeine", lifestyle: "Screens off 1 h before bed; morning sunlight", tests: "Sleep diary; STOP-Bang; sleep study if apnea suspected", emergency: null },
  { condition: "Obesity", href: "/diseases/obesity", category: "Metabolic", modern: "500–750 kcal deficit; medicines/surgery for selected cases", ayurveda: "Sthaulya: millet-heavy pathya + daily vyayama", nutrition: "Protein 1.2–1.6 g/kg; 9-inch plate; early dinner", lifestyle: "10k steps + strength 3×; weekly weigh-in", tests: "HbA1c, lipids, TSH, LFT baseline", emergency: null },
  { condition: "Gout", href: "/diseases/gout", category: "Bones", modern: "Flare control + urate-lowering to target <6 mg/dL", ayurveda: "Vatarakta: diet discipline alongside medicines", nutrition: "Limit alcohol (esp. beer), red meat, sugary drinks; hydrate", lifestyle: "Weight loss gradually; stay active between flares", tests: "Uric acid; joint-fluid confirmation if unclear", emergency: null },
  { condition: "Sinusitis & Allergy", href: "/diseases/sinusitis", category: "Respiratory", modern: "Saline + intranasal steroids; antibiotics only if bacterial", ayurveda: "Pratishyaya: steam, nasya under guidance", nutrition: "Hydration; honey-ginger comfort (not cure)", lifestyle: "Dust/mould control; N95 in pollution", tests: "Clinical; CT only if recurrent/complicated", emergency: "Eye swelling, vision change, severe headache with fever → urgent" },
  { condition: "Constipation & Piles", href: "/diseases/constipation", category: "Digestive", modern: "Fibre + fluids + activity; osmotic laxatives short-term", ayurveda: "Vibandha/Arsha: Triphala short courses; warm water routine", nutrition: "30 g fibre; isabgol with enough water", lifestyle: "Squat-friendly posture; no straining; daily walk", tests: "Clinical; colonoscopy if bleeding + age/risk flags", emergency: "Heavy rectal bleeding / black stools / severe pain → urgent" },
  { condition: "Back & Neck Pain", href: "/diseases/back-pain", category: "Bones", modern: "Stay active; physio; red-flag screening; short NSAIDs", ayurveda: "Katishoola: oil massage + gentle heat; posture routine", nutrition: "Weight control; calcium + D adequacy", lifestyle: "Core strengthening; ergonomic desk; hourly breaks", tests: "Usually none early; MRI only for red flags", emergency: "Bladder/bowel change, saddle numbness, trauma → emergency" },
  { condition: "Fever & Infections", href: "/diseases/fever", category: "General", modern: "Paracetamol + fluids; antibiotics only if bacterial", ayurveda: "Jwara: rest + light diet; giloy/tulsi comfort teas", nutrition: "Small frequent fluids; ORS if vomiting/diarrhea", lifestyle: "Rest; isolate if contagious; track temperature", tests: "CBC, CRP; dengue/malaria in season; cultures if needed", emergency: "Breathlessness, confusion, rash with bleeding, seizures → emergency" },
  { condition: "Dizziness & Vertigo", href: "/diseases/dizziness", category: "Neuro", modern: "BPPV manoeuvres; BP/anemia correction; neuro exam", ayurveda: "Bhrama: rest + hydration routine; supervised care", nutrition: "Regular meals; hydrate; limit alcohol", lifestyle: "Rise slowly; vestibular exercises if advised", tests: "Lying-standing BP; Hb; Dix-Hallpike for BPPV", emergency: "Weakness / speech / vision change with dizziness → emergency (stroke)" },
];

export const APPROACH_COMPARE: { aspect: string; modern: string; ayurveda: string; lifestyle: string }[] = [
  { aspect: "Best for", modern: "Emergencies, infections, precise diagnosis", ayurveda: "Routine, digestion, chronic comfort", lifestyle: "Prevention & long-term control" },
  { aspect: "Speed", modern: "Fastest for acute illness", ayurveda: "Gradual, routine-based", lifestyle: "Slowest start, deepest payoff" },
  { aspect: "Evidence style", modern: "RCTs + guidelines", ayurveda: "Classical texts + emerging trials", lifestyle: "Large cohort + RCT support" },
  { aspect: "Safety rule", modern: "Never self-dose prescriptions", ayurveda: "Licensed products + supervision", lifestyle: "Personalise for pregnancy/heart/kidney" },
  { aspect: "When to combine", modern: "Always inform all practitioners", ayurveda: "Coordinate with your doctor", lifestyle: "Foundation under every plan" },
];
