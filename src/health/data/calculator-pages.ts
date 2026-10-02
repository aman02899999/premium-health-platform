/** Copy, method notes and FAQs for the standalone calculator pages. Ordered by search demand. */
export type CalculatorPage = {
  slug: string;
  name: string;
  h1: string;
  intro: string;
  seoTitle: string;
  seoDescription: string;
  method: string[];
  sources: { label: string; url: string }[];
  faqs: { q: string; a: string }[];
  howTo: string[];
};

export const CALCULATOR_PAGES: CalculatorPage[] = [
  {
    slug: "pregnancy-due-date-calculator",
    name: "Pregnancy Due Date Calculator",
    h1: "Pregnancy Due Date Calculator",
    intro: "Find your due date from your last period, conception date or IVF transfer — plus how many weeks pregnant you are and when each antenatal test is due.",
    seoTitle: "Pregnancy Due Date Calculator (LMP, IVF) — Weeks & Scans",
    seoDescription: "Free due date calculator: from last period, conception or IVF transfer. See weeks pregnant, trimester and your NT, anomaly scan and OGTT dates.",
    method: [
      "From your last period: Naegele's rule — first day of last period + 280 days, adjusted by the difference between your cycle length and 28 days.",
      "From conception: conception date + 266 days. IVF: day-5 transfer + 261 days, day-3 transfer + 263 days.",
      "Weeks pregnant are counted from the due date, so every method gives the same answer for the same pregnancy.",
      "Scan and test windows follow the standard antenatal schedule used in India (MoHFW / WHO).",
    ],
    sources: [
      { label: "ACOG Committee Opinion 700 — Methods for estimating the due date", url: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date" },
      { label: "National Health Mission (MoHFW) — Maternal health", url: "https://www.nhm.gov.in/index1.php?lang=1&level=2&sublinkid=822&lid=218" },
      { label: "WHO — Recommendations on antenatal care for a positive pregnancy experience (2016)", url: "https://www.who.int/publications/i/item/9789241549912" },
    ],
    faqs: [
      { q: "How accurate is a due date calculator?", a: "It gives the standard estimate doctors start from. Only about 4% of babies are born on their due date — most arrive between 37 and 42 weeks. A first-trimester ultrasound is the most accurate way to date a pregnancy." },
      { q: "My cycle isn't 28 days. Does that matter?", a: "Yes. Enter your usual cycle length and the calculator shifts the due date: a 32-day cycle moves it 4 days later." },
      { q: "How do I calculate my due date after IVF?", a: "Choose IVF and the transfer day. A day-5 (blastocyst) transfer adds 261 days to the transfer date; a day-3 transfer adds 263 days." },
      { q: "When is the NT scan done?", a: "Between 11 weeks 0 days and 13 weeks 6 days. The calculator shows your exact dates." },
    ],
    howTo: ["Choose how to calculate: last period, conception or IVF", "Enter the date", "Enter your usual cycle length if using your last period", "Read your due date, weeks pregnant and antenatal checklist"],
  },
  {
    slug: "ovulation-calculator",
    name: "Period & Ovulation Calculator",
    h1: "Period & Ovulation Calculator",
    intro: "Predict your next period, fertile window and ovulation day for the next three cycles.",
    seoTitle: "Ovulation Calculator — Fertile Window & Next Period Date",
    seoDescription: "Free period and ovulation calculator: see your fertile days, ovulation date and next 3 periods. Adjust cycle, period and luteal phase length.",
    method: [
      "Ovulation is estimated as your next period minus the luteal phase (14 days by default, adjustable from 10 to 16).",
      "The fertile window is the 5 days before ovulation plus ovulation day and the day after — sperm can live up to 5 days, an egg about 1 day.",
      "Future periods are predicted by adding your cycle length to the first day of your last period.",
    ],
    sources: [
      { label: "Wilcox et al., NEJM 1995 — Timing of sexual intercourse in relation to ovulation", url: "https://pubmed.ncbi.nlm.nih.gov/7477165/" },
      { label: "ACOG — Menstruation in girls and adolescents: using the menstrual cycle as a vital sign", url: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/12/menstruation-in-girls-and-adolescents-using-the-menstrual-cycle-as-a-vital-sign" },
    ],
    faqs: [
      { q: "When am I most fertile?", a: "In the 2–3 days before ovulation and on ovulation day. The calculator highlights the full 7-day window." },
      { q: "Can I use this as contraception?", a: "No. Calendar predictions can be off by several days because ovulation shifts with stress, illness and travel. Use a reliable contraceptive method." },
      { q: "What is a normal cycle length?", a: "21 to 35 days in adults. Cycles regularly outside this range are worth checking with a gynaecologist — PCOS and thyroid problems are common causes in India." },
      { q: "What is the luteal phase?", a: "The days between ovulation and your next period — usually 12–14. Leave it at 14 unless you track ovulation with test strips or temperature." },
    ],
    howTo: ["Enter the first day of your last period", "Enter your usual cycle and period length", "See your fertile window, ovulation day and next 3 periods"],
  },
  {
    slug: "bmi-calculator",
    name: "BMI Calculator",
    h1: "BMI Calculator for Indians",
    intro: "Your BMI on both the Indian (Asian) scale and the WHO international scale, your healthy weight range, and how far you are from it.",
    seoTitle: "BMI Calculator for Indians — Asian Cut-offs & Ideal Weight",
    seoDescription: "Free BMI calculator with Indian (Asian) and WHO categories, cm/kg or feet/lb, your healthy weight range and how many kg to reach it.",
    method: [
      "BMI = weight (kg) ÷ height (m)².",
      "Indian / Asian scale: under 18.5 underweight, 18.5–22.9 healthy, 23–24.9 overweight, 25 and above obese (WHO Asia-Pacific, Misra et al. 2009).",
      "WHO international scale: 18.5–24.9 normal, 25–29.9 overweight, 30 and above obese.",
      "Healthy weight range = BMI 18.5 to 22.9 at your height.",
    ],
    sources: [
      { label: "WHO Expert Consultation — Appropriate BMI for Asian populations (Lancet 2004)", url: "https://pubmed.ncbi.nlm.nih.gov/14726171/" },
      { label: "Misra et al. 2009 — Consensus statement for obesity in Asian Indians", url: "https://pubmed.ncbi.nlm.nih.gov/19582986/" },
    ],
    faqs: [
      { q: "Why is the healthy BMI lower for Indians?", a: "At the same BMI, Indians tend to carry more body fat, especially around the belly, and develop diabetes and heart disease earlier. So 23 and above is already considered overweight." },
      { q: "What is a healthy weight for my height?", a: "Enter your height — the calculator shows the range for a BMI of 18.5 to 22.9." },
      { q: "Is BMI accurate for muscular people?", a: "No. BMI can't tell muscle from fat, so it overestimates fat in very muscular people. Use the body fat calculator or waist measurement as well." },
      { q: "Can children use this BMI calculator?", a: "No. Under 18, BMI is judged against age- and sex-specific percentiles. Use the child growth tool instead." },
    ],
    howTo: ["Choose cm/kg or feet/lb", "Enter your height, weight and age", "Read your BMI on the Indian and WHO scales", "See your healthy weight range and how far you are from it"],
  },
  {
    slug: "calorie-calculator",
    name: "Calorie & Macro Calculator",
    h1: "Calorie & Macro Calculator",
    intro: "How many calories you burn, how many to eat for your goal, and how much protein, carbs and fat that means — in Indian-food terms.",
    seoTitle: "Calorie Calculator — Daily Calories, Protein & Macros",
    seoDescription: "Free calorie calculator (Mifflin-St Jeor): BMR, maintenance calories, a safe weight-loss or gain target, and protein, carb and fat grams.",
    method: [
      "BMR uses the Mifflin-St Jeor equation, the most accurate everyday formula for adults.",
      "Maintenance calories (TDEE) = BMR × activity factor (1.2 to 1.9).",
      "Losing 0.5 kg a week needs about a 550 kcal daily deficit (≈7,700 kcal per kg of fat). Targets never go below 1,200 kcal (women) or 1,500 kcal (men).",
      "Protein 1.2–1.6 g per kg by goal; fat 25% of calories (ICMR-NIN: 20–30%); carbs make up the rest.",
    ],
    sources: [
      { label: "Mifflin et al. 1990 — A new predictive equation for resting energy expenditure", url: "https://pubmed.ncbi.nlm.nih.gov/2305711/" },
      { label: "ISSN position stand — Protein and exercise (2017)", url: "https://pubmed.ncbi.nlm.nih.gov/28642676/" },
      { label: "ICMR-NIN — Dietary Guidelines for Indians (2024)", url: "https://www.nin.res.in/dietaryguidelines/" },
    ],
    faqs: [
      { q: "How many calories should I eat to lose weight?", a: "About 550 fewer than your maintenance calories to lose roughly 0.5 kg a week. The calculator works this out and won't go below a safe minimum." },
      { q: "What is the difference between BMR and TDEE?", a: "BMR is what your body burns at complete rest. TDEE adds your daily activity — it's the number to eat to keep your weight steady." },
      { q: "How much protein do I need?", a: "The Indian RDA is 0.83 g per kg, but 1.2–1.6 g per kg helps keep muscle while losing fat or building strength. People with kidney disease should ask their doctor first." },
      { q: "Is 1,200 calories safe?", a: "It's the usual minimum for women without medical supervision. Going lower makes it hard to get enough nutrients — lose weight more slowly instead." },
    ],
    howTo: ["Enter your sex, height, weight and age", "Choose your activity level and goal", "Read your BMR, maintenance and target calories", "Use the protein, carb and fat grams to plan meals"],
  },
  {
    slug: "body-fat-calculator",
    name: "Body Fat Calculator",
    h1: "Body Fat Percentage Calculator",
    intro: "Estimate your body fat with a measuring tape using the US Navy method — no scale or gym machine needed.",
    seoTitle: "Body Fat Calculator — US Navy Method with a Tape",
    seoDescription: "Free body fat percentage calculator using neck, waist and hip measurements (US Navy method). See your category, fat and lean mass.",
    method: [
      "US Navy method (Hodgdon & Beckett, 1984), metric form, from height, neck, waist and — for women — hip.",
      "Categories from the American Council on Exercise: men 2–5% essential, 6–13% athletes, 14–17% fitness, 18–24% average, 25%+ obese; women 10–13%, 14–20%, 21–24%, 25–31%, 32%+.",
      "Usually within 3–4% of a DEXA scan — best for tracking change over time.",
    ],
    sources: [
      { label: "Hodgdon & Beckett 1984 — Prediction of percent body fat for U.S. Navy men and women", url: "https://apps.dtic.mil/sti/citations/ADA143890" },
      { label: "American Council on Exercise — Percent body fat norms", url: "https://www.acefitness.org/resources/everyone/tools-calculators/percent-body-fat-calculator/" },
    ],
    faqs: [
      { q: "How do I measure for the body fat calculator?", a: "Use a soft tape, relaxed, after breathing out. Neck just below the Adam's apple; waist at the navel for men and the narrowest point for women; hips at the widest point." },
      { q: "What is a healthy body fat percentage?", a: "For most men 14–24% and for most women 21–31%. Athletes are usually lower." },
      { q: "Is this more accurate than BMI?", a: "It tells you more because it uses your waist, where risky belly fat sits. It's still an estimate — a DEXA scan is the gold standard." },
    ],
    howTo: ["Choose male or female", "Measure height, neck, waist (and hip for women)", "Enter your weight", "Read your body fat %, category and lean mass"],
  },
];

export const calculatorPage = (slug: string) => CALCULATOR_PAGES.find((c) => c.slug === slug);
