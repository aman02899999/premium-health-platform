import type { SiteContent } from "./types";
import { DEFAULT_POSTS } from "./default-posts";

// Seed content used until the admin saves their own. Facts about the gym come
// from its public listings (Google Business Profile, Justdial, Instagram).
// Anything the owner should confirm — prices, trainers, hours — is editable
// in /admin and is phrased so it does not over-promise.

export const DEFAULT_CONTENT: SiteContent = {
  business: {
    name: "Royal Fitness Club",
    shortName: "Royal Fitness",
    tagline: "Train Like Royalty in Sector 93, Noida",
    description:
      "Royal Fitness Club is a fully air-conditioned gym in Gejha, Sector 93, Noida with certified trainers, modern strength and cardio equipment, personal training, fat-loss and muscle-gain programs. Serving the neighbourhood since 2019.",
    foundedYear: 2019,
    phone: "+91 97115 67475",
    altPhone: "+91 99537 77734",
    whatsapp: "919711567475",
    email: "",
    instagram: "royalfitness93_",
    googleMapsUrl: "https://www.google.com/maps?cid=9789213701935789540",
    googleReviewUrl: "https://www.google.com/maps?cid=9789213701935789540",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=Royal%20Fitness%20Club%2C%20Gejha%2C%20Sector%2093%2C%20Noida&z=16&output=embed",
    address: {
      street: "Main Road, near Gali No. 3, Gejha Village",
      locality: "Sector 93",
      city: "Noida",
      region: "Uttar Pradesh",
      postalCode: "201304",
      country: "IN",
    },
    geo: { lat: 28.5234, lng: 77.3833 },
    hours: [
      { days: "Monday – Friday", open: "06:00", close: "22:00" },
      { days: "Saturday – Sunday", open: "08:00", close: "20:00" },
    ],
    rating: { value: 4.7, count: 303, source: "Justdial" },
    priceRange: "₹₹",
  },
  hero: {
    eyebrow: "Sector 93 · Noida · Since 2019",
    title: "Build a body",
    highlight: "worthy of the crown",
    subtitle:
      "Certified trainers, heavy-duty strength floor, cardio zone and fully air-conditioned space — right on Gejha Main Road. Your first session is on us.",
    primaryCta: "Book a Free Trial",
    secondaryCta: "See Membership Plans",
    image: "",
  },
  stats: [
    { value: 2019, suffix: "", label: "Serving Noida since" },
    { value: 4.7, suffix: "★", label: "Average rating" },
    { value: 303, suffix: "+", label: "Member reviews" },
    { value: 7, suffix: " days", label: "Open every week" },
  ],
  programs: [
    {
      id: "strength",
      title: "Strength & Bodybuilding",
      icon: "Dumbbell",
      summary: "Progressive-overload programming on free weights, racks and machines for real, visible muscle.",
      points: ["Split routines by goal", "Form checks on every big lift", "Monthly progress tracking"],
      image: "",
    },
    {
      id: "fat-loss",
      title: "Fat Loss & Transformation",
      icon: "Flame",
      summary: "Structured fat-loss blocks mixing weights, HIIT and a practical Indian diet guide.",
      points: ["Calorie & macro targets", "Weekly weigh-ins", "Home-food friendly diet charts"],
      image: "",
    },
    {
      id: "personal-training",
      title: "Personal Training",
      icon: "UserCheck",
      summary: "One-on-one coaching with a certified trainer who plans, spots and pushes every session.",
      points: ["Custom plan for your body", "Injury-aware exercise choice", "Accountability that works"],
      image: "",
    },
    {
      id: "cardio",
      title: "Cardio & Conditioning",
      icon: "HeartPulse",
      summary: "Treadmills, cycles and cross-trainers plus circuits that build stamina and heart health.",
      points: ["Heart-rate zone training", "Circuit & functional sessions", "Endurance for sports"],
      image: "",
    },
    {
      id: "diet",
      title: "Diet & Nutrition Guidance",
      icon: "Salad",
      summary: "Veg and non-veg Indian meal plans built around ghar ka khana — no fad diets.",
      points: ["Protein targets for vegetarians", "Supplement advice without upselling", "Simple meal swaps"],
      image: "",
    },
    {
      id: "women",
      title: "Women's Fitness",
      icon: "Sparkles",
      summary: "Safe, supportive training for toning, strength, PCOS-friendly fat loss and posture.",
      points: ["Beginner-friendly progressions", "Guided strength training", "Comfortable, CCTV-secured space"],
      image: "",
    },
  ],
  plans: [
    {
      id: "monthly",
      name: "Monthly",
      duration: "1 month",
      price: 1200,
      originalPrice: 1500,
      perks: ["Full gym floor access", "Cardio zone", "General trainer guidance", "Locker access"],
      featured: false,
    },
    {
      id: "quarterly",
      name: "Quarterly",
      duration: "3 months",
      price: 3000,
      originalPrice: 4500,
      perks: ["Everything in Monthly", "Basic diet chart", "Body composition check-in", "Freeze up to 7 days"],
      featured: false,
    },
    {
      id: "half-yearly",
      name: "Half-Yearly",
      duration: "6 months",
      price: 5000,
      originalPrice: 9000,
      perks: ["Everything in Quarterly", "Personalised workout plan", "Monthly progress review", "Freeze up to 15 days"],
      featured: true,
    },
    {
      id: "yearly",
      name: "Annual Royal",
      duration: "12 months",
      price: 8000,
      originalPrice: 18000,
      perks: ["Everything in Half-Yearly", "Custom diet plan", "2 PT sessions / month", "Freeze up to 30 days"],
      featured: false,
    },
  ],
  planNote:
    "Prices are indicative and may change with seasonal offers. Call or WhatsApp us for today's best price — personal training is quoted separately.",
  trainers: [
    {
      id: "head-coach",
      name: "Mohit Nagar",
      role: "Founder",
      bio: "Started Royal Fitness Club in 2019 to give Gejha and Sector 93 a serious, well-equipped neighbourhood gym.",
      image: "",
      specialties: ["Strength", "Body transformation", "Nutrition"],
      instagram: "royalfitness93_",
    },
  ],
  gallery: [
    { id: "g1", title: "Strength Floor", caption: "Racks, benches and a full dumbbell line-up", image: "" },
    { id: "g2", title: "Cardio Zone", caption: "Treadmills, cycles and cross-trainers", image: "" },
    { id: "g3", title: "Machines", caption: "Selectorised machines for every muscle group", image: "" },
    { id: "g4", title: "Transformations", caption: "Real members, real results", image: "" },
    { id: "g5", title: "Personal Training", caption: "Certified coaches on the floor", image: "" },
    { id: "g6", title: "Community", caption: "Train together, grow together", image: "" },
  ],
  testimonials: [],
  faqs: [
    {
      id: "trial",
      q: "Can I try the gym before joining?",
      a: "Yes. Book a free trial session using the form or WhatsApp us — a trainer will show you around and take you through a workout.",
    },
    {
      id: "location",
      q: "Where exactly is Royal Fitness Club?",
      a: "We are on Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304 — easy to reach from Sector 93A, 93B, Gejha, Sector 100 and the Noida Expressway side.",
    },
    {
      id: "timings",
      q: "What are the gym timings?",
      a: "Monday to Friday 6:00 AM – 10:00 PM and Saturday–Sunday 8:00 AM – 8:00 PM. Timings can change on festivals, so check our Instagram or call before visiting.",
    },
    {
      id: "beginner",
      q: "I have never been to a gym. Is it okay for beginners?",
      a: "Absolutely. Most members start as beginners. Our certified trainers teach form first, start you on light loads and progress you safely.",
    },
    {
      id: "ac",
      q: "Is the gym air-conditioned and safe?",
      a: "Yes — the whole floor is air-conditioned, CCTV-monitored and has a marked emergency exit.",
    },
    {
      id: "diet",
      q: "Do you provide diet plans?",
      a: "Quarterly and longer memberships include diet guidance built around normal Indian home food, for both vegetarians and non-vegetarians.",
    },
  ],
  posts: DEFAULT_POSTS,
  seo: {
    title: "Royal Fitness Club — Best Gym in Sector 93, Noida",
    description:
      "Royal Fitness Club, Gejha Sector 93 Noida: AC gym with certified trainers, personal training, fat loss & muscle gain programs. Rated 4.7★ by 300+ members. Book a free trial.",
    keywords: [
      "gym in sector 93 noida",
      "gym near me noida",
      "best gym in noida",
      "royal fitness club noida",
      "gym in gejha",
      "personal trainer noida",
      "fat loss gym noida",
      "gym near sector 93a",
      "gym near sector 100 noida",
      "women gym noida",
    ],
    ogImage: "",
    googleVerification: "",
  },
  theme: { gold: "#d4a94a", accent: "#e23b3b" },
  announcement: "Free trial session for new members — book on WhatsApp today!",
};
