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
  "long-website-tour": "वेबसाइट कैसे इस्तेमाल करें",
  "long-tools-guide-1": "20 फ्री फिटनेस टूल्स",
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
  "long-fake-supplement-myths-41": "नकली सप्लीमेंट कैसे पहचानें",
  "long-omega-collagen-myths-40": "ओमेगा-3, कोलेजन, मैग्नीशियम: 4 झूठ",
  "short-supp-collagen": "कोलेजन से नए घुटने?",
  "short-supp-omega3-alsi": "अलसी = फ़िश ऑयल?",
  "long-vitamin-myths-39": "विटामिन के 4 झूठ: D, B12, मल्टी",
  "short-supp-veg-b12": "वेज लोगों को B12 नहीं मिलता?",
  "short-supp-vitamin-d": "खिड़की की धूप से विटामिन D?",
  "short-supp-multivitamin": "मल्टीविटामिन = सेहत का बीमा?",
  "long-fat-burner-myths-38": "फ़ैट बर्नर के 4 झूठ",
  "short-supp-l-carnitine": "एल-कार्निटीन से चर्बी गायब?",
  "short-supp-pre-workout": "प्री-वर्कआउट का सच",
  "long-bcaa-preworkout-myths-37": "BCAA, ग्लूटामीन, प्री-वर्कआउट: 4 झूठ",
  "short-supp-glutamine": "ग्लूटामीन से रिकवरी डबल?",
  "short-supp-bcaa": "BCAA ज़रूरी है?",
  "short-supp-mass-gainer": "मास गेनर के बिना वज़न?",
  "long-whey-gainer-myths-36": "व्हे और मास गेनर: 5 झूठ",
  "short-supp-fake-whey-test": "असली व्हे का घरेलू टेस्ट?",
  "short-supp-whey-steroid": "व्हे = स्टेरॉयड? सच",
  "short-promo-diet-after-trial": "ट्रायल के बाद क्या?",
  "promo-diet-after-trial": "ट्रायल के बाद क्या?",
  "short-promo-lib-mind": "मज़बूत बॉडी, मज़बूत माइंड",
  "promo-lib-mind": "मज़बूत बॉडी, मज़बूत माइंड",
  "short-promo-diet-bengali-fish": "माछ-भात के साथ फ़ैट लॉस",
  "promo-diet-bengali-fish": "माछ-भात के साथ फ़ैट लॉस",
  "short-promo-lib-yoga": "योग कहाँ से शुरू करें?",
  "promo-lib-yoga": "योग कहाँ से शुरू करें?",
  "short-promo-lib-smart-nutrition": "सप्लीमेंट या स्कैम?",
  "promo-lib-smart-nutrition": "सप्लीमेंट या स्कैम?",
  "short-promo-lib-muscle": "मसल कैसे बढ़ती है",
  "promo-lib-muscle": "मसल कैसे बढ़ती है",
  "short-promo-lib-indian-food": "देसी खाने से बॉडी",
  "promo-lib-indian-food": "देसी खाने से बॉडी",
  "short-promo-lib-health": "शुगर, बीपी, पीसीओएस में एक्सरसाइज़",
  "promo-lib-health": "शुगर, बीपी, पीसीओएस में एक्सरसाइज़",
  "short-promo-lib-habits": "मोटिवेशन नहीं, सिस्टम",
  "promo-lib-habits": "मोटिवेशन नहीं, सिस्टम",
  "short-promo-lib-fat-loss": "फ़ैट लॉस जो टिके",
  "promo-lib-fat-loss": "फ़ैट लॉस जो टिके",
  "short-promo-lib-calm-sleep": "नींद नहीं आती?",
  "promo-lib-calm-sleep": "नींद नहीं आती?",
  "short-promo-lib-beginner": "जिम का पहला साल",
  "promo-lib-beginner": "जिम का पहला साल",
  "short-promo-diet-women-home": "महिलाओं के लिए घर पर फ़ैट लॉस",
  "promo-diet-women-home": "महिलाओं के लिए घर पर फ़ैट लॉस",
  "short-promo-diet-veg-fat-loss": "वेज फ़ैट लॉस डाइट प्लान",
  "promo-diet-veg-fat-loss": "वेज फ़ैट लॉस डाइट प्लान",
  "short-desi-habit-saunf": "खाने के बाद सौंफ क्यों",
  "short-desi-habit-walk": "खाने के बाद 10 मिनट वॉक",
  "short-desi-habit-badam": "भीगे बादाम का सच",
  "short-desi-habit-paani": "खाने के साथ पानी",
  "short-desi-science-gond-laddu": "गोंद के लड्डू का विज्ञान",
  "short-desi-science-food-synergy": "हल्दी काली मिर्च नींबू",
  "short-desi-science-joints": "घुटनों का दर्द सर्दी में",
  "short-desi-science-fibre-gut": "फाइबर और पेट के बैक्टीरिया",
  "short-promo-diet-trial-how": "₹49 डाइट ट्रायल: सैंपल प्लान",
  "promo-diet-trial-how": "₹49 डाइट ट्रायल: सैंपल प्लान",
  "short-promo-diet-south": "साउथ इंडियन डाइट प्लान",
  "promo-diet-south": "साउथ इंडियन डाइट प्लान",
  "short-promo-diet-office": "ऑफ़िस जॉब वालों का डाइट प्लान",
  "promo-diet-office": "ऑफ़िस जॉब वालों का डाइट प्लान",
  "short-promo-diet-jain": "जैन डाइट प्लान, प्रोटीन के साथ",
  "promo-diet-jain": "जैन डाइट प्लान, प्रोटीन के साथ",
  "short-promo-diet-egg-muscle": "दुबले हो? वेट गेन डाइट प्लान",
  "promo-diet-egg-muscle": "दुबले हो? वेट गेन डाइट प्लान",
  "short-promo-diet-40-bp": "40+ और हाई बीपी: डाइट प्लान",
  "promo-diet-40-bp": "40+ और हाई बीपी: डाइट प्लान",
  "long-cooking-oils-myths-35": "सरसों, घी या रिफ़ाइंड: 6 झूठ",
  "long-belly-fat-diet-34": "पेट की चर्बी कैसे कम करें",
  "long-lemon-honey-myths-33": "नींबू-शहद पानी के 5 झूठ",
  "long-gym-mistakes-32": "जिम की 6 बड़ी गलतियाँ",
  "long-sugar-swap-myths-31": "गुड़, शहद, स्टीविया: 6 झूठ",
  "long-desi-supplement-myths-30": "अश्वगंधा, शिलाजीत: 5 झूठ",
  "long-intermittent-fasting-myths-29": "इंटरमिटेंट फ़ास्टिंग के 5 झूठ",
  "long-roti-rice-myths-28": "रोटी या चावल: 5 झूठ",
  "long-egg-yolk-myths-27": "अंडे के 5 झूठ",
  "long-lab-ke-andar-1": "ब्लड टेस्ट रिपोर्ट कैसे पढ़ें",
  "short-lab-1-khoon-ka-safar": "ब्लड सैंपल लैब में कहाँ जाता है?",
  "short-lab-2-cbc": "सीबीसी रिपोर्ट कैसे पढ़ें",
  "short-lab-3-sugar": "शुगर के 3 टेस्ट",
  "short-lab-4-lipid": "कोलेस्ट्रॉल रिपोर्ट कैसे पढ़ें",
  "long-steroid-ka-sach-1": "स्टेरॉयड क्या है, कितनी किस्म",
  "short-steroid-1-doctor-vs-gym": "डॉक्टर का स्टेरॉयड बनाम जिम का स्टेरॉयड",
  "short-steroid-2-poori-list": "जिम के 9 कोर्स: पूरी लिस्ट और रिस्क",
  "short-steroid-3-natural-limit": "नेचुरल बॉडी की असली लिमिट",
  "long-steroid-ka-sach-2": "स्टेरॉयड से दिल, लिवर, हॉर्मोन",
  "short-steroid-4-dil": "स्टेरॉयड और दिल",
  "short-steroid-5-liver-goli": "स्टेरॉयड की गोली और लिवर",
  "short-steroid-6-hormone-wapas": "साइकिल के बाद हॉर्मोन वापस आता है?",
  "long-steroid-ka-sach-3": "रॉयड रेज, नकली स्टेरॉयड, सार्म्स",
  "short-steroid-7-dimaag": "रॉयड रेज और स्टेरॉयड की लत",
  "short-steroid-8-nakli": "ब्लैक मार्केट स्टेरॉयड: नकली या असली",
  "short-steroid-9-sarms": "सार्म्स सेफ हैं?",
  "long-steroid-ka-sach-4": "पेप्टाइड और ग्रोथ हॉर्मोन",
  "short-steroid-10-peptides": "बीपीसी 157 पेप्टाइड का सच",
  "short-steroid-11-gh": "ग्रोथ हॉर्मोन और एमके 677 का सच",
  "short-steroid-12-ab-kya-karein": "स्टेरॉयड ले चुके हो? अब क्या करें",
};

/** A long video's title, Hindi words first: "बीपी और दिल के 8 झूठ | BP Aur Dil Ke 8 Jhooth…". */
export function longTitleHindiFirst(id: string, title: string): string {
  const hi = LONG_HINDI[id];
  if (!hi) return title;
  for (const t of [`${hi} | ${title}`, `${hi} | ${title.split(" | ")[0]}`]) if ([...t].length <= 100) return t;
  return title;
}
