// One-off posts that take the place of a normal scheduled post on their day (festivals, the
// owner's own campaigns). Pure: the date and slot pick the post. The media are ready-made files in
// public/social (designed and approved by the owner before they go in here), so nothing renders at
// post time.
//
// - `feedImage` replaces the month plan's card in `slot` (Instagram + Facebook).
// - `storyImage` replaces the day's sales Story on Instagram.
// - A SPECIAL_REELS entry replaces the month plan's midday Reel (Instagram + Facebook).
// The rest of the day runs as normal.
import type { FeedSlot } from "./month-plan";

export type SpecialPost = {
  id: string;
  /** India date, YYYY-MM-DD. */
  date: string;
  /** Paths under public/. A post can be a feed card (slot + feedImage), a Story, or both. */
  slot?: FeedSlot;
  feedImage?: string;
  storyImage?: string;
  theme: string;
  instagram: string;
  /** Facebook captions can carry a link; Instagram's can't (the bio link does). */
  facebook: string;
};

const DIWALI_OFFER = `👉 Festive Offer, 31 Dec tak:
• Monthly ₹1,500 + 5 bonus days
• Quarterly ₹4,000 + 10 bonus days
• Half-yearly ₹7,000 + 20 bonus days
• Female's Special ₹7,000 (6 months + diet plan)
• Annual ₹14,000 = 14 months
Couple prices standard rehte hain.`;

const DIWALI_BODY = `Happy Diwali from Royal Fitness Club 🪔

Aap sabko aur aapki family ko Diwali ki dher saari shubhkamnayein.

Tyohaar hai, toh mithai khao, ghar walon ke saath time bitao, aur patakhon ke dhuein se thoda door raho. Ek din ki mithai se progress nahi rukti. Progress roz ki aadat se banti hai, aur woh aadat Diwali ke baad bhi wahin milegi.

Is Diwali ek diya apni sehat ke naam bhi jalao. 🙏

${DIWALI_OFFER}`;

const SIGN_OFF = `— Coach Aman Sharma, Royal Fitness Club
📍 Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304`;

const DIWALI_TAGS =
  "#HappyDiwali #ShubhDeepawali #Diwali2026 #RoyalFitnessClub #CoachAman #NoidaGym #GymInNoida #Sector93Noida #NoidaFitness #FitnessIndia #FestiveOffer #HealthyDiwali #GymLife";

const DIWALI_LINK = "https://www.royalfitnesclub.in/membership?utm_source=facebook&utm_medium=social&utm_campaign=diwali-2026";

export type SpecialReel = {
  id: string;
  /** India date, YYYY-MM-DD. */
  date: string;
  /** Path under public/: a 1080x1920 H.264/AAC mp4. */
  video: string;
  theme: string;
  instagram: string;
  facebook: string;
};

// Tips content, November 2026 (thread "Create transformation posts"). No client photos, so it
// doesn't wait on client consent. Health facts carry their sources on screen and in the caption.
const CTA_IG = `📲 Free trial: link in bio
📞 Call or WhatsApp 88518 30081`;
const ctaFb = (c: string) => `📲 Free trial book karo: https://www.royalfitnesclub.in/contact?utm_source=facebook&utm_medium=social&utm_campaign=tips-nov-2026&utm_content=${c}#trial
📞 Call or WhatsApp 88518 30081`;
const EDU = "General education only, medical advice nahi. Koi health condition hai toh pehle doctor se baat karo.";

const tipsReel = (r: Omit<SpecialReel, "instagram" | "facebook"> & { body: string; tags: string }): SpecialReel => ({
  id: r.id,
  date: r.date,
  video: r.video,
  theme: r.theme,
  instagram: `${r.body}\n\n${CTA_IG}\n\n${SIGN_OFF}\n\n${r.tags}`,
  facebook: `${r.body}\n\n${ctaFb(r.id)}\n\n${SIGN_OFF}\n\n${r.tags}`,
});

export const SPECIAL_REELS: SpecialReel[] = [
  tipsReel({
    id: "reel-fat-loss-myths",
    date: "2026-11-10",
    video: "/social/reels/fat-loss-myths.mp4",
    theme: "Fat loss ke 4 jhooth",
    body: `Gym mein roz sunte ho na ye 4 baatein? 👀

❌ Pasina zyada = fat zyada burn
❌ Crunches se pet ki charbi jaati hai
❌ Weights se ladkiyan bulky ho jaati hain
❌ 10 din mein 6 kg = 6 kg fat

Chaaron jhooth hain. Sach video mein hai.

Comment mein likho, aapne inme se kaunsa sach maana tha? 👇

Sources: NHS weight loss guidance; WHO physical activity guidelines 2020; Vispute et al., J Strength Cond Res 2011.
${EDU}`,
    tags: "#FitnessMyths #FatLossMyths #GymMyths #RoyalFitnessClub #NoidaGym #Sector93Noida #CoachAman",
  }),
  tipsReel({
    id: "reel-fat-loss-rules",
    date: "2026-11-12",
    video: "/social/reels/fat-loss-5-rules.mp4",
    theme: "Fat loss ke 5 rules",
    body: `Fat loss ke 5 rules, jo sach mein kaam karte hain 🔖 Save kar lo.

1️⃣ Protein har meal mein: dal, paneer, dahi, eggs, soya, chicken. Exercise karne walon ke liye roughly 1.4–2 g per kg body weight, poore din mein. Kidney ki problem ho toh pehle doctor se pucho.
2️⃣ Weights mat chhodo. Hafte mein kam se kam 2 din strength training.
3️⃣ 7+ ghante ki neend. Kam soyoge toh bhookh aur craving dono badhengi.
4️⃣ Chalo. Roz ~7,000 steps bhi health ke liye kaafi faydemand hain.
5️⃣ Speed nahi, consistency. Hafte mein 0.5–1 kg ka loss safe maana jaata hai.

Kisi ko tag karo jo "kal se diet" bolta rehta hai 😄

Sources: ISSN position stand (Jäger et al., 2017); WHO 2020; CDC sleep guidance; Spiegel et al., 2004; Ding et al., Lancet Public Health 2025; NHS.
${EDU}`,
    tags: "#FatLossTips #WeightLossTips #RoyalFitnessClub #NoidaGym #Sector93Noida #FitnessTipsHindi #CoachAman",
  }),
  tipsReel({
    id: "reel-beginner-tips",
    date: "2026-11-14",
    video: "/social/reels/beginner-5-tips.mp4",
    theme: "Gym beginner ke 5 tips",
    body: `Gym pehli baar ja rahe ho? Pehle din se pehle ye 5 baatein 👇

1️⃣ Pehle 1–2 hafte halka weight, poora focus form par.
2️⃣ Warm-up skip mat karo: 5–10 minute.
3️⃣ Shuru mein hafte mein 2–3 din full body kaafi hai.
4️⃣ Paani piyo aur 7+ ghante soyo.
5️⃣ Machine samajh nahi aayi? Coach se poocho. Har koi kabhi beginner tha.

Us dost ko bhejo jo "January se gym" bol raha hai 😄

Sources: ACSM resistance training position stand 2009; CDC sleep guidance.
${EDU}`,
    tags: "#GymBeginner #GymTipsHindi #FirstDayAtGym #RoyalFitnessClub #NoidaGym #Sector93Noida #CoachAman",
  }),
  tipsReel({
    id: "reel-muscle-basics",
    date: "2026-11-17",
    video: "/social/reels/muscle-4-basics.mp4",
    theme: "Muscle ke 4 basics",
    body: `Patle ho aur muscle banana hai? Supplements se pehle ye 4 basics theek karo 💪

1️⃣ Progressive overload: har hafte thoda zyada, ek rep ya 1–2 kg.
2️⃣ Compound lifts pehle: squat, deadlift, bench, row, overhead press. Form pehle, weight baad mein.
3️⃣ Kam khaoge toh muscle bhi kam banegi. Thoda extra khana aur har meal mein protein.
4️⃣ Muscle gym mein nahi, rest mein banti hai. 7+ ghante soyo.

Save karo, aur us dost ko bhejo jo 2 saal se "bulking" kar raha hai 😅

Sources: ACSM resistance training position stand 2009; ISSN position stand 2017; CDC sleep guidance.
${EDU}`,
    tags: "#MuscleGain #SkinnyToStrong #GymTipsHindi #RoyalFitnessClub #NoidaGym #Sector93Noida #CoachAman",
  }),
];

/** Myth vs fact Stories: a Story has no caption, so these only carry an image. */
const mythStory = (n: number, date: string, theme: string): SpecialPost => ({
  id: `myth-story-${n}`,
  date,
  storyImage: `/social/myth-0${n}.jpg`,
  theme,
  instagram: "",
  facebook: "",
});

export const SPECIAL_POSTS: SpecialPost[] = [
  mythStory(1, "2026-11-10", "Myth: pasina = fat burn"),
  mythStory(2, "2026-11-11", "Myth: crunches se pet kam"),
  mythStory(3, "2026-11-13", "Myth: weights se ladkiyan bulky"),
  mythStory(4, "2026-11-16", "Myth: 10 din mein 6 kg fat"),
  {
    id: "diwali-2026",
    date: "2026-11-08",
    slot: "am",
    feedImage: "/social/diwali-2026-feed.jpg",
    storyImage: "/social/diwali-2026-story.jpg",
    theme: "Happy Diwali 2026",
    instagram: `${DIWALI_BODY}

📲 Link in bio se plan dekho ya join karo.
📞 Call or WhatsApp 88518 30081

${SIGN_OFF}

${DIWALI_TAGS}`,
    facebook: `${DIWALI_BODY}

📲 Plan dekho ya join karo: ${DIWALI_LINK}
📞 Call or WhatsApp 88518 30081

${SIGN_OFF}

${DIWALI_TAGS}`,
  },
];

export type SpecialFeedPost = SpecialPost & { slot: FeedSlot; feedImage: string };
export type SpecialStoryPost = SpecialPost & { storyImage: string };

/** The special post that replaces this slot's card today, if any. */
export function specialFeedPost(date: string, slot: FeedSlot, posts: SpecialPost[] = SPECIAL_POSTS): SpecialFeedPost | null {
  return (posts.find((p) => p.date === date && p.slot === slot && p.feedImage) as SpecialFeedPost | undefined) ?? null;
}

/** The special Story that replaces today's sales Story, if any. */
export function specialStory(date: string, posts: SpecialPost[] = SPECIAL_POSTS): SpecialStoryPost | null {
  return (posts.find((p) => p.date === date && p.storyImage) as SpecialStoryPost | undefined) ?? null;
}

/** The owner's own Reel that replaces the midday Reel today, if any. */
export function specialReel(date: string, reels: SpecialReel[] = SPECIAL_REELS): SpecialReel | null {
  return reels.find((r) => r.date === date) ?? null;
}
