// One caption format for every automated Instagram and Facebook post (the daily Reel, the
// month plan's cards and second Reel): a hook, a short description, the key points, the call to
// action, how to reach the gym, a plain-words keyword line (Instagram search reads captions) and
// a balanced hashtag set. Pure, so the format can be tested.

export type CaptionInput = {
  hook: string;
  /** One short paragraph: what this is and why it matters. */
  description: string;
  /** Key points, one per line. */
  points?: string[];
  takeaway?: string;
  source?: string;
  /** Health posts: the "not medical advice" line. */
  medicalNote?: string;
  /** The call to action, without the link. */
  cta: string;
  /** Facebook: the tracked link. Instagram captions can't hold links, so they point to the bio. */
  link?: string;
  /** Search phrases for this topic, in plain words ("protein for vegetarians"). */
  keywords: string[];
  /** Topic hashtags without '#'. */
  tags: string[];
};

export type CaptionBiz = { name: string; phone: string; coach: string; address?: string };

/** Always on: who we are and where. */
const BRAND_TAGS = ["RoyalFitnessClub", "CoachAman"];
const LOCAL_TAGS = ["NoidaGym", "GymInNoida", "Sector93Noida", "NoidaFitness"];
const BROAD_TAGS = ["FitnessIndia", "GymLife", "HealthyLifestyle"];
/** Instagram allows 30; past ~15 they read as spam and add nothing. */
export const MAX_TAGS = 15;
const LOCAL_KEYWORDS = ["Gym in Sector 93 Noida", "Gym near Gejha Village"];

const clean = (t: string) => t.replace(/[^A-Za-z0-9]/g, "");

/** Brand, local, topic and broad tags, without duplicates, at most MAX_TAGS. */
export function hashtags(topic: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...BRAND_TAGS, ...topic.slice(0, 6), ...LOCAL_TAGS, ...BROAD_TAGS].map(clean)) {
    const key = t.toLowerCase();
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(`#${t}`);
  }
  return out.slice(0, MAX_TAGS);
}

export function socialCaption(input: CaptionInput, biz: CaptionBiz, channel: "instagram" | "facebook"): string {
  const phone = biz.phone.replace(/^\+91\s*/, "");
  const blocks = [
    input.hook,
    input.description,
    input.points?.length ? input.points.map((p) => `✅ ${p}`).join("\n") : "",
    input.takeaway ? `💡 ${input.takeaway}` : "",
    [input.source ? `📚 Source: ${input.source}` : "", input.medicalNote ? `⚠️ ${input.medicalNote}` : ""].filter(Boolean).join("\n"),
    [
      `👉 ${input.cta}`,
      channel === "instagram" ? "📲 Tap the link in bio to book or buy." : input.link ? `🔗 ${input.link}` : "",
      `📞 Call or WhatsApp ${phone}`,
      "💾 Save this · Share it with your gym buddy",
    ]
      .filter(Boolean)
      .join("\n"),
    `🔎 ${[...input.keywords.slice(0, 4), ...LOCAL_KEYWORDS].join(" · ")}`,
    `— ${biz.coach}, ${biz.name}\n📍 ${biz.address || "Gejha Village, Sector 93, Noida"}`,
    hashtags(input.tags).join(" "),
  ];
  return blocks.filter(Boolean).join("\n\n");
}

/** Search phrases per post category or card series (what people type into Instagram search). */
const KEYWORDS: Record<string, string[]> = {
  "Fat loss": ["Fat loss tips", "Weight loss diet India"],
  "Muscle gain": ["Muscle gain tips", "Gym workout plan"],
  "Health & diet": ["Healthy Indian diet", "Diet for health conditions"],
  "Women's health": ["Women's fitness", "PCOS diet and exercise"],
  Supplements: ["Supplements explained", "Supplement store Noida"],
  "Food facts": ["Indian food facts", "Healthy eating tips"],
  Recovery: ["Muscle recovery tips", "Sleep and fitness"],
  Offer: ["Gym membership Noida", "Gym offer Noida"],
  Shop: ["Online diet plan India", "Fitness coaching online"],
  "ROYAL PROGRAMS": ["Gym workout plan", "Workout routine for beginners", "Strength training"],
  "STRENGTH SCIENCE": ["Strength training tips", "How to build muscle"],
  "TRAINING TOOLS": ["Strength training tips", "How to build muscle"],
  "FORM CHECK": ["Exercise form tips", "Gym technique"],
  "DESI NUTRITION": ["Indian diet plan", "Healthy Indian food"],
  "NUTRITION SCIENCE": ["Protein intake", "Diet plan for gym"],
  "FAT LOSS SCIENCE": ["Fat loss tips", "Calorie deficit explained"],
  "CARDIO SCIENCE": ["Cardio for fat loss", "Heart rate zones"],
  "DAILY BASICS": ["Healthy habits", "Fitness tips India"],
  "SMART HABITS": ["Healthy habits", "Fitness tips India"],
  "SMART SHOPPING": ["Healthy grocery shopping", "Food label reading"],
  "HEALTH CHECK": ["Healthy lifestyle tips", "Exercise for health"],
  "HEALTH & TRAINING": ["Exercise with thyroid", "Healthy lifestyle tips"],
  "WOMEN'S HEALTH": ["Women's fitness", "PCOS diet and exercise"],
  RECOVERY: ["Muscle recovery tips", "Rest day routine"],
  "GYM TRUTHS": ["Gym for beginners", "Gym membership Noida"],
  "SUPPLEMENT TRUTH": ["Supplements explained", "Whey protein facts"],
};
export const keywordsFor = (key: string): string[] => [...(KEYWORDS[key] ?? []), "Personal trainer Noida"];

/** A one-line description for daily tip posts, by category. */
const TIP_INTRO: Record<string, string> = {
  "Fat loss": "Honest fat-loss advice that works with Indian food, from the gym floor at Royal Fitness Club.",
  "Muscle gain": "What actually builds muscle, explained simply by Coach Aman.",
  "Health & diet": "Food and exercise that support your health, explained in plain words.",
  "Women's health": "Fitness and food advice for women, explained in plain words.",
  Supplements: "Supplements explained honestly: what helps, what's hype.",
  "Food facts": "Everyday Indian food facts, without the myths.",
  Recovery: "Recovery is part of training. Here's how to do it right.",
};
export const tipIntro = (category: string) => TIP_INTRO[category] ?? "A quick, practical tip from Coach Aman at Royal Fitness Club.";
