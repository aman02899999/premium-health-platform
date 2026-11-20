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
  /** Which Reel it replaces: the month plan's midday Reel (default) or the evening Reel. */
  slot?: "midday" | "evening";
  /** Instagram usernames invited as Collab partners (max 3); they accept in their app. */
  collaborators?: string[];
  /** "promo" Reels sell a plan and carry no health facts, so they need no sources line. */
  kind?: "tips" | "promo";
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

// Coach Rubi promo Reels (thread "Make 2 Rubi promo Reels"), 20 Nov 2026. Owner approved posting
// and sent Rubi's handle; she gets a Collab invite so the Reel shows on her profile too. Prices from
// offers.ts (festive offer + Female's Special, until 31 Dec 2026) and DIET_PLANS (₹49 7-Day Trial).
const RUBI = "__rubi_i_love_u";
const RUBI_TAGS_GYM = "#RoyalFitnessClub #NoidaGym #GymInNoida #Sector93Noida #WomensFitness #GymForWomen #FemaleTrainer #FitnessCoach #BeginnerWorkout #FatLoss #NoidaFitness #GymOffer";
const RUBI_TAGS_DIET = "#DietPlan #IndianDiet #DesiDiet #WeightLoss #FatLoss #DietChart #HealthyEating #RoyalFitnessClub #NoidaGym #NoidaFitness";
const RUBI_GYM_BODY = `Gym ka pehla din thoda awkward lagta hai. Kaunsi machine, kitna weight, shuru kahan se karein?

Coach Rubi (@${RUBI}, 8+ saal ka experience) women aur beginners ko gym floor par safe aur confident start karwati hain. Form check, simple plan, aur har rep par guidance.

👩 Female's Special: ₹7,000 mein 6 months + calorie-based diet plan
Festive prices, 31 Dec 2026 tak:
• Monthly ₹2,000 ➝ ₹1,500
• Quarterly ₹5,000 ➝ ₹4,000
• Half-yearly ₹8,000 ➝ ₹7,000
Couple prices standard rehte hain.`;
const RUBI_ADDRESS = `📍 Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304
🕐 Mon–Sat 5:30–11 AM & 4–10 PM · Sunday closed`;
const RUBI_DIET_BODY = `Diet shuru karni hai par samajh nahi aata kya khaayein, kitna khaayein? Coach Rubi (@${RUBI}) ki salah: pehle sirf 7 din try karo.

🥗 7-Day Trial Plan, sirf ₹49
• Aapke liye bana 7-day diet chart + workouts
• Desi khana, katori aur roti ke measure mein
• Veg, egg, non-veg ya Jain
• Day 7 par review
PDF WhatsApp aur email par, 48 ghante ke andar. Ek phone number par ek trial.
Online hai, toh Noida se bahar ho tab bhi chalega.`;
const RUBI_DIET_NOTE = "Ye 7-day trial hai, join karne wala 1-month plan nahi. General guidance hai, medical advice nahi. Koi health condition hai toh pehle doctor se baat karo.";

const RUBI_REELS: SpecialReel[] = [
  {
    id: "reel-coach-rubi-gym",
    date: "2026-11-20",
    slot: "midday",
    kind: "promo",
    collaborators: [RUBI],
    video: "/social/reels/coach-rubi-gym.mp4",
    theme: "Coach Rubi: Female's Special + free trial",
    instagram: `${RUBI_GYM_BODY}

📲 Free trial book karo: link in bio
📞 Call or WhatsApp 88518 30081
${RUBI_ADDRESS}

${RUBI_TAGS_GYM}`,
    facebook: `${RUBI_GYM_BODY.replace(` (@${RUBI}, 8+`, " (8+")}

📲 Free trial book karo: https://www.royalfitnesclub.in/membership?utm_source=facebook&utm_medium=social&utm_campaign=rubi-reel-nov26
📞 Call or WhatsApp 88518 30081
${RUBI_ADDRESS}

${RUBI_TAGS_GYM}`,
  },
  {
    id: "reel-coach-rubi-diet-trial",
    date: "2026-11-20",
    slot: "evening",
    kind: "promo",
    collaborators: [RUBI],
    video: "/social/reels/coach-rubi-diet-trial.mp4",
    theme: "Coach Rubi: ₹49 7-Day Trial Plan",
    instagram: `${RUBI_DIET_BODY}

👉 Order: royalfitnesclub.in/diet-chart (link in bio)
💬 WhatsApp 88518 30081
Noida mein ho? Sector 93 mein gym ka free trial bhi book karo.

${RUBI_DIET_NOTE}

${RUBI_TAGS_DIET}`,
    facebook: `${RUBI_DIET_BODY.replace(` (@${RUBI})`, "")}

👉 Order: https://www.royalfitnesclub.in/diet-chart?plan=trial&utm_source=facebook&utm_medium=social&utm_campaign=rubi-reel-nov26#order
💬 WhatsApp 88518 30081
Noida mein ho? Sector 93 mein gym ka free trial bhi book karo.

${RUBI_DIET_NOTE}

${RUBI_TAGS_DIET}`,
  },
];

export const SPECIAL_REELS: SpecialReel[] = [
  ...RUBI_REELS,
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

// Coach promo posts (thread "Create 3 coach promo posts", 14 Nov 2026). Designed and approved by
// the owner; years of experience are the owner's own numbers. Prices are the festive offer with the
// standard price struck through (Annual and Female's Special have no standard discount, so none is
// claimed). The ₹49 one-month diet plan is the owner's joining offer at the gym.
const COACHES = `Manish (30+ saal), Prince (10+ saal), Rubi (8+ saal) aur Founder & Head Coach Aman Sharma (15+ saal)`;
const COACH_OFFER = `👉 Festive prices, sirf 31 Dec 2026 tak:
• Monthly ₹2,000 ➝ ₹1,500
• Quarterly ₹5,000 ➝ ₹4,000
• Half-yearly ₹8,000 ➝ ₹7,000
• Female's Special ₹7,000 (6 months)
• Annual ₹14,000 (sirf ₹1,167/month)
🥗 Join karo aur 1-month customised diet plan lo sirf ₹49 (regular ₹1,999).
Couple prices standard rehte hain.`;
const COACH_INFO = `📍 Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304
🕐 Mon–Sat 5:30–11 AM & 4–10 PM · Sunday closed`;
const COACH_TAGS =
  "#RoyalFitnessClub #NoidaGym #GymInNoida #Sector93Noida #NoidaFitness #PersonalTrainer #FitnessCoach #GymOffer #FestiveOffer #WomensFitness #FatLoss #MuscleGain #CoachAman";
const coachLink = (page: string, c: string) =>
  `https://www.royalfitnesclub.in/${page}?utm_source=facebook&utm_medium=social&utm_campaign=coach-posts-2026-11&utm_content=${c}`;
const coachPost = (p: { id: string; date: string; image: "meet" | "offer" | "trial"; theme: string; body: string; ig: string; fb: string }): SpecialPost => ({
  id: p.id,
  date: p.date,
  slot: "pm",
  feedImage: `/social/coach-${p.image}-feed.jpg`,
  storyImage: `/social/coach-${p.image}-story.jpg`,
  theme: p.theme,
  instagram: `${p.body}\n\n${p.ig}\n📞 Call or WhatsApp 88518 30081\n\n${COACH_INFO}\n\n${COACH_TAGS}`,
  facebook: `${p.body}\n\n${p.fb}\n📞 Call or WhatsApp 88518 30081\n\n${COACH_INFO}\n\n${COACH_TAGS}`,
});
const OFFER_BODY = `Festive Offer chal raha hai, aur 31 Dec 2026 ko khatam ho jayega 🎉

${COACH_OFFER}

Coach Manish, Prince, Rubi aur Aman ke saath shuru karo.`;

const COACH_POSTS: SpecialPost[] = [
  coachPost({
    id: "coach-meet",
    date: "2026-11-18",
    image: "meet",
    theme: "Meet the coaches",
    body: `Royal Fitness Club ke coaches se miliye 💪

${COACHES}.

Strength, fat loss, personal training, cardio, women's fitness aur diet guidance. Jo bhi goal ho, yahan ek coach hai jo form check karega aur roz poochhega: aaj workout hua?

Festive offer ₹1,500 se shuru, 31 Dec tak.`,
    ig: "👉 Free trial book karo: link in bio",
    fb: `👉 Free trial book karo: ${coachLink("contact", "meet")}#trial`,
  }),
  coachPost({
    id: "coach-offer",
    date: "2026-11-21",
    image: "offer",
    theme: "Festive offer with the coaches",
    body: OFFER_BODY,
    ig: "📲 Link in bio se plan dekho ya join karo",
    fb: `📲 Plan dekho ya join karo: ${coachLink("membership", "offer")}`,
  }),
  coachPost({
    id: "coach-trial",
    date: "2026-11-24",
    image: "trial",
    theme: "Free trial with a coach",
    body: `Gym ka pehla din thoda awkward lagta hai. Machine kaunsi, kitna weight, kahan se start karein?

Isliye pehla din akele mat aao. Free trial session book karo. Ek coach aapko gym dikhayega aur pehla workout saath mein karwayega.

Festive offer ₹1,500 se shuru, aur join karne par 1-month diet plan sirf ₹49. 31 Dec tak.`,
    ig: "👉 Free trial: link in bio",
    fb: `👉 Free trial book karo: ${coachLink("contact", "trial")}#trial`,
  }),
  coachPost({
    id: "coach-offer-dec",
    date: "2026-12-05",
    image: "offer",
    theme: "Festive offer reminder",
    body: OFFER_BODY,
    ig: "📲 Link in bio se plan dekho ya join karo",
    fb: `📲 Plan dekho ya join karo: ${coachLink("membership", "offer-dec")}`,
  }),
  coachPost({
    id: "coach-offer-end",
    date: "2026-12-19",
    image: "offer",
    theme: "Festive offer ends 31 Dec",
    body: OFFER_BODY.replace("Festive Offer chal raha hai, aur 31 Dec 2026 ko khatam ho jayega 🎉", "Festive Offer 31 Dec 2026 ko khatam. Uske baad standard prices wapas aa jayenge."),
    ig: "📲 Link in bio se plan dekho ya join karo",
    fb: `📲 Plan dekho ya join karo: ${coachLink("membership", "offer-end")}`,
  }),
];

// Banners (thread "Create Diet Trial and gym promo banners", 20 Nov 2026). The owner saw the banners
// and said "Post it". Each takes the 4 PM card and the morning Story on its day. The trial is the ₹49
// 7-Day Trial Plan (DIET_PLANS id "trial"), a different thing from the ₹49 one-month plan that comes
// with joining, so the two captions never mix them. The Instagram bio page doesn't link the trial or
// the app, so those Instagram captions name the web address in plain text.
const bannerLink = (path: string, c: string, hash = "") =>
  `https://www.royalfitnesclub.in${path}${path.includes("?") ? "&" : "?"}utm_source=facebook&utm_medium=social&utm_campaign=banners-2026-11&utm_content=${c}${hash}`;
const BANNER_TAGS = "#RoyalFitnessClub #NoidaGym #GymInNoida #Sector93Noida #NoidaFitness #CoachAman";
const bannerPost = (p: { id: string; date: string; image: string; theme: string; body: string; ig: string; fb: string; tags: string }): SpecialPost => ({
  id: p.id,
  date: p.date,
  slot: "pm",
  feedImage: `/social/banner-${p.image}-feed.jpg`,
  storyImage: `/social/banner-${p.image}-story.jpg`,
  theme: p.theme,
  instagram: `${p.body}\n\n${p.ig}\n📞 Call or WhatsApp 88518 30081\n\n${COACH_INFO}\n\n${p.tags} ${BANNER_TAGS}`,
  facebook: `${p.body}\n\n${p.fb}\n📞 Call or WhatsApp 88518 30081\n\n${COACH_INFO}\n\n${p.tags} ${BANNER_TAGS}`,
});
const BANNER_POSTS: SpecialPost[] = [
  bannerPost({
    id: "banner-diet-trial",
    date: "2026-11-22",
    image: "diet-trial",
    theme: "₹49 7-day diet trial",
    body: `Diet plan lene se pehle try karna hai? 7 din ka trial lo, sirf ₹49 mein 🥗

Aapko milega:
• Calories aur protein aapki age, height, weight aur goal ke hisaab se
• 7 din ke Indian meals, katori aur roti ke measure mein
• Ek workout week, aur Day-7 par coach ke saath review

Veg, egg, non-veg, vegan ya Jain, jo aap khaate ho. PDF WhatsApp aur email par 48 ghante mein aata hai. Ek number par ek trial.

Koi health condition ya medicine chal rahi hai? Plan coach check karta hai, phir bhi doctor se zaroor poochh lein.`,
    ig: "👉 Trial lo: royalfitnesclub.in/diet-chart (ya post ka QR scan karo)",
    fb: `👉 Trial lo: ${bannerLink("/diet-chart?plan=trial", "diet-trial", "#order")}`,
    tags: "#DietPlan #IndianDiet #DietTrial #FatLoss",
  }),
  bannerPost({
    id: "banner-join-online",
    date: "2026-11-23",
    image: "join-online",
    theme: "Royal Fitness online",
    body: `Royal Fitness ab aapke phone mein bhi 📱

• Membership online join ya renew karo: UPI, card ya net banking
• Free Royal Fitness app: workout plan, Indian food log, weight aur waist progress
• Instagram @royalfitness93_ par gym ki updates aur tips
• YouTube par Royal Fitness TV: diet aur gym myths par seedhi baat, Hindi mein

Kuch samajh na aaye to reception par poochho.`,
    ig: "👉 Join ya renew: link in bio · Free app: royalfitnesclub.in/app",
    fb: `👉 Join ya renew: ${bannerLink("/join", "join-online")}\n📲 Free app: ${bannerLink("/app", "join-online-app")}`,
    tags: "#FitnessApp #JoinOnline",
  }),
  bannerPost({
    id: "banner-gym-festive",
    date: "2026-11-27",
    image: "gym-festive",
    theme: "Festive prices with Coach Aman",
    body: `Sector 93 mein gym dhoondh rahe ho? Festive prices 31 Dec 2026 tak chalenge 🎉

• Monthly ₹2,000 ➝ ₹1,500 (1 month + 5 bonus days)
• Quarterly ₹5,000 ➝ ₹4,000 (3 months + 10 bonus days)
• Half-yearly ₹8,000 ➝ ₹7,000 (6 months + 20 bonus days)
• Female's Special ₹7,000 (6 months + calorie-based diet plan)
• Annual ₹14,000 = 14 months (12 + 2 free), ₹1,000/month

Monthly, Quarterly ya Half-yearly join karne par free diet consultation aur 1-month diet plan sirf ₹49 (regular ₹1,999). Couple prices standard rehti hain.

⭐ 4.7 from 303+ ratings on Justdial

Pehle gym dekhna hai? Free trial session book karo.`,
    ig: "👉 Plans aur free trial: link in bio",
    fb: `👉 Plans aur free trial: ${bannerLink("/membership", "gym-festive")}`,
    tags: "#GymOffer #FestiveOffer #WomensFitness",
  }),
];

export const SPECIAL_POSTS: SpecialPost[] = [
  ...COACH_POSTS,
  ...BANNER_POSTS,
  mythStory(1, "2026-11-10", "Myth: pasina = fat burn"),
  mythStory(2, "2026-11-11", "Myth: crunches se pet kam"),
  mythStory(3, "2026-11-13", "Myth: weights se ladkiyan bulky"),
  mythStory(4, "2026-11-16", "Myth: 10 din mein 6 kg fat"),
  // YouTube channel promo Story (thread "Create YouTube promo Story image", 18 Nov 2026). Owner's
  // own text; the QR code opens youtube.com/@RoyalFitnessTV. The API can't add a Link sticker.
  { id: "youtube-promo-story", date: "2026-11-19", storyImage: "/social/youtube-promo-story.jpg", theme: "Royal Fitness TV ab YouTube par", instagram: "", facebook: "" },
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

/** The owner's own Reel that replaces today's midday (or evening) Reel, if any. */
export function specialReel(date: string, slot: "midday" | "evening" = "midday", reels: SpecialReel[] = SPECIAL_REELS): SpecialReel | null {
  return reels.find((r) => r.date === date && (r.slot ?? "midday") === slot) ?? null;
}
