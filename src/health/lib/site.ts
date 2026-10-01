export const SITE = {
  name: "Premium Health Platform",
  shortName: "PHP",
  tagline: "Indian Health Knowledge — Modern Medicine, Ayurveda, Nutrition & Traditional Wellness",
  heroTitle: "Understand Your Health. Make Better Decisions.",
  heroSubtitle:
    "Evidence-informed health information combined with Indian Ayurveda, nutrition, lifestyle and modern medical knowledge.",
  // Same origin as the Royal Fitness Club site; every health route lives under /health.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://royalfitnessclub.in").replace(/\/$/, ""),
  locale: "en-IN",
  language: "en",
  // Public contact address; set NEXT_PUBLIC_CONTACT_EMAIL. Without it the contact page shows the gym phone only.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  contactPhone: "+91 88518 30081",
  disclaimer:
    "This website provides general educational information and is not a substitute for professional medical diagnosis, treatment or emergency care. Always consult a qualified healthcare professional.",
  affiliateDisclosure:
    "Some pages contain affiliate links. If you buy through them, we may earn a commission at no extra cost to you. This never influences our editorial content or evidence ratings.",
} as const;

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: { label: string; href: string; description?: string }[];
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/health" },
  {
    label: "Health News",
    href: "/health/news",
    description: "Daily medical & public-health briefings",
    children: [
      { label: "Today's Briefing", href: "/health/news" },
      { label: "All News", href: "/health/news" },
      { label: "Outbreak Advisories", href: "/health/news?c=Outbreak+Advisory" },
      { label: "Seasonal Care", href: "/health/news?c=Seasonal+Care" },
      { label: "Drug Safety", href: "/health/news?c=Drug+Safety" },
      { label: "RSS Feed", href: "/health/news/rss.xml" },
    ],
  },
  {
    label: "Diseases",
    href: "/health/diseases",
    description: "Understand 120+ conditions",
    children: [
      { label: "All Diseases", href: "/health/diseases" },
      { label: "Diabetes", href: "/health/diseases/type-2-diabetes" },
      { label: "High Blood Pressure", href: "/health/diseases/high-blood-pressure" },
      { label: "Thyroid", href: "/health/diseases/hypothyroidism" },
      { label: "PCOS", href: "/health/diseases/pcos" },
      { label: "Fatty Liver", href: "/health/diseases/fatty-liver" },
    ],
  },
  {
    label: "Solutions",
    href: "/health/solutions",
    description: "Every condition, every treatment path",
    children: [
      { label: "Solution Finder", href: "/health/solutions" },
      { label: "Diabetes Solutions", href: "/health/diseases/type-2-diabetes" },
      { label: "BP Solutions", href: "/health/diseases/high-blood-pressure" },
      { label: "Symptom Checker", href: "/health/symptoms" },
      { label: "Calculators", href: "/health/health-calculators" },
    ],
  },
  {
    label: "Ayurveda",
    href: "/health/ayurveda",
    children: [
      { label: "Ayurveda Portal", href: "/health/ayurveda" },
      { label: "Dosha Basics", href: "/health/ayurveda/dosha-basics" },
      { label: "Dinacharya", href: "/health/ayurveda/dinacharya-daily-routine" },
      { label: "Panchakarma Guide", href: "/health/ayurveda/panchakarma-education" },
    ],
  },
  {
    label: "Herbs",
    href: "/health/herbs",
    children: [
      { label: "All Herbs", href: "/health/herbs" },
      { label: "Ashwagandha", href: "/health/herbs/ashwagandha" },
      { label: "Turmeric", href: "/health/herbs/turmeric" },
      { label: "Giloy", href: "/health/herbs/giloy" },
    ],
  },
  {
    label: "Medicines",
    href: "/health/medicines",
    children: [
      { label: "All Medicines", href: "/health/medicines" },
      { label: "Metformin", href: "/health/medicines/metformin" },
      { label: "Amlodipine", href: "/health/medicines/amlodipine" },
      { label: "Levothyroxine", href: "/health/medicines/levothyroxine" },
    ],
  },
  { label: "Homeopathy", href: "/health/homeopathy" },
  {
    label: "Nutrition",
    href: "/health/nutrition",
    children: [
      { label: "Nutrition Portal", href: "/health/nutrition" },
      { label: "Millets", href: "/health/nutrition/ragi-finger-millet" },
      { label: "Methi", href: "/health/nutrition/methi-fenugreek-seeds" },
      { label: "Oats", href: "/health/nutrition/oats" },
    ],
  },
  { label: "Diet Plans", href: "/health/diet" },
  { label: "Yoga & Fitness", href: "/health/yoga" },
  {
    label: "Health Data",
    href: "/health/health-search",
    description: "Unified search + live APIs",
    children: [
      { label: "Unified Search", href: "/health/health-search", description: "Diseases, drugs, food, exercises, herbs, research" },
      { label: "Food Database", href: "/health/food-database", description: "Open Food Facts + USDA + barcode" },
      { label: "Nutrition Tracker", href: "/health/nutrition-tracker", description: "Track calories, macros" },
      { label: "Exercise Library", href: "/health/exercises", description: "wger fitness exercises" },
      { label: "Workout Builder", href: "/health/workout-builder", description: "Build custom workouts" },
      { label: "Drug Lookup", href: "/health/drug-lookup", description: "openFDA + RxNorm + PubChem" },
      { label: "Research", href: "/health/api/health/medical-literature?q=diabetes", description: "PubMed live" },
      { label: "Trials", href: "/health/api/health/clinical-trials?q=diabetes", description: "ClinicalTrials.gov live" },
      { label: "Muscles", href: "/health/api/health/muscles", description: "wger muscles" },
      { label: "Equipment", href: "/health/api/health/equipment", description: "wger equipment" },
      { label: "Q&A (RAG)", href: "/health/health-qa", description: "Retrieval-first with citations — Unique" },
      { label: "Sync", href: "/health/api/health/sync", description: "Background sync jobs" },
      { label: "Providers", href: "/health/api/health/providers", description: "Provider status" },
      { label: "Health Status", href: "/health/api/health/status", description: "System health" },
      { label: "Admin", href: "/health/admin/health", description: "Health admin dashboard" },
    ],
  },
  {
    label: "Developers",
    href: "/health/developers",
    description: "Health data API — keys, quotas, docs",
    children: [
      { label: "API Platform", href: "/health/developers", description: "Plans, quickstart, live data sources" },
      { label: "API Reference", href: "/health/developers/docs", description: "Auth, quotas, error codes, samples" },
      { label: "API Keys", href: "/health/developers/dashboard", description: "Create, monitor and revoke keys" },
      { label: "API Directory", href: "/health/api-directory", description: "Curated public API catalogue" },
      { label: "OpenAPI spec", href: "/health/api/v1/openapi.json", description: "Machine-readable definition" },
    ],
  },
  {
    label: "Unique India",
    href: "/health/thali-builder",
    description: "India-first unique features",
    children: [
      { label: "Thali Builder", href: "/health/thali-builder", description: "Balanced Indian thali — Unique" },
      { label: "Millet Swap Engine", href: "/health/millet-swap", description: "Rice/wheat → millets — Unique India" },
      { label: "IDRS + Anemia", href: "/health/india-risk", description: "IDRS diabetes + anemia — Unique India" },
      { label: "Yoga Timer", href: "/health/yoga-timer", description: "Pranayama + Surya Namaskar — Unique" },
      { label: "Ritucharya", href: "/health/ritucharya", description: "Seasonal planner + live weather — Unique" },
      { label: "Herb-Drug Checker", href: "/health/herb-interaction", description: "Ayurveda + allopathy safety — Unique" },
      { label: "Barcode Scanner", href: "/health/barcode-scanner", description: "890… OFF lookup — Unique" },
      { label: "Child Growth", href: "/health/child-growth", description: "WHO simplified — Unique India" },
      { label: "Health Q&A", href: "/health/health-qa", description: "RAG with citations — Unique" },
      { label: "Live Advisory", href: "/health/live-advisory", description: "Dengue/heat/UV live — Unique" },
      { label: "Dosha Meals", href: "/health/dosha-meals", description: "Vata/pitta/kapha meals — Unique" },
      { label: "Fasting Planner", href: "/health/fasting-planner", description: "Ekadashi/Navratri/IF — Unique" },
      { label: "Hinglish Search", href: "/health/hinglish-search", description: "EN/HI/Hinglish aliases — Unique" },
    ],
  },
  {
    label: "Wellness",
    href: "/health/mental-wellness",
    children: [
      { label: "Women's Health", href: "/health/womens-health" },
      { label: "Men's Health", href: "/health/mens-health" },
      { label: "Child Health", href: "/health/child-health" },
      { label: "Mental Wellness", href: "/health/mental-wellness" },
    ],
  },
  { label: "Symptoms", href: "/health/symptoms" },
  { label: "Lab Tests", href: "/health/lab-tests" },
  { label: "Calculators", href: "/health/health-calculators" },
  {
    label: "Blog",
    href: "/health/blog",
    description: "Long-form health guides",
    children: [
      { label: "All Articles", href: "/health/blog", description: "12 cornerstone guides" },
      { label: "Categories", href: "/health/blog/category", description: "Browse by topic" },
      { label: "Latest", href: "/health/blog/latest", description: "Newest guides first" },
      { label: "Trending", href: "/health/blog/trending", description: "Most read this week" },
      { label: "Disease Education", href: "/health/blog/category/disease-education" },
      { label: "Nutrition", href: "/health/blog/category/nutrition" },
      { label: "Ayurveda", href: "/health/blog/category/ayurveda" },
      { label: "Yoga", href: "/health/blog/category/yoga" },
    ],
  },
  {
    label: "Premium",
    href: "/health/premium",
    description: "Ad-free + meal plans",
    children: [
      { label: "Premium Plans", href: "/health/premium", description: "Ad-free + thali plans — ₹199/mo" },
      { label: "Deals", href: "/health/deals", description: "Health product deals & coupons" },
      { label: "Sign in", href: "/health/login", description: "Google or email link" },
      { label: "Profile", href: "/health/profile", description: "Your account & premium status" },
    ],
  },
  { label: "Products", href: "/health/products" },
];

export const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Conditions",
    links: [
      { label: "All Diseases", href: "/health/diseases" },
      { label: "Diabetes", href: "/health/diseases/type-2-diabetes" },
      { label: "Blood Pressure", href: "/health/diseases/high-blood-pressure" },
      { label: "Thyroid", href: "/health/diseases/hypothyroidism" },
      { label: "PCOS", href: "/health/diseases/pcos" },
      { label: "Symptoms", href: "/health/symptoms" },
    ],
  },
  {
    title: "Traditional",
    links: [
      { label: "Ayurveda", href: "/health/ayurveda" },
      { label: "All Herbs", href: "/health/herbs" },
      { label: "Ashwagandha", href: "/health/herbs/ashwagandha" },
      { label: "Turmeric", href: "/health/herbs/turmeric" },
      { label: "Homeopathy", href: "/health/homeopathy" },
      { label: "Yoga & Fitness", href: "/health/yoga" },
    ],
  },
  {
    title: "Modern Care",
    links: [
      { label: "Medicines", href: "/health/medicines" },
      { label: "Lab Tests", href: "/health/lab-tests" },
      { label: "HbA1c", href: "/health/lab-tests/hba1c" },
      { label: "Calculators", href: "/health/health-calculators" },
      { label: "Recipes", href: "/health/recipes" },
    ],
  },
  {
    title: "Nutrition",
    links: [
      { label: "Nutrition Portal", href: "/health/nutrition" },
      { label: "Diet Plans", href: "/health/diet" },
      { label: "Diabetes Diet", href: "/health/diet" },
      { label: "Heart Diet", href: "/health/diet" },
      { label: "Products", href: "/health/products" },
    ],
  },
  {
    title: "Developers & API",
    links: [
      { label: "API Platform", href: "/health/developers" },
      { label: "API Reference", href: "/health/developers/docs" },
      { label: "API Keys", href: "/health/developers/dashboard" },
      { label: "API Directory", href: "/health/api-directory" },
      { label: "OpenAPI Spec", href: "/health/api/v1/openapi.json" },
      { label: "Provider Status", href: "/health/api/health/providers" },
    ],
  },
  {
    title: "News & Company",
    links: [
      { label: "Health News", href: "/health/news" },
      { label: "RSS Feed", href: "/health/news/rss.xml" },
      { label: "About", href: "/health/about" },
      { label: "Contact", href: "/health/contact" },
      { label: "Blog", href: "/health/blog" },
      { label: "Privacy", href: "/health/privacy" },
      { label: "Terms", href: "/health/terms" },
      { label: "Disclaimer", href: "/health/disclaimer" },
      { label: "Affiliate Disclosure", href: "/health/affiliate-disclosure" },
    ],
  },
];

export const EXAMPLE_SEARCHES = [
  "Diabetes",
  "Blood Pressure",
  "Thyroid",
  "PCOS",
  "Acidity",
  "Fatty Liver",
  "Vitamin D",
  "Karela",
  "Ashwagandha",
  "Metformin",
  "Pushup",
  "Apple barcode",
  "Atorvastatin",
  "PubMed diabetes",
];

export const SEARCH_PLACEHOLDER =
  "Search disease, symptom, medicine, herb, test or nutrition topic…";
