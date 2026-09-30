import type { NewsItem, NewsCategory } from "@/types";

export const NEWS_CATEGORIES: NewsCategory[] = [
  "Outbreak Advisory",
  "Seasonal Care",
  "Research Digest",
  "Government Health",
  "AYUSH Update",
  "Nutrition Science",
  "Hospital & Policy",
  "Drug Safety",
];

const pad = (n: number) => String(n).padStart(2, "0");

export function istDateKey(d: Date = new Date()): string {
  // Indian Standard Time date key (UTC+5:30)
  const ist = new Date(d.getTime() + (5.5 * 60 + d.getTimezoneOffset()) * 60 * 1000);
  return `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())}`;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

const HOUR = 3600 * 1000;

/** Rotating pool used by the deterministic daily engine.
 *  All items are evergreen public-health guidance — no invented events, no fake statistics. */
type PoolItem = Omit<NewsItem, "publishedAt" | "updatedAt" | "slug" | "status"> & { slugStem: string };

const POOL: PoolItem[] = [
  {
    slugStem: "monsoon-dengue-family-checklist",
    title: "Monsoon dengue season: the 10-minute weekly home check that actually works",
    summary: "Stagnant water in coolers, plant trays and tyre swings remains India's biggest breeding driver. A short structured check each week cuts exposure more than any spray.",
    category: "Outbreak Advisory",
    kind: "advisory",
    sourceName: "BHG Newsroom — synthesised from official vector-control guidance",
    sourceUrl: "https://www.mohfw.gov.in/",
    body: [
      { heading: "Why the check matters", paragraphs: ["Aedes aegypti, the dengue mosquito, breeds in clean, stagnant water within 200 metres of where people sleep. It bites in daylight, so bed nets alone do not protect.", "Source reduction — emptying, scrubbing and covering containers — is the intervention public-health programmes consistently rank first, because it removes the next generation of mosquitoes rather than the visible ones."] },
      { heading: "What to do this week", paragraphs: ["Walk your home and roof once a week for ten minutes with a bucket and brush. Most breeding sites take seconds to fix once they are seen."], bullets: ["Empty and scrub cooler lids, plant trays, Fridge drip bowls, and water in porch pots", "Cover overhead tanks and check for cracks or loose lids", "Throw out or puncture old tyres, bottles, coconut shells and parked-vessel saucers", "Change pet water daily; add sand to unused drain traps to stop pooling", "Report large civic dumping to your municipal health officer"] },
      { heading: "If someone at home gets a fever", paragraphs: ["Watch for high fever with severe body or behind-eye pain, rash, or pain near the joints. Paracetamol and fluids are standard supportive care.", "Seek urgent care for warning signs: severe abdominal pain, persistent vomiting, bleeding gums or nose, sleeplessness or restlessness, cold clammy skin, or reduced urine. These can mean plasma leakage or bleeding and need hospital assessment.", "Avoid ibuprofen and aspirin in suspected dengue because of bleeding risk; confirm any painkiller choice with a doctor."] },
    ],
    keyTakeaways: ["Weekly 10-minute source reduction beats reactive fogging", "Daylight bites mean protection cannot rely on bed nets", "Warning signs need hospital care, not home remedies"],
    tags: ["dengue", "monsoon", "prevention"],
    relatedDiseases: ["fever", "skin-allergies"],
    relatedLabs: ["cbc", "crp"],
    relatedHerbs: ["neem", "tulsi"],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Evergreen guidance consistent with national vector-control advisories. No specific outbreak figures or dates are claimed.",
    imagePrompt: "Premium editorial photo of an Indian family emptying a water cooler tray outdoors, monsoon light, clear educational composition, ultra-HD, non-graphic.",
  },
  {
    slugStem: "heat-wave-hydration-ors",
    title: "Heat wave playbook: ORS, timing and the medicines that make dehydration worse",
    summary: "Salt-water-sugar in correct amounts works where sports drinks and 'just water' can fail, especially for elders and people on diuretics.",
    category: "Seasonal Care",
    kind: "advisory",
    sourceName: "BHG Newsroom — national heat-health guidance summary",
    sourceUrl: "https://www.ndma.gov.in/",
    body: [
      { heading: "Why plain water is not always enough", paragraphs: ["Heavy sweating loses sodium and potassium, not just water. Replacing fluids with only plain water over long hours can dilute sodium and cause headache, cramps, confusion or worse.", "Low-sugar ORS with salt restores what sweat removes. A home version follows a measured recipe — a litre of safe water, six level teaspoons of sugar and half a level teaspoon of salt — mixed accurately, not guessed."] },
      { heading: "Who is most at risk", paragraphs: ["Outdoor workers, adults over 65, children, people with kidney or heart disease, and anyone taking diuretics, laxatives or SGLT2 diabetes medicines (which increase fluid loss) need planned breaks, shade and hydration.", "People with hypertension or heart failure should not force large fluid volumes — a doctor should set daily limits, especially in monsoon and summer."] },
      { heading: "Hour-by-hour in a heat wave", bullets: ["Shift outdoor work to before 11 am and after 4 pm where possible", "Two litres of fluid is a common starting target on hot days, individualised by doctor and kidney status", "Cool the body, not only the room: wet cloth on neck, forearm rinses, shade breaks", "Know danger signs: confusion, fainting, hot dry skin, no urine for many hours — these need emergency care"] },
    ],
    keyTakeaways: ["Sweat loss needs salt and sugar, not just water", "Diuretics and some diabetes drugs raise heat risk — plan with a doctor", "Confusion or fainting is an emergency"],
    tags: ["heat stroke", "dehydration", "ors", "summer"],
    relatedDiseases: ["dehydration", "electrolyte-imbalance", "high-blood-pressure"],
    relatedLabs: ["creatinine", "urine-routine"],
    relatedHerbs: ["tulsi"],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "ORS recipe reflects standard WHO-style guidance; individualised volumes require medical advice.",
    imagePrompt: "Editorial photo of ORS sachets, a steel tumbler and a shaded Indian street with a worker resting, warm light, educational tone, ultra-HD.",
  },
  {
    slugStem: "air-quality-winter-inhaler-planning",
    title: "Winter smog season: what asthmatics and heart patients should plan now",
    summary: "PM2.5 spikes in North Indian winters reliably worsen cough, wheeze and BP control. Planning beats panic: spacer check, buffer days, masks that fit.",
    category: "Seasonal Care",
    kind: "digest",
    sourceName: "BHG Newsroom — respiratory & cardiology prevention summary",
    sourceUrl: "https://www.who.int/health-topics/air-pollution",
    body: [
      { heading: "What the air does to airways", paragraphs: ["Fine particles reach the small airways and trigger inflammation. For people with asthma, COPD or ischaemic heart disease, this shows up as night cough, reliever over-use, breathlessness on stairs and, at population level, more admissions.", "There is no safe exposure; the practical goal is reducing dose on bad days."] },
      { heading: "A sensible bad-air day plan", bullets: ["Check a live AQI before outdoor exercise; shift indoor or later when it is severe", "Keep reliever inhalers within reach; more than occasional use needs a controller review, not more puffs", "Fit matters: a well-sealed N95 for outdoor commute; cloth masks filter little of PM2.5", "Indoor: stop incense and chulha smoke, ventilate when outdoor air is cleaner, keep surfaces damp-dusted", "Carry a written action plan if you have had an attack this year"] },
      { heading: "When to seek care", paragraphs: ["Breathlessness at rest, inability to speak full sentences, blue lips or reliever not helping are emergencies.", "Persistent night cough beyond two weeks or wheeze on most days needs a lung function review, not repeat antibiotic courses."] },
    ],
    keyTakeaways: ["Reduce dose: shift exercise timing, mask, clean indoor air", "Reliever over-use means controller review", "Breathlessness at rest is an emergency"],
    tags: ["asthma", "copd", "pollution", "winter"],
    relatedDiseases: ["asthma", "copd", "high-blood-pressure", "chronic-cough"],
    relatedLabs: ["cbc"],
    relatedHerbs: ["tulsi", "ginger"],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Prevention guidance consistent with WHO air-quality recommendations; no AQI numbers fabricated.",
    imagePrompt: "Editorial photo of an Indian city skyline under winter haze with a person using an inhaler near a window, educational, calm, ultra-HD.",
  },
  {
    slugStem: "new-drug-safety-communication-steroid-creams",
    title: "Drug safety watch: the topical steroid mix creams behind India's fungal epidemic",
    summary: "Fixed-dose steroid-antifungal combos sold over the counter keep worsening ringworm. Dermatologists urge prescription discipline and patient counselling.",
    category: "Drug Safety",
    kind: "digest",
    sourceName: "BHG Newsroom — dermatology public-health commentary summary",
    sourceUrl: "https://www.indiadrugsafetyportal.gov.in/",
    body: [
      { heading: "Why the itch comes back stronger", paragraphs: ["Potent steroids in common combo creams reduce redness and itching fast, while locally suppressing immunity. The fungus keeps spreading under a calmer-looking skin surface, and tinea becomes harder to diagnose and treat — so-called tinea incognito.", "Repeated courses also thin skin and cause stretch marks, and patients may keep buying the cream without advice."] },
      { heading: "What to do instead", bullets: ["See a dermatologist for ring-like itchy patches lasting more than a couple of weeks", "Use plain antifungal treatment as prescribed for the full course — stopping early selects recurrence", "Do not share or reuse leftover steroid mixes; keep them off the face and groin", "Wash and iron clothes and towels hot; treat household members who are symptomatic", "Report suspected adverse drug reactions to a pharmacist or the national portal"] },
    ],
    keyTakeaways: ["Fast relief with steroid mixes often means slower cure later", "Full-course antifungal treatment matters", "Report adverse effects — it protects other patients"],
    tags: ["dermatology", "steroids", "fungal", "drug safety"],
    relatedDiseases: ["fungal-skin-infection", "eczema", "skin-allergies"],
    relatedLabs: [],
    relatedHerbs: ["neem"],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Describes a widely reported clinical pattern without inventing trial numbers; no specific brands named as offenders.",
    imagePrompt: "Editorial photo of a dermatology clinic desk with cream tubes and prescription, Indian context, clean and non-sensational, ultra-HD.",
  },
  {
    slugStem: "ayush-gram-mela-community-screening",
    title: "Community screening rounds: how AYUSH melas fit into a prevention plan",
    summary: "Government wellness melas bring yoga counselling, NCD screening and Ayurvedic advice to villages. They work best as an entry point to follow-up, not a one-day fix.",
    category: "AYUSH Update",
    kind: "digest",
    sourceName: "BHG Newsroom — public-health programme explainer",
    sourceUrl: "https://www.mohfw.gov.in/",
    body: [
      { heading: "What melas do well", paragraphs: ["Screening camps catch high blood pressure, undiagnosed diabetes and oral or breast lumps that might take years to reach a hospital. Health workers can start registries, refer positives and schedule confirmatory tests.", "Yoga and dietary counselling at these events improves routine adherence for people already on treatment."] },
      { heading: "How to use a camp visit", bullets: ["Carry old reports and your current medicine strip or list", "Ask for written referral if BP or sugar is high — camps should not be the only record", "Do not start new medicines or supplements on the spot without a doctor's review", "Book the follow-up test the same day before you leave"] },
    ],
    keyTakeaways: ["Screening is a door, not a treatment", "Insist on written referral and follow-up", "Medicine changes need a qualified doctor"],
    tags: ["ayush", "screening", "prevention", "primary care"],
    relatedDiseases: ["high-blood-pressure", "type-2-diabetes", "prediabetes"],
    relatedLabs: ["hba1c", "fasting-glucose"],
    relatedHerbs: [],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "General programme description; no specific event, date or attendance figures are claimed.",
    imagePrompt: "Documentary-style editorial photo of an Indian village health mela with a BP screening table and a smiling health worker, respectful composition, ultra-HD.",
  },
  {
    slugStem: "nutrition-research-weekend-myths-plate-method",
    title: "Research digest: the 'superfood' industry vs the boring plate method",
    summary: "Metabolic benefits follow consistent patterns — fibre, protein, fewer liquid calories — while single-food claims rarely survive controlled trials.",
    category: "Nutrition Science",
    kind: "digest",
    sourceName: "BHG Newsroom — nutrition evidence summary",
    sourceUrl: "https://www.who.int/health-topics/nutrition",
    body: [
      { heading: "What controlled studies keep finding", paragraphs: ["Across dietary trials, the biggest reproducible effects come from replacing refined grains and sugary drinks with whole grains, pulses, vegetables and nuts, and from slowing carbohydrate absorption with fibre and protein.", "Individual foods marketed as cures — from one spice to one seed — show small, inconsistent effects that disappear when the total diet is corrected."] },
      { heading: "Applying it to an Indian plate", bullets: ["Half plate vegetables and salad; a quarter protein (dal, paneer, soya, eggs, fish); a quarter whole grains", "Add fibre: flax, methi, sprouts; drink whole fruit, never juice", "Keep oil measured (3–4 tsp/day total), no trans fat from vanaspati bakery", "Protein at breakfast reduces evening cravings and supports muscle in elders"] },
    ],
    keyTakeaways: ["Patterns beat pills and superfoods", "Fibre and protein are the workhorses", "Liquid sugar is the fastest lever to fix"],
    tags: ["nutrition", "diet", "myths", "metabolic health"],
    relatedDiseases: ["type-2-diabetes", "obesity", "fatty-liver", "high-cholesterol"],
    relatedLabs: ["hba1c", "lipid-profile"],
    relatedHerbs: ["moringa", "amla"],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Summary of established consensus; no single-study effect sizes invented.",
    imagePrompt: "Premium editorial overhead photo of an Indian thali with vegetables, dal, salad and millet roti on a steel plate, natural light, ultra-HD.",
  },
  {
    slugStem: "antibiotic-resistance-pharmacy-habits",
    title: "Antibiotic stewardship: what families can do when a chemist offers 'the usual course'",
    summary: "Self-started antibiotics mask diagnoses, break resistance and cause side effects. A short script of questions protects the whole household.",
    category: "Government Health",
    kind: "advisory",
    sourceName: "BHG Newsroom — antimicrobial stewardship public guidance summary",
    sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance",
    body: [
      { heading: "The three-question rule", paragraphs: ["Ask any prescriber: (1) What infection are we treating and could it be viral? (2) Do we need a test, and when will you change the medicine if results say so? (3) How long is the course and what side effects should send me back?", "Refusing to 'just start something' for a fever on day one is usually good care, not neglect — many fevers are viral and self-limited."] },
      { heading: "Household basics", bullets: ["Never reuse an old antibiotic strip left by a relative", "Complete a prescribed course only when a clinician decided you needed it", "Fever beyond 3 days, breathlessness, stiff neck or confusion needs evaluation — not a pharmacy counter", "Vaccination for children and elders reduces the infections that would otherwise need antibiotics"] },
    ],
    keyTakeaways: ["Antibiotics need a diagnosis, not a symptom", "Questions are part of good care", "Vaccines reduce resistance pressure"],
    tags: ["antibiotics", "AMR", "fever", "safety"],
    relatedDiseases: ["fever", "respiratory-allergies", "chronic-cough"],
    relatedLabs: ["cbc", "crp"],
    relatedHerbs: [],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "General stewardship guidance; no national resistance statistics invented.",
    imagePrompt: "Editorial photo of an Indian pharmacist counter with a patient asking questions, medicine strips neatly arranged, documentary style, ultra-HD.",
  },
  {
    slugStem: "cancer-screening-women-what-guidelines-say",
    title: "Cancer screening for women: what the advice actually says at 30, 40 and 50",
    summary: "Breast self-awareness, clinical exam and symptom-first evaluation remain the practical Indian route; population mammography programmes are still early.",
    category: "Hospital & Policy",
    kind: "digest",
    sourceName: "BHG Newsroom — cancer-control programme explainer",
    sourceUrl: "https://www.mohfw.gov.in/",
    body: [
      { heading: "What to know", paragraphs: ["Screening aims to find disease in people without symptoms. For cervical cancer, visual and cytology screening through government cancer centres is expanding; the point is a scheduled, repeatable pathway, not a one-time test.", "For breast cancer in average-risk women without symptoms, clinical breast examination is a widely supported step; routine mammography from 40 is not yet standard national practice everywhere. Discuss your own risk — family history, BRCA, density — with a doctor."] },
      { heading: "Symptoms that always need evaluation", bullets: ["A new lump that persists beyond a menstrual cycle", "Nipple discharge (especially bloody), skin dimpling or new asymmetry", "Post-menopausal bleeding or unusual discharge", "Persistent ulcer in the mouth, especially in tobacco users — get examined, not given ointment"] },
    ],
    keyTakeaways: ["Screening is planned and repeated", "Know your family history and share it", "Persistent symptoms need diagnosis, not creams"],
    tags: ["oncology", "screening", "women's health", "prevention"],
    relatedDiseases: ["breast-health", "pcos", "menstrual-health"],
    relatedLabs: [],
    relatedHerbs: [],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Guidelines differ across programmes; this explainer does not invent a specific national protocol or survival statistic.",
    imagePrompt: "Respectful editorial photo of a doctor counselling an Indian woman in a government OPD, informational, non-graphic, ultra-HD.",
  },
  {
    slugStem: "sleep-hygiene-icsr-shift-work",
    title: "Sleep debt and metabolic risk: practical fixes for shift workers and new parents",
    summary: "Late-night screen light, irregular meal timing and short sleep worsen insulin resistance faster than most diets improve it.",
    category: "Research Digest",
    kind: "digest",
    sourceName: "BHG Newsroom — circadian-metabolism research summary",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/",
    body: [
      { heading: "What the sleep studies agree on", paragraphs: ["Even a few nights of short or mistimed sleep reduce insulin sensitivity, increase appetite and raise evening sugar responses. For type 2 diabetes and hypertension, irregular sleep often explains why a 'good diet' still leaves numbers high.", "The evidence is strongest for consistency: same wake time, dark room, morning light and no food within 2–3 hours of sleeping."] },
      { heading: "Realistic plans", bullets: ["Night shift: keep a dark room in the day, 3–4 hours of core sleep before the shift, a short nap after returning if possible", "New parents: prioritise sleep when the baby sleeps and cut caffeine after mid-afternoon", "Everyone: bright lights off an hour before bed; screens out or heavily dimmed", "If snoring plus daytime sleepiness is present, get evaluated for sleep apnea — hygiene alone will not fix it"] },
    ],
    keyTakeaways: ["Consistency beats total hours in most studies", "Late food worsens overnight sugar", "Snoring + sleepiness needs an apnea workup"],
    tags: ["sleep", "diabetes", "hypertension", "lifestyle"],
    relatedDiseases: ["sleep-problems", "type-2-diabetes", "high-blood-pressure", "sleep-apnea"],
    relatedLabs: ["hba1c"],
    relatedHerbs: ["ashwagandha"],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Summarises widely replicated findings without specific invented percentages.",
    imagePrompt: "Calm editorial photo of an Indian night-shift nurse resting with an eye mask at home, soft morning light, respectful, ultra-HD.",
  },
  {
    slugStem: "elderly-vaccination-and-flu-season",
    title: "Flu season planning: vaccination review for elders, pregnant women and diabetics",
    summary: "A yearly influenza vaccine discussion remains the simplest seasonal risk reducer for high-risk groups; check what is due and when.",
    category: "Government Health",
    kind: "advisory",
    sourceName: "BHG Newsroom — immunisation guidance summary",
    sourceUrl: "https://www.mohfw.gov.in/",
    body: [
      { heading: "Who benefits most", paragraphs: ["Adults over 60, pregnant women, and people with diabetes, chronic lung or heart disease face the worst influenza outcomes. Annual vaccination is the standard preventive tool; timing should follow the local season and clinician advice.", "Pneumococcal and other adult vaccines may also be indicated — review them in the same visit."] },
      { heading: "What to ask at the appointment", bullets: ["Which vaccines do I need this year, and are any contraindicated for me?", "Should my BP or diabetes be stabilised first?", "What illness means I should postpone — and for how long?", "Where will my record be kept, and who calls me for the next dose?"] },
    ],
    keyTakeaways: ["Ask about annual flu vaccine if you're high-risk", "Review adult pneumococcal status", "Bring your full medicine list"],
    tags: ["vaccination", "flu", "elderly", "pregnancy"],
    relatedDiseases: ["asthma", "type-2-diabetes", "high-blood-pressure", "bronchitis"],
    relatedLabs: [],
    relatedHerbs: [],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "General immunisation counselling; no campaign-specific dates, doses or effectiveness numbers fabricated.",
    imagePrompt: "Editorial photo of an elderly Indian person receiving a vaccine at a government clinic, arm visible, calm, professional, non-graphic, ultra-HD.",
  },
  {
    slugStem: "thyroid-medicine-timing-winter-checks",
    title: "Winter thyroid check window: dose changes, cold intolerance and the TSH trap",
    summary: "Feeling cold or tired in December does not always mean your dose changed. TSH takes 6–8 weeks to reflect any real shift.",
    category: "Research Digest",
    kind: "digest",
    sourceName: "BHG Newsroom — endocrinology care reminder",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/",
    body: [
      { heading: "Why patients over-adjust", paragraphs: ["Levothyroxine has a long half-life; TSH lags any change by weeks. Symptoms are unreliable for titration, so patients who self-increase in winter risk palpitations, insomnia and, over years, atrial fibrillation and bone loss.", "A consistent routine matters more than brand loyalty: same time, empty stomach, water only, and 30–60 minutes before breakfast; iron, calcium and antacids separated by about four hours."] },
      { heading: "A sensible checklist", bullets: ["Only change dose with a clinician's review after a repeat TSH", "Tell the lab if you take biotin supplements — they skew thyroid assays", "Pregnancy or planned pregnancy needs a tighter target — contact your doctor early", "Check B12, vitamin D, hemoglobin and ferritin when fatigue persists despite normal TSH"] },
    ],
    keyTakeaways: ["TSH lags — don't chase daily symptoms", "Timing rules decide absorption", "Biotin before testing distorts results"],
    tags: ["thyroid", "levothyroxine", "testing", "winter"],
    relatedDiseases: ["hypothyroidism", "hyperthyroidism", "thyroid-nodules"],
    relatedLabs: ["tsh", "t3-t4", "vitamin-b12"],
    relatedHerbs: ["ashwagandha"],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Reflects standard endocrine guidance; no new study claimed.",
    imagePrompt: "Editorial photo of a morning thyroid routine: glass of water, tablet strip and alarm clock by a sunny Indian window, clean and calm, ultra-HD.",
  },
  {
    slugStem: "mental-health-helplines-students",
    title: "Exam season mental health: what families should know about help-seeking",
    summary: "Persistent low mood or hopelessness in students needs a professional conversation early — not a motivational speech.",
    category: "Hospital & Policy",
    kind: "advisory",
    sourceName: "BHG Newsroom — mental-health access explainer",
    sourceUrl: "https://www.mohfw.gov.in/",
    body: [
      { heading: "Warning flags in students", bullets: ["Two or more weeks of low mood, loss of interest, sleep or appetite change", "Falling attendance, giving up activities, or talking about worthlessness", "Any self-harm statement or plan — this needs immediate professional attention", "Substance use to cope, or sudden panic attacks with palpitations and breathlessness"] },
      { heading: "How to start", paragraphs: ["Use a trusted helpline or a school counsellor to create a bridge to care; helplines are for guidance and de-escalation, not diagnosis or long-term treatment.", "Psychiatry and psychology are both legitimate first stops; medications, when prescribed, are for biology, not weakness, and need follow-up, not a single visit.", "If someone expresses intent to harm themselves, stay with them and seek urgent care immediately."] },
    ],
    keyTakeaways: ["Early conversation is protective", "Helplines bridge to care — they are not the whole plan", "Self-harm statements need immediate in-person help"],
    tags: ["mental health", "students", "depression", "anxiety"],
    relatedDiseases: ["depression", "anxiety", "stress", "sleep-problems"],
    relatedLabs: ["tsh", "vitamin-b12"],
    relatedHerbs: [],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Safety-focused; no helpline numbers invented here — site links to official Tele-MANAS guidance on the mental wellness hub.",
    imagePrompt: "Gentle editorial photo of an Indian teenager talking with a counsellor, warm light, hopeful, respectful, non-clinical, ultra-HD.",
  },
  {
    slugStem: "iron-deficiency-heavy-periods-what-to-ask",
    title: "Heavy periods and low ferritin: the questions that stop years of fatigue",
    summary: "In Indian women, menstrual blood loss is a leading driver of iron deficiency. Treating the leak and the stores together is the fix.",
    category: "Government Health",
    kind: "digest",
    sourceName: "BHG Newsroom — women's anaemia programme explainer",
    sourceUrl: "https://www.mohfw.gov.in/",
    body: [
      { heading: "Why fatigue is dismissed", paragraphs: ["Pallor, breathlessness on stairs, hair fall and constant tiredness get normalised. But heavy bleeding with ferritin below about 30 is a medical pattern, not a personality trait, and it responds well to correct treatment.", "Supplementing without a plan fails: dose schedule, absorption rules and follow-up labs matter."] },
      { heading: "Ask at your next visit", bullets: ["What is my hemoglobin and ferritin — and what did we set as the target?", "Could adenomyosis, fibroids or a copper IUD be driving bleeding?", "How long after numbers normalise do I continue iron (often months to refill stores)?", "Should gynecology review the bleeding source rather than repeating tablets only?"] },
    ],
    keyTakeaways: ["Heavy periods are treatable — ask specifically", "Ferritin, not just hemoglobin, guides duration", "Treat the leak and the stores together"],
    tags: ["anemia", "iron", "womens health", "periods"],
    relatedDiseases: ["anemia", "iron-deficiency", "menstrual-health"],
    relatedLabs: ["cbc", "ferritin"],
    relatedHerbs: ["moringa", "amla"],
    author: "BHG Newsroom",
    reviewer: "Medical review pending — placeholder",
    factCheckNote: "Consistent with national anaemia-mission counselling; no prevalence figures fabricated here.",
    imagePrompt: "Editorial photo of an Indian woman eating a vitamin-C-rich meal with iron foods, home kitchen, natural light, ultra-HD.",
  },
];

/** Deterministic daily engine — today's briefing always exists, updates at midnight IST. */
export function getTodayBriefing(date: Date = new Date()): NewsItem {
  const key = istDateKey(date);
  const idx = dayOfYear(date) % POOL.length;
  const item = POOL[idx];
  return {
    ...item,
    slug: `briefing-${key}`,
    status: "published",
    publishedAt: `${key}T06:30:00+05:30`,
    updatedAt: `${key}T06:30:00+05:30`,
  };
}

/** Full newsroom feed: today's briefing first, then the pool published on a rolling schedule. */
export function getSeedNews(date: Date = new Date(), limit = 12): NewsItem[] {
  const now = date.getTime();
  const todayKey = istDateKey(date);
  const items: NewsItem[] = POOL.slice(0, limit).map((p, i) => {
    const published = new Date(now - i * 26 * HOUR);
    const key = istDateKey(published);
    return {
      ...p,
      slug: i === 0 && key === todayKey ? `briefing-${key}` : `${p.slugStem}-${key}`,
      status: "published",
      publishedAt: published.toISOString(),
      updatedAt: published.toISOString(),
    };
  });
  return items.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}
