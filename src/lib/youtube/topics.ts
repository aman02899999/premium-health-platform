// Topics for the YouTube channel: each one is a public playlist on YouTube, and the same words
// decide which video a health page or blog post on the site shows. A video or page belongs to a
// topic when its title or tags contain one of the topic's words (whole words, any case).
// Add a word here and both the playlists and the site embeds pick it up.

export type TopicKey = "myths" | "weight" | "diet" | "bp-heart" | "diabetes" | "workout" | "supplements" | "supplement-series" | "lab-series" | "pain-age" | "sleep" | "lifestyle";

export type Topic = { key: TopicKey; title: string; description: string; words: string[] };

const GYM = "Royal Fitness Club, Sector 93 Noida. Coach Aman Sharma. Education only, not medical advice.";

export const TOPICS: Topic[] = [
  {
    key: "myths",
    title: "Fitness Myths vs Facts (Hinglish)",
    description: `Gym, diet aur health ke jhooth, har ek ka sach source ke saath. ${GYM}`,
    words: ["myth", "myths", "jhooth", "rumour", "rumours", "forward", "forwards", "hack", "hacks", "viral"],
  },
  {
    key: "weight",
    title: "Weight Loss & Fat Loss Tips (Hindi)",
    description: `Pet ki charbi, weight loss aur fat loss ki seedhi baat, bina shortcut. ${GYM}`,
    words: ["weight loss", "fat loss", "lose weight", "belly fat", "belly", "charbi", "obesity", "motapa", "fat burn", "fat burner", "fat cutter", "weight gain", "overweight"],
  },
  {
    key: "diet",
    title: "Desi Diet & Healthy Food (Hindi)",
    description: `Roz ki thali, desi khana aur healthy swaps, WHO aur ICMR ke facts ke saath. ${GYM}`,
    words: ["diet", "food", "foods", "thali", "khana", "khaayein", "roti", "chawal", "ghee", "fruit", "juice", "salt", "namak", "sugar-free", "nutrition", "meal", "breakfast", "snack", "processed", "vegetarian", "fermented", "paani", "water", "drinks", "coffee", "energy drink", "chai"],
  },
  {
    key: "bp-heart",
    title: "BP, Heart & Cholesterol (Hindi)",
    description: `High BP, heart aur cholesterol: kya karein, kya nahi. ${GYM}`,
    words: ["bp", "blood pressure", "hypertension", "heart", "heart attack", "cholesterol", "lipid", "dil", "cardiac", "stroke"],
  },
  {
    key: "diabetes",
    title: "Diabetes & Blood Sugar (Hindi)",
    description: `Diabetes aur blood sugar ke myths aur sach, aasaan Hinglish mein. ${GYM}`,
    words: ["diabetes", "diabetic", "blood sugar", "sugar level", "prediabetes", "insulin", "madhumeh", "hba1c", "semaglutide"],
  },
  {
    key: "workout",
    title: "Workouts & Gym Form (Hindi)",
    description: `Ghar aur gym ke workouts, sahi form aur common galtiyan. ${GYM}`,
    words: ["workout", "workouts", "exercise", "exercises", "gym", "form", "squat", "squats", "push-up", "pushup", "plank", "cardio", "walking", "steps", "treadmill", "strength", "muscle", "training", "stamina"],
  },
  {
    key: "supplements",
    title: "Supplements: Sach ya Jhooth",
    description: `Protein powder, creatine, fat burner aur pills ka honest sach. ${GYM}`,
    words: ["supplement", "supplements", "creatine", "whey", "protein powder", "fat burner", "pills", "multivitamin", "steroid", "steroids", "bcaa", "glutamine", "pre-workout", "mass gainer", "l-carnitine", "carnitine", "collagen", "omega-3", "fish oil", "ashwagandha", "shilajit"],
  },
  {
    // The Supplement Myth Buster series (Dec 2026): every video in it carries this tag.
    key: "supplement-series",
    title: "Supplement Myth Buster: Sach ya Jhooth (Hinglish)",
    description: `Whey, mass gainer, BCAA, pre-workout, fat burner, vitamins, omega-3, collagen: har supplement ka myth, science aur desi food swap, sources ke saath. ${GYM}`,
    words: ["supplement myth buster"],
  },
  {
    // The Lab Ke Andar series (Dec 2026): every video in it carries this tag.
    key: "lab-series",
    title: "Lab Ke Andar: Blood Test Report Samjho (Hinglish)",
    description: `Blood test ki report, beginner se advanced: CBC, sugar, lipid, thyroid, vitamin D aur B12, liver aur aage. Har episode sources ke saath. ${GYM}`,
    words: ["lab ke andar"],
  },
  {
    key: "pain-age",
    title: "Back Pain, Knee Pain & 60+ Fitness",
    description: `Kamar dard, ghutna dard aur 60 ke baad fitness, safe tareeke se. ${GYM}`,
    words: ["back pain", "kamar", "knee", "knee pain", "ghutna", "joint", "joints", "after 60", "60+", "elderly", "arthritis", "osteoarthritis", "sarcopenia", "after 40", "posture", "60 ke baad", "seniors", "mummy-papa", "girne"],
  },
  {
    key: "sleep",
    title: "Sleep, Stress & Recovery",
    description: `Neend, stress aur recovery: fitness ka chhupa hissa. ${GYM}`,
    words: ["sleep", "neend", "insomnia", "stress", "burnout", "recovery", "rest day"],
  },
  {
    key: "lifestyle",
    title: "Thyroid, PCOS, Anaemia & Lifestyle Health",
    description: `Thyroid, PCOS, anaemia, pollution, alcohol-tobacco aur bachchon ki fitness. ${GYM}`,
    words: ["thyroid", "pcos", "pcod", "anaemia", "anemia", "iron", "b12", "pollution", "aqi", "alcohol", "tobacco", "smoking", "kids", "children", "bachche", "bachchon", "cancer", "uric acid", "gout", "fatty liver", "liver"],
  },
];

/** The extra playlist every long video goes into, so Shorts viewers find the full guides. */
export const LONG_PLAYLIST = {
  key: "long",
  title: "Full Videos: Hinglish Health Guides",
  description: `4–5 minute ki poori videos: har myth ka sach, chapters aur sources ke saath. ${GYM}`,
} as const;

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATTERNS = new Map(TOPICS.map((t) => [t.key, t.words.map((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(w)}(?=$|[^\\p{L}\\p{N}])`, "iu"))]));

/**
 * How many of each topic's words appear in the text, best first; topics with no hit are left out.
 * On a tie the topic named first in the text wins (titles lead with their subject).
 */
export function topicScores(text: string): { key: TopicKey; hits: number }[] {
  const t = text.toLowerCase();
  return TOPICS.map((topic) => {
    let hits = 0;
    let first = Infinity;
    for (const re of PATTERNS.get(topic.key)!) {
      const m = re.exec(t);
      if (m) {
        hits++;
        first = Math.min(first, m.index);
      }
    }
    return { key: topic.key, hits, first };
  })
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.first - b.first)
    .map(({ key, hits }) => ({ key, hits }));
}

const SERIES = new Set<TopicKey>(["supplement-series", "lab-series"]);

/**
 * The playlists a video goes into: its two strongest subject topics, plus "myths" when it is a
 * myth-buster. Capped so each video costs little of the daily YouTube quota.
 */
export function videoTopics(text: string): TopicKey[] {
  const scores = topicScores(text);
  const subjects = scores.filter((s) => s.key !== "myths" && !SERIES.has(s.key)).slice(0, 2).map((s) => s.key);
  // A series playlist is always added when its tag is there, so every episode lands in it.
  const series = scores.filter((s) => SERIES.has(s.key)).map((s) => s.key);
  return [...subjects, ...series, ...(scores.some((s) => s.key === "myths") ? (["myths"] as TopicKey[]) : [])];
}

/** Tags every video carries (gym name, place, channel), which say nothing about the subject. */
const GENERIC_TAG = /noida|royal fitness|coach aman|^fitness$|fitness tips in hindi|hinglish fitness|^shorts$|^gym tips/i;

/** The text a video is classified by: its title and its own subject tags. */
export const videoText = (title: string, tags: string[] = []) => [title, ...tags.filter((t) => !GENERIC_TAG.test(t.trim()))].join(" · ");

export type Candidate ={ id: string; text: string; date: string };

/** Words too broad to decide a match on their own ("muscle" is in a sleep video and a strength guide). */
const BROAD_WORDS = new Set(["gym", "exercise", "exercises", "workout", "workouts", "training", "muscle", "strength", "form", "food", "foods", "diet", "khana", "meal", "nutrition", "heart", "stress"]);

/** The subject words (not "myth" words) found in the text, e.g. {"knee pain", "knee"}. */
export function subjectWords(text: string): Map<string, TopicKey> {
  const t = text.toLowerCase();
  const out = new Map<string, TopicKey>();
  for (const topic of TOPICS) {
    if (topic.key === "myths") continue;
    PATTERNS.get(topic.key)!.forEach((re, i) => {
      if (re.test(t)) out.set(topic.words[i], topic.key);
    });
  }
  return out;
}

/**
 * The best video for a page. The site is strict: the video must share an actual subject word with
 * the page's main subject (an anaemia page never gets the WhatsApp-forwards video just because both
 * sit in the "lifestyle" playlist). More shared words win, then the newest. Null when nothing fits,
 * because a wrong video is worse than none. `loose` (for "next video" links on YouTube, where some
 * link beats none) accepts any shared subject topic.
 */
export function bestVideoFor(pageText: string, candidates: Candidate[], opts: { loose?: boolean } = {}): Candidate | null {
  const page = topicScores(pageText).filter((s) => s.key !== "myths");
  if (!page.length) return null;
  const main = page[0].key;
  const pageKeys = new Set(page.map((s) => s.key));
  const pageWords = subjectWords(pageText);
  let best: { c: Candidate; score: number } | null = null;
  for (const c of candidates) {
    let score: number;
    if (opts.loose) {
      const keys = topicScores(c.text).filter((s) => s.key !== "myths").map((s) => s.key);
      const shared = keys.filter((k) => pageKeys.has(k)).length;
      if (!shared) continue;
      score = shared * 10 + (keys.includes(main) ? 6 : 0) + (keys[0] === main ? 3 : 0);
    } else {
      const words = [...subjectWords(c.text).keys()].filter((w) => pageWords.has(w));
      if (!words.some((w) => pageWords.get(w) === main && !BROAD_WORDS.has(w))) continue;
      score = words.length;
    }
    if (!best || score > best.score || (score === best.score && c.date > best.c.date)) best = { c, score };
  }
  return best?.c ?? null;
}
