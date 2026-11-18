// Hindi-first packaging for new uploads (17 Nov 2026). The videos stay in Hinglish, but YouTube is
// told they are Hindi (defaultLanguage / defaultAudioLanguage "hi"), titles carry the Devanagari
// words people also search with, and long-video thumbnails get a big Devanagari headline. Written
// by hand, never machine-translated at upload time. Pure, so every title is tested for length.
import type { Short } from "./shorts-bank";

/** Upload language for every new video: the audience searches and listens in Hindi. */
export const UPLOAD_LANGUAGE = "hi";

// Search words in Devanagari, matched on a Short's topic and tags (first match wins, so the more
// specific ones come first).
const KEYWORDS: [RegExp, string][] = [
  [/belly fat|pet ki charbi|pet kam/i, "पेट की चर्बी"],
  [/weight loss|fat loss|motapa|obesity|fat burn|fat cutter/i, "वजन कम करें"],
  [/weight gain|mass gain/i, "वजन बढ़ाएं"],
  [/protein|paneer|egg|ande/i, "प्रोटीन"],
  [/diabetes|blood sugar|sugar/i, "शुगर"],
  [/\bbp\b|blood pressure|heart|dil/i, "बीपी और दिल"],
  [/cholesterol/i, "कोलेस्ट्रॉल"],
  [/sleep|neend/i, "नींद"],
  [/water|paani|hydration/i, "पानी"],
  [/walk|steps|walking/i, "पैदल चलना"],
  [/yoga/i, "योग"],
  [/supplement|creatine|whey|fat burner/i, "सप्लीमेंट"],
  [/diet|thali|roti|chawal|rice|ghee|food|khana|breakfast|dinner/i, "देसी डाइट"],
  [/push ?up|squat|plank|crunch|workout|exercise|home workout|gym/i, "वर्कआउट"],
  [/myth|viral|forward|trend/i, "सच या झूठ"],
];

/** The Devanagari search words for a Short, or null when none fits. */
export function hindiKeyword(s: Pick<Short, "topic" | "tags" | "hook">): string | null {
  const text = [s.topic, ...s.tags, s.hook].join(" · ");
  return KEYWORDS.find(([re]) => re.test(text))?.[1] ?? null;
}

/** "Hook | हिंदी #shorts" when it fits YouTube's 100 characters, else the plain title. */
export function withHindi(title: string, hindi: string | null, suffix = ""): string {
  if (!hindi) return `${title}${suffix}`;
  const t = `${title} | ${hindi}${suffix}`;
  return [...t].length <= 100 ? t : `${title}${suffix}`;
}

// Long videos from 18 Nov 2026 on: the thumbnail headline and the title words in Devanagari.
export const LONG_HINDI: Record<string, string> = {
  "long-kya-khaayein-lifestyle-9": "क्या खाएं? बीपी, शुगर, थायरॉइड",
  "long-ozempic-glp1-myths-15-v2": "ओज़ेम्पिक के 8 झूठ",
  "long-protein-myths-16-v2": "प्रोटीन के 6 झूठ",
  "long-women-weights-myths-17": "लड़कियाँ और वेट्स: 5 झूठ",
  "long-diet-trend-myths-18": "डाइट ट्रेंड्स के 6 झूठ",
  "long-steroid-myths-19": "स्टेरॉयड के 5 झूठ",
  "long-heart-gym-myths-20": "दिल और जिम: 5 झूठ",
  "long-apple-a-day-myths-21": "रोज़ एक सेब: 5 झूठ",
  "long-winter-myths-22": "सर्दी के 6 झूठ",
  "long-hair-fall-myths-23": "बाल झड़ने के 6 झूठ",
  "long-ghee-oil-myths-25": "घी और तेल के 6 झूठ",
  "long-belly-fat-myths-24": "पेट की चर्बी के 6 झूठ",
  "long-walking-myths-26": "वॉकिंग के 6 झूठ",
  "long-bp-heart-myths-8": "बीपी और दिल के 8 झूठ",
  "long-diabetes-myths-7": "डायबिटीज़ के 7 झूठ",
  "long-obesity-myths-7": "मोटापे के 7 झूठ",
  "long-alcohol-tobacco-myths-8": "शराब और सिगरेट के 8 झूठ",
  "long-anaemia-myths-6": "खून की कमी के 6 झूठ",
  "long-back-pain-myths-7": "कमर दर्द के 7 झूठ",
  "long-knee-pain-myths-7": "घुटने के दर्द के 7 झूठ",
  "long-after-60-myths-7": "60 के बाद फिटनेस के 7 झूठ",
  "long-air-pollution-myths-6": "प्रदूषण के 6 झूठ",
  "long-kids-fitness-myths-7": "बच्चों की फिटनेस के 7 झूठ",
  "long-new-year-myths-7": "नए साल के 7 झूठ",
};

/** A long video's title, Hindi words first: "बीपी और दिल के 8 झूठ | BP Aur Dil Ke 8 Jhooth…". */
export function longTitleHindiFirst(id: string, title: string): string {
  const hi = LONG_HINDI[id];
  if (!hi) return title;
  for (const t of [`${hi} | ${title}`, `${hi} | ${title.split(" | ")[0]}`]) if ([...t].length <= 100) return t;
  return title;
}
