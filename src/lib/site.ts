export const SITE = {
  name: "Bharat Health Guide",
  shortName: "BHG",
  tagline: "Indian Health Knowledge — Modern Medicine, Ayurveda, Nutrition & Traditional Wellness",
  heroTitle: "Understand Your Health. Make Better Decisions.",
  heroSubtitle:
    "Evidence-informed health information combined with Indian Ayurveda, nutrition, lifestyle and modern medical knowledge.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://bharathealthguide.in",
  locale: "en-IN",
  language: "en",
  contactEmail: "care@bharathealthguide.in",
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
  { label: "Home", href: "/" },
  {
    label: "Health News",
    href: "/news",
    description: "Daily medical & public-health briefings",
    children: [
      { label: "Today's Briefing", href: "/news" },
      { label: "All News", href: "/news" },
      { label: "Outbreak Advisories", href: "/news?c=Outbreak+Advisory" },
      { label: "Seasonal Care", href: "/news?c=Seasonal+Care" },
      { label: "Drug Safety", href: "/news?c=Drug+Safety" },
      { label: "RSS Feed", href: "/news/rss.xml" },
    ],
  },
  {
    label: "Diseases",
    href: "/diseases",
    description: "Understand 120+ conditions",
    children: [
      { label: "All Diseases", href: "/diseases" },
      { label: "Diabetes", href: "/diseases/type-2-diabetes" },
      { label: "High Blood Pressure", href: "/diseases/high-blood-pressure" },
      { label: "Thyroid", href: "/diseases/hypothyroidism" },
      { label: "PCOS", href: "/diseases/pcos" },
      { label: "Fatty Liver", href: "/diseases/fatty-liver" },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions",
    description: "Every condition, every treatment path",
    children: [
      { label: "Solution Finder", href: "/solutions" },
      { label: "Diabetes Solutions", href: "/diseases/type-2-diabetes" },
      { label: "BP Solutions", href: "/diseases/high-blood-pressure" },
      { label: "Symptom Checker", href: "/symptoms" },
      { label: "Calculators", href: "/health-calculators" },
    ],
  },
  {
    label: "Ayurveda",
    href: "/ayurveda",
    children: [
      { label: "Ayurveda Portal", href: "/ayurveda" },
      { label: "Dosha Basics", href: "/ayurveda/dosha-basics" },
      { label: "Dinacharya", href: "/ayurveda/dinacharya-daily-routine" },
      { label: "Panchakarma Guide", href: "/ayurveda/panchakarma-education" },
    ],
  },
  {
    label: "Herbs",
    href: "/herbs",
    children: [
      { label: "All Herbs", href: "/herbs" },
      { label: "Ashwagandha", href: "/herbs/ashwagandha" },
      { label: "Turmeric", href: "/herbs/turmeric" },
      { label: "Giloy", href: "/herbs/giloy" },
    ],
  },
  {
    label: "Medicines",
    href: "/medicines",
    children: [
      { label: "All Medicines", href: "/medicines" },
      { label: "Metformin", href: "/medicines/metformin" },
      { label: "Amlodipine", href: "/medicines/amlodipine" },
      { label: "Levothyroxine", href: "/medicines/levothyroxine" },
    ],
  },
  { label: "Homeopathy", href: "/homeopathy" },
  {
    label: "Nutrition",
    href: "/nutrition",
    children: [
      { label: "Nutrition Portal", href: "/nutrition" },
      { label: "Millets", href: "/nutrition/ragi-finger-millet" },
      { label: "Methi", href: "/nutrition/methi-fenugreek-seeds" },
      { label: "Oats", href: "/nutrition/oats" },
    ],
  },
  { label: "Diet Plans", href: "/diet" },
  { label: "Yoga & Fitness", href: "/yoga" },
  {
    label: "Health Data",
    href: "/health-search",
    description: "Unified search + live APIs",
    children: [
      { label: "Unified Search", href: "/health-search", description: "Diseases, drugs, food, exercises, herbs, research" },
      { label: "Food Database", href: "/food-database", description: "Open Food Facts + USDA + barcode" },
      { label: "Nutrition Tracker", href: "/nutrition-tracker", description: "Track calories, macros" },
      { label: "Exercise Library", href: "/exercises", description: "wger fitness exercises" },
      { label: "Workout Builder", href: "/workout-builder", description: "Build custom workouts" },
      { label: "Drug Lookup", href: "/drug-lookup", description: "openFDA + RxNorm + PubChem" },
      { label: "Research", href: "/api/health/medical-literature?q=diabetes", description: "PubMed live" },
      { label: "Trials", href: "/api/health/clinical-trials?q=diabetes", description: "ClinicalTrials.gov live" },
      { label: "Muscles", href: "/api/health/muscles", description: "wger muscles" },
      { label: "Equipment", href: "/api/health/equipment", description: "wger equipment" },
      { label: "Q&A (RAG)", href: "/health-qa", description: "Retrieval-first with citations — Unique" },
      { label: "Sync", href: "/api/health/sync", description: "Background sync jobs" },
      { label: "Providers", href: "/api/health/providers", description: "Provider status" },
      { label: "Health Status", href: "/api/health/status", description: "System health" },
      { label: "Admin", href: "/admin/health", description: "Health admin dashboard" },
    ],
  },
  {
    label: "Developers",
    href: "/developers",
    description: "Health data API — keys, quotas, docs",
    children: [
      { label: "API Platform", href: "/developers", description: "Plans, quickstart, 20 data sources" },
      { label: "API Reference", href: "/developers/docs", description: "Auth, quotas, error codes, samples" },
      { label: "API Keys", href: "/developers/dashboard", description: "Create, monitor and revoke keys" },
      { label: "API Directory", href: "/api-directory", description: "290 public APIs we track" },
      { label: "OpenAPI spec", href: "/api/v1/openapi.json", description: "Machine-readable definition" },
    ],
  },
  {
    label: "Unique India",
    href: "/thali-builder",
    description: "India-first unique features",
    children: [
      { label: "Thali Builder", href: "/thali-builder", description: "Balanced Indian thali — Unique" },
      { label: "Millet Swap Engine", href: "/millet-swap", description: "Rice/wheat → millets — Unique India" },
      { label: "IDRS + Anemia", href: "/india-risk", description: "IDRS diabetes + anemia — Unique India" },
      { label: "Yoga Timer", href: "/yoga-timer", description: "Pranayama + Surya Namaskar — Unique" },
      { label: "Ritucharya", href: "/ritucharya", description: "Seasonal planner + live weather — Unique" },
      { label: "Herb-Drug Checker", href: "/herb-interaction", description: "Ayurveda + allopathy safety — Unique" },
      { label: "Barcode Scanner", href: "/barcode-scanner", description: "890… OFF lookup — Unique" },
      { label: "Child Growth", href: "/child-growth", description: "WHO simplified — Unique India" },
      { label: "Health Q&A", href: "/health-qa", description: "RAG with citations — Unique" },
      { label: "Live Advisory", href: "/live-advisory", description: "Dengue/heat/UV live — Unique" },
      { label: "Dosha Meals", href: "/dosha-meals", description: "Vata/pitta/kapha meals — Unique" },
      { label: "Fasting Planner", href: "/fasting-planner", description: "Ekadashi/Navratri/IF — Unique" },
      { label: "Hinglish Search", href: "/hinglish-search", description: "EN/HI/Hinglish aliases — Unique" },
    ],
  },
  {
    label: "Wellness",
    href: "/mental-wellness",
    children: [
      { label: "Women's Health", href: "/womens-health" },
      { label: "Men's Health", href: "/mens-health" },
      { label: "Child Health", href: "/child-health" },
      { label: "Mental Wellness", href: "/mental-wellness" },
    ],
  },
  { label: "Symptoms", href: "/symptoms" },
  { label: "Lab Tests", href: "/lab-tests" },
  { label: "Calculators", href: "/health-calculators" },
  {
    label: "Blog",
    href: "/blog",
    description: "SEO optimized guides",
    children: [
      { label: "All Articles", href: "/blog", description: "12 cornerstone guides" },
      { label: "Categories", href: "/blog/category", description: "Browse by category — SEO" },
      { label: "Latest", href: "/blog/latest", description: "Fresh content — SEO freshness" },
      { label: "Trending", href: "/blog/trending", description: "Most read this week" },
      { label: "Disease Education", href: "/blog/category/disease-education" },
      { label: "Nutrition", href: "/blog/category/nutrition" },
      { label: "Ayurveda", href: "/blog/category/ayurveda" },
      { label: "Yoga", href: "/blog/category/yoga" },
    ],
  },
  {
    label: "Premium",
    href: "/premium",
    description: "Earning platform",
    children: [
      { label: "Premium Plans", href: "/premium", description: "Ad-free + thali plans — ₹199/mo" },
      { label: "Deals", href: "/deals", description: "Affiliate deals — earning" },
      { label: "How We Earn", href: "/earn", description: "5 pillars — transparent" },
      { label: "Login — SSO", href: "/login", description: "Google SSO optimized" },
      { label: "Profile", href: "/profile", description: "SSO account + earnings" },
    ],
  },
  { label: "Products", href: "/products" },
];

export const FOOTER_COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Conditions",
    links: [
      { label: "All Diseases", href: "/diseases" },
      { label: "Diabetes", href: "/diseases/type-2-diabetes" },
      { label: "Blood Pressure", href: "/diseases/high-blood-pressure" },
      { label: "Thyroid", href: "/diseases/hypothyroidism" },
      { label: "PCOS", href: "/diseases/pcos" },
      { label: "Symptoms", href: "/symptoms" },
    ],
  },
  {
    title: "Traditional",
    links: [
      { label: "Ayurveda", href: "/ayurveda" },
      { label: "All Herbs", href: "/herbs" },
      { label: "Ashwagandha", href: "/herbs/ashwagandha" },
      { label: "Turmeric", href: "/herbs/turmeric" },
      { label: "Homeopathy", href: "/homeopathy" },
      { label: "Yoga & Fitness", href: "/yoga" },
    ],
  },
  {
    title: "Modern Care",
    links: [
      { label: "Medicines", href: "/medicines" },
      { label: "Lab Tests", href: "/lab-tests" },
      { label: "HbA1c", href: "/lab-tests/hba1c" },
      { label: "Calculators", href: "/health-calculators" },
      { label: "Recipes", href: "/recipes" },
    ],
  },
  {
    title: "Nutrition",
    links: [
      { label: "Nutrition Portal", href: "/nutrition" },
      { label: "Diet Plans", href: "/diet" },
      { label: "Diabetes Diet", href: "/diet" },
      { label: "Heart Diet", href: "/diet" },
      { label: "Products", href: "/products" },
    ],
  },
  {
    title: "Developers & API",
    links: [
      { label: "API Platform", href: "/developers" },
      { label: "API Reference", href: "/developers/docs" },
      { label: "API Keys", href: "/developers/dashboard" },
      { label: "API Directory", href: "/api-directory" },
      { label: "OpenAPI Spec", href: "/api/v1/openapi.json" },
      { label: "Provider Status", href: "/api/health/providers" },
    ],
  },
  {
    title: "News & Company",
    links: [
      { label: "Health News", href: "/news" },
      { label: "RSS Feed", href: "/news/rss.xml" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
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
