export const SITE = {
  name: "Bharat Health Guide",
  shortName: "BHG",
  tagline: "Indian Health Knowledge — Modern Medicine, Ayurveda, Nutrition & Traditional Wellness",
  heroTitle: "Understand Your Health. Make Better Decisions.",
  heroSubtitle:
    "Evidence-informed health information combined with Indian Ayurveda, nutrition, lifestyle and modern medical knowledge.",
  // Same origin as the Royal Fitness Club site; every health route lives under /health.
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.royalfitnesclub.in").replace(/\/$/, ""),
  locale: "en-IN",
  language: "en",
  // Public contact address; set NEXT_PUBLIC_CONTACT_EMAIL. Without it the contact page shows the gym phone only.
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  contactPhone: "+91 88518 30081",
  // Who runs the health guides. Mirrors the gym's business details (a test keeps them equal), so
  // the name, address and phone read the same on every page, as Google Business Profile expects.
  operator: {
    name: "Royal Fitness Club",
    address: "Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida, Uttar Pradesh 201304",
    phone: "+91 88518 30081",
  },
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
    description: "In-depth condition guides",
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
    label: "Health Tools",
    href: "/health/thali-builder",
    description: "Free tools made for Indian food and health",
    children: [
      { label: "Thali Builder", href: "/health/thali-builder", description: "Build a balanced Indian thali" },
      { label: "Millet Swap", href: "/health/millet-swap", description: "Swap white rice for millets" },
      { label: "Diabetes + Anemia Risk", href: "/health/india-risk", description: "IDRS score and anemia check" },
      { label: "Herb-Drug Checker", href: "/health/herb-interaction", description: "Ayurveda + allopathy safety" },
      { label: "Dosha Meals", href: "/health/dosha-meals", description: "Vata, pitta, kapha meal ideas" },
      { label: "Fasting Planner", href: "/health/fasting-planner", description: "Ekadashi, Navratri, intermittent" },
      { label: "Yoga Timer", href: "/health/yoga-timer", description: "Pranayama + Surya Namaskar" },
      { label: "Ritucharya", href: "/health/ritucharya", description: "Seasonal routine with live weather" },
      { label: "Child Growth", href: "/health/child-growth", description: "Height and weight vs WHO median" },
      { label: "Live Advisory", href: "/health/live-advisory", description: "Weather, UV and seasonal alerts" },
      { label: "Food Database", href: "/health/food-database", description: "Packaged foods by name or barcode" },
      { label: "Barcode Scanner", href: "/health/barcode-scanner", description: "Check a packaged food" },
      { label: "Nutrition Tracker", href: "/health/nutrition-tracker", description: "Log today's food" },
      { label: "Hinglish Search", href: "/health/hinglish-search", description: "Search in Hindi or Hinglish" },
      { label: "Exercise Library", href: "/health/exercises", description: "Exercises with steps" },
      { label: "Drug Lookup", href: "/health/drug-lookup", description: "Medicine information" },
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
      { label: "Premium Plans", href: "/health/premium", description: "Coming soon — join the waitlist" },
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
