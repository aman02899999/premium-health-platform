import { absoluteUrl } from "@/lib/site";
import type { Business } from "./types";

// Hindi copy for /hi/gym, the gym's page for people who search in Hindi. Facts (address, hours,
// phone, prices) are NOT written here: the page reads them from the live content, so this file only
// holds words. Keep claims to what the English pages already say.

export const HI_GYM = {
  path: "/hi/gym",
  title: "सेक्टर 93 नोएडा में जिम: रॉयल फिटनेस क्लब, पहला सेशन फ्री",
  description:
    "गेझा मेन रोड, सेक्टर 93 नोएडा में पूरा AC जिम, 2019 से। सर्टिफाइड ट्रेनर, फैट लॉस और मसल गेन प्रोग्राम, घर के खाने वाली डाइट। पहला सेशन फ्री, फिर प्लान चुनें।",
  eyebrow: "सेक्टर 93 · नोएडा · 2019 से",
  h1: "सेक्टर 93 नोएडा का",
  h1Highlight: "AC जिम",
  intro:
    "रॉयल फिटनेस क्लब गेझा मेन रोड पर है। यहाँ स्ट्रेंथ फ्लोर, कार्डियो ज़ोन और फ्लोर पर ट्रेनर हैं। पहला सेशन फ्री है, तो पैसे देने से पहले जिम खुद आकर देखिए।",
  why: [
    { t: "पूरा एयर-कंडीशन्ड फ्लोर", d: "स्ट्रेंथ और कार्डियो, दोनों एरिया साल भर AC में।" },
    { t: "हर प्लान में ट्रेनर फ्लोर पर", d: "एक्सरसाइज़ करते समय ट्रेनर आपका फॉर्म देखते और ठीक करते हैं।" },
    { t: "घर के खाने वाली डाइट गाइडेंस", d: "क्वार्टरली प्लान से डाइट गाइडेंस, दाल, रोटी, सब्ज़ी, पनीर, दही से।" },
    { t: "महिलाओं के लिए प्लान", d: "Female's Special प्लान और ट्रेनर जो आपके लेवल से शुरू कराते हैं।" },
  ],
  programs: [
    { href: "/programs/fat-loss", t: "फैट लॉस" },
    { href: "/programs/strength", t: "स्ट्रेंथ और मसल गेन" },
    { href: "/programs/women", t: "महिलाओं के लिए" },
    { href: "/programs/personal-training", t: "पर्सनल ट्रेनिंग" },
    { href: "/diet-plans", t: "डाइट प्लान" },
  ],
  faqs: [
    {
      q: "क्या पहले ट्रायल ले सकते हैं?",
      a: "हाँ, पहला सेशन फ्री है। अपने आम समय पर आइए, मशीनें और भीड़ देखिए, ट्रेनर से मिलिए, फिर प्लान चुनिए।",
    },
    {
      // "HOURS" is replaced on the page with hindiHours() of the saved hours.
      q: "जिम कब खुला रहता है?",
      a: "HOURS",
    },
    {
      q: "बिल्कुल नए हैं, क्या कर पाएँगे?",
      a: "हाँ। ट्रेनर हल्के वज़न से सही फॉर्म सिखाते हैं, ताकि शुरुआत सुरक्षित रहे। कोई बीमारी हो तो पहले बताइए, डॉक्टर की सलाह पहले मानी जाती है।",
    },
    {
      q: "कपल में जॉइन करें तो?",
      a: "दो लोग साथ जॉइन करें तो कपल प्राइस लगता है, जो दो अलग मेंबरशिप से कम है। सारे दाम ऊपर टेबल में हैं।",
    },
  ],
  guides: [
    { href: "/blog/gym-kaise-start-kare-beginners-guide-hindi", t: "जिम कैसे शुरू करें: पहले 30 दिन का प्लान" },
    { href: "/blog/sector-93-noida-mein-gym-kaise-chune", t: "सेक्टर 93 में सही जिम कैसे चुनें" },
    { href: "/blog/weight-loss-diet-plan-hindi-ghar-ka-khana", t: "घर के खाने से वज़न कम करने का डाइट प्लान" },
  ],
} as const;

/** The English home page and /hi/gym are language versions of each other (hreflang). */
export const hiGymLanguages = () => ({ "en-IN": absoluteUrl("/"), "hi-IN": absoluteUrl(HI_GYM.path), "x-default": absoluteUrl("/") });

/** Period of the day for a time: "05:30" → सुबह, "16:00" → शाम, "22:00" → रात. */
function part(hhmm: string): string {
  const h = Number(hhmm.split(":")[0]);
  return h < 12 ? "सुबह" : h < 20 ? "शाम" : "रात";
}
const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
};

/** The opening hours as one Hindi sentence, built from the saved hours. */
export function hindiHours(hours: Business["hours"]): string {
  if (hours.length === 0) return "";
  const days = [...new Set(hours.map((h) => h.days))];
  const monSat = days.length === 1 && /mon\w*\s*[–-]\s*sat/i.test(days[0]);
  const spans = hours.map((h) => {
    const p1 = part(h.open);
    const p2 = part(h.close);
    return `${p1} ${clock(h.open)} से ${p2 === p1 ? "" : `${p2} `}${clock(h.close)} बजे`;
  });
  return `${monSat ? "सोमवार से शनिवार" : days.join(" · ")}: ${spans.join(", ")}।${monSat ? " रविवार बंद।" : ""}`;
}
