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
  }),  // Desi Food Science Reels (thread "Make Desi Food Science videos"), 21 Nov 2026. Owner asked to
  // upload them everywhere. AI images, AI animation and AI voice: turn on "AI info" when it applies.
  tipsReel({
    id: "reel-desi-science-gond-laddu",
    date: "2026-11-22",
    video: "/social/reels/desi-science-gond-laddu.mp4",
    theme: "Gond laddu ka science",
    body: `Gond ke laddu sirf naani ka nuskha hain ya inke peeche science bhi hai? 🌳🧈

Gond acacia jaise pedon ka sukha ras hai, aur isme zyada-tar soluble fibre hota hai. Ek study (British Journal of Nutrition, 2008) mein acacia gum se pet ke achhe bacteria badhe.

Ek sach bhi jaan lo: ghee aur gud ki wajah se calories kaafi hoti hain. Gym karte ho toh din mein ek chhota laddu kaafi hai. Joint pain ho toh doctor ko dikhao, laddu dawa nahi hai.

Sources: Calame et al., Br J Nutr 2008; ICMR-NIN Dietary Guidelines 2024.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#GondLaddu #DesiFood #WinterFood #Nutrition #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-desi-science-food-synergy",
    date: "2026-11-23",
    video: "/social/reels/desi-science-food-synergy.mp4",
    theme: "Food synergy ka science",
    body: `Sahi combo mein khao toh 1 + 1 = 3 🍋

✅ Haldi + kali mirch: piperine curcumin ka absorption kai guna badhata hai (Planta Medica, 1998)
✅ Haldi + ghee: curcumin fat mein ghulta hai, isliye tadka smart hai
✅ Dal/palak + nimbu: vitamin C se iron zyada absorb hota hai
✅ Dal + chawal: protein ki quality behtar
❌ Khane ke saath chai: iron kam absorb hota hai, 1 ghante ka gap rakho

Combo smart hai, jaadu nahi. Asli farak diet, neend aur workout se aata hai.

Sources: Shoba et al., Planta Med 1998; Hallberg et al., AJCN 1989; ICMR-NIN Dietary Guidelines 2024.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#FoodSynergy #Haldi #DesiDiet #IronRich #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-desi-science-joints",
    date: "2026-11-24",
    video: "/social/reels/desi-science-joints.mp4",
    theme: "Ghutne ka science",
    body: `Sardi mein ghutne jakad jaate hain? Pehle samjho ki joint andar se kaise kaam karta hai 🦵

Cartilage mein khoon ki nalein nahi hoti, isliye chalne-hilne se hi ise poshan milta hai. Mazboot jaangh aur kulhe ki muscles ghutne ka bhaar sambhalti hain. WHO hafte mein 2+ din strength training ki salah deta hai.

Sardi ke 3 rule: 5-10 min warm-up, thodi dhoop, paani.
Sujan, tez dard ya chot ho toh pehle doctor ko dikhao. Coach ke saath, apne level se shuru karo.

Sources: Sophia Fox et al., Sports Health 2009; WHO physical activity guidelines 2020.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#KneeHealth #JointCare #StrengthTraining #WinterWorkout #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-desi-science-fibre-gut",
    date: "2026-11-25",
    video: "/social/reels/desi-science-fibre-gut.mp4",
    theme: "Fibre ka science",
    body: `Aapke pet mein kharabon bacteria rehte hain, aur unka favourite khana hai fibre 🦠🥦

Ye bacteria fibre se butyrate jaise short chain fatty acids banate hain, jo aanton ki cells ke liye energy ka source hain (Cell, 2016). Fibre pet ko der tak bhara bhi rakhta hai.

WHO: roz kam se kam 25 g natural fibre.
Desi thaali mein: rajma, chana, dal, bajra, hari sabzi, chhilke wale phal.
Fibre dheere-dheere badhao aur paani zyada piyo.

Sources: Koh et al., Cell 2016; WHO carbohydrate intake guideline 2023.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#Fibre #GutHealth #DesiThaali #FatLoss #Nutrition #RoyalFitnessClub #NoidaGym",
  }),
  // Desi Habit Science Reels (same thread), 21 Nov 2026: saunf, walk after meals, soaked badam,
  // water with meals. Format idea from a public explainer; scripts, visuals and voice are our own (AI).
  tipsReel({
    id: "reel-desi-habit-saunf",
    date: "2026-11-26",
    video: "/social/reels/desi-habit-saunf.mp4",
    theme: "Khane ke baad saunf kyon",
    body: `Khane ke baad saunf-mishri: sirf mouth freshener, ya science bhi? 🌿

Saunf ki khushbu uske tel (anethole, fenchone) se aati hai. Chabane se laar banti hai aur saans taazi lagti hai.
European Medicines Agency saunf ko halki gas, afara aur halki marod mein paramparik upyog ke liye maanti hai. Lab mein ye aant ki smooth muscles ko relax karti dikhi, par insaanon par badi studies abhi kam hain.

Mishri = sugar. Diabetes ho toh sirf saunf. Saunf band dabbe mein rakho.
Roz gas, acidity ya pet dard? Doctor ko dikhao. Saunf aadat hai, dawa nahi.

Sources: European Medicines Agency, fennel monograph (HMPC).
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#Saunf #Fennel #DesiHabits #Digestion #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-desi-habit-walk",
    date: "2026-11-27",
    video: "/social/reels/desi-habit-walk.mp4",
    theme: "Khane ke baad 10 minute walk",
    body: `Dadi kehti thi khane ke baad tehlo. Science bhi yahi kehti hai 🚶

Khane ke baad blood sugar badhta hai. Chalne par pairon ki muscles glucose ko fuel ki tarah use karti hain.
Studies ke ek review mein khane ke baad halki walk se sugar spike kam hua, 2-5 min se bhi farak dikha.
Type 2 diabetes par ek study: har khane ke baad 10 min walk, ek baar 30 min walk se behtar rahi.

Rule: khane ke 30 min ke andar, 10-15 min aaram se.
Diabetes ki dawa doctor se pooche bina band mat karo.

Sources: Buffey et al., Sports Med 2022; Reynolds et al., Diabetologia 2016.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#WalkAfterMeal #BloodSugar #DesiHabits #FatLoss #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-desi-habit-badam",
    date: "2026-11-28",
    video: "/social/reels/desi-habit-badam.mp4",
    theme: "Bhigoye badam ka sach",
    body: `Raat bhar bhigoye badam se dimaag tez? Sach jaano 👇

Badam mein protein, fibre, vitamin E, magnesium aur achhe fats hote hain.
Bhigone se chhilka naram ho jaata hai aur chabana aasaan. Par ek study mein bhigoye aur kachche badam mein pet ke lakshanon ka khaas farak nahi mila.
Yaaddasht badhne ka pakka saboot nahi hai.

Roz ~20 badam kaafi (~160 kcal). Zyada nahi.

Sources: USDA FoodData Central; Taylor et al., Eur J Nutr 2018.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#Badam #Almonds #SoakedAlmonds #DesiHabits #Nutrition #RoyalFitnessClub #NoidaGym",
  }),
  tipsReel({
    id: "reel-desi-habit-paani",
    date: "2026-11-29",
    video: "/social/reels/desi-habit-paani.mp4",
    theme: "Khane ke saath paani",
    body: `Khane ke saath paani peena galat hai? 💧

Myth: paani pet ka acid patla kar deta hai. Sach: pet bahut strong acid banata hai, aur paani jaldi aage nikal jaata hai.
Paani khane ko naram karta hai aur fibre ke saath kabz se bachata hai.
Ek study mein khane se pehle 500 ml paani peene walon ne diet par zyada vazan kam kiya.

Chhote ghoont lo. Acidity ho toh ek saath bahut zyada paani mat piyo.

Sources: Mayo Clinic, water with meals; Dennis et al., Obesity 2010.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#Water #Digestion #DesiHabits #FatLossTips #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  // Supplement Myth Buster Reels (thread "Make supplement myth playlist", 25 Nov 2026): the 12 series Shorts,
  // copies of the YouTube Shorts in /social/reels (public/youtube is not in the server image), midday slot one a day from 30 Nov.
  tipsReel({
    id: "reel-supp-whey-steroid",
    date: "2026-11-30",
    video: "/social/reels/supp-whey-steroid.mp4",
    theme: "Whey Protein = Steroid? 💪",
    body: `Whey Protein = Steroid? 💪

Whey protein steroid hai? Nahi. Whey doodh ka protein hai, paneer banate waqt bacha paani. Steroid hormone ki lab copy, ek dawa hai. Asli khatra: 2024 ki Indian lab jaanch mein 36 mein se 25 powders mein label se kam protein mila. FSSAI licence, batch aur lab report dekho.

Supplement Myth Buster #1 · poori series YouTube par: Royal Fitness TV
Sources: Jäger et al. 2017, ISSN position stand: protein and exercise (JISSN); NIDA, Anabolic Steroids DrugFacts; Citizens Protein Project 2024, protein supplements sold in India (Medicine); ICMR-NIN, Indian Food Composition Tables 2017.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#WheyProtein #ProteinPowder #GymMyths #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-fake-whey-test",
    date: "2026-12-01",
    video: "/social/reels/supp-fake-whey-test.mp4",
    theme: "Asli Ya Nakli Whey? Aag Aur Paani Wale Home Test Ka Sach",
    body: `Asli Ya Nakli Whey? Aag Aur Paani Wale Home Test Ka Sach

Whey jalao, garam paani mein ghol do, jhaag dekho: asli-nakli pata chal jaayega? Nahi. Ghulna aur jhaag processing par depend karta hai, protein kitna hai ye sirf lab bata sakti hai. Dabbe par FSSAI licence + batch number dekho, batch ki lab report maango, authorised seller se lo.

Supplement Myth Buster #2 · poori series YouTube par: Royal Fitness TV
Sources: Citizens Protein Project 2024, protein supplements sold in India (Medicine); US FDA, Caution: Bodybuilding Products Can Be Risky.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#FakeWhey #ProteinPowder #SupplementSafety #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-mass-gainer",
    date: "2026-12-02",
    video: "/social/reels/supp-mass-gainer.mp4",
    theme: "Mass Gainer Ke Bina Weight Nahi Badhega? Desi Gainer Shake",
    body: `Mass Gainer Ke Bina Weight Nahi Badhega? Desi Gainer Shake

Patle ho aur socha gainer ke bina wazan nahi badhega? Wazan tab badhta hai jab roz zaroorat se thodi zyada calories khao. Gainer mostly carbs + thoda protein hai. Ghar ka gainer: doodh, kela, moongphali ka shake, saath mein oats, ghee wali roti, paneer, dal. Aur weight training zaroor karo. Achanak wazan girna ya bhookh na lagna ho toh pehle doctor ko dikhao.

Supplement Myth Buster #3 · poori series YouTube par: Royal Fitness TV
Sources: NHS, Advice for underweight adults; ICMR-NIN, Indian Food Composition Tables 2017.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#MassGainer #WeightGain #DesiDiet #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-bcaa",
    date: "2026-12-03",
    video: "/social/reels/supp-bcaa.mp4",
    theme: "BCAA Nahi Liya Toh Muscle Tootegi? Gym Ka Sabse Mehenga Myth",
    body: `BCAA Nahi Liya Toh Muscle Tootegi? Gym Ka Sabse Mehenga Myth

BCAA teen amino acids hain: leucine, isoleucine, valine. Muscle banane ke liye 9 zaroori amino acids chahiye, sirf 3 nahi. Research review (Wolfe 2017): akele BCAA se muscle banne ki raftaar nahi badhti. Din bhar ka protein poora ho toh alag se fayda aur kam. Dal-chawal, dahi, paneer, ande, soya mein sab amino acids milte hain.

Supplement Myth Buster #4 · poori series YouTube par: Royal Fitness TV
Sources: Wolfe 2017, BCAAs and muscle protein synthesis: myth or reality? (JISSN); Jäger et al. 2017, ISSN position stand: protein and exercise (JISSN).
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#BCAA #AminoAcids #GymSupplements #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-glutamine",
    date: "2026-12-04",
    video: "/social/reels/supp-glutamine.mp4",
    theme: "Glutamine Se Recovery Double? Gym Bag Mein Rakhne Se Pehle D",
    body: `Glutamine Se Recovery Double? Gym Bag Mein Rakhne Se Pehle Dekho

Glutamine ek amino acid hai jo body khud banati hai. Healthy logon ki studies mein glutamine se strength ya recovery mein khaas farq nahi dikha (Gleeson 2008). Hospital mein gambhir bimari mein doctor ise alag wajah se dete hain. Recovery ka asli formula: 7+ ghante neend, poora protein, paani. Doodh, dahi, paneer, ande, dal mein glutamine khud hota hai.

Supplement Myth Buster #5 · poori series YouTube par: Royal Fitness TV
Sources: Gleeson 2008, Glutamine supplementation in exercise and sport training (J Nutr); CDC, About Sleep.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#Glutamine #Recovery #GymSupplements #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-pre-workout",
    date: "2026-12-05",
    video: "/social/reels/supp-pre-workout.mp4",
    theme: "Pre-Workout Ke Bina Energy Nahi? Dabbe Ke Andar Ka Sach",
    body: `Pre-Workout Ke Bina Energy Nahi? Dabbe Ke Andar Ka Sach

Zyada-tar pre-workout ka main ingredient caffeine hai, wahi jo chai-coffee mein. Research mein kuch logon ki performance thodi badhti hai, par har dabbe mein caffeine alag, aur zyada caffeine se dhadkan tez, ghabrahat, neend kharab. Desi pre-workout: ek kela + chaho toh ek cup black coffee ya chai. Sabse bada pre-workout: poori neend. BP, dil ki bimari, pregnancy ya dawa chal rahi ho toh doctor se poocho.

Supplement Myth Buster #6 · poori series YouTube par: Royal Fitness TV
Sources: Guest et al. 2021, ISSN position stand: caffeine and exercise performance (JISSN); US FDA, Spilling the Beans: How Much Caffeine Is Too Much?.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#PreWorkout #Caffeine #GymEnergy #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-l-carnitine",
    date: "2026-12-06",
    video: "/social/reels/supp-l-carnitine.mp4",
    theme: "L-Carnitine Se Fat Pighlega? Fat Burner Ka Sach",
    body: `L-Carnitine Se Fat Pighlega? Fat Burner Ka Sach

Carnitine fat ko cell ke power house, mitochondria, tak le jaata hai. Par healthy body itna carnitine khud bana leti hai (NIH). Weight loss par studies ke nateeje mile-jule hain. Fat tab ghatta hai jab calories kam aur movement zyada ho: roz chalo, weight training, poora protein. Carnitine doodh, dahi, chicken aur machhli se bhi milta hai.

Supplement Myth Buster #7 · poori series YouTube par: Royal Fitness TV
Sources: NIH Office of Dietary Supplements, Carnitine; NIH Office of Dietary Supplements, Dietary Supplements for Weight Loss.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#LCarnitine #FatBurner #FatLoss #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-multivitamin",
    date: "2026-12-07",
    video: "/social/reels/supp-multivitamin.mp4",
    theme: "Roz Multivitamin = Sehat Ka Insurance?",
    body: `Roz Multivitamin = Sehat Ka Insurance?

US Preventive Services Task Force ne 2022 mein research dekhi: healthy logon mein multivitamin se dil ki bimari ya cancer se bachaav ka pakka saboot nahi mila. Kami ho toh baat alag: pregnancy mein folic acid, ya test mein vitamin D ya B12 kam aaye toh doctor ki salah se. Asli multivitamin rangeen thali hai: dal, hari sabzi, salad, dahi, phal, saabut anaaj.

Supplement Myth Buster #8 · poori series YouTube par: Royal Fitness TV
Sources: US Preventive Services Task Force 2022, Vitamin and mineral supplementation; ICMR-NIN, Dietary Guidelines for Indians (2024).
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#Multivitamin #BalancedDiet #DesiThali #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-vitamin-d",
    date: "2026-12-08",
    video: "/social/reels/supp-vitamin-d.mp4",
    theme: "Khidki Ki Dhoop Se Vitamin D? Sheesha UVB Rokta Hai",
    body: `Khidki Ki Dhoop Se Vitamin D? Sheesha UVB Rokta Hai

Vitamin D skin mein tab banta hai jab dhoop ki UVB kiranein skin par padti hain. Aam khidki ka sheesha UVB rok deta hai (NICE NG34), isliye band khidki ke peeche baithne se vitamin D nahi banta. Bahar khuli dhoop lo, haath-baazu khule, par skin laal hone se pehle chhaaon mein aa jao. Ande ki zardi, machhli, fortified doodh mein bhi vitamin D. Haddiyon mein dard ya thakan ho toh test karao, vitamin D doctor ki salah se hi lo.

Supplement Myth Buster #9 · poori series YouTube par: Royal Fitness TV
Sources: NICE guideline NG34, Sunlight exposure: risks and benefits; NIH Office of Dietary Supplements, Vitamin D.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#VitaminD #Sunlight #BoneHealth #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-veg-b12",
    date: "2026-12-09",
    video: "/social/reels/supp-veg-b12.mp4",
    theme: "Vegetarian Ho Toh B12 Milega Hi Nahi? Aadha Sach",
    body: `Vegetarian Ho Toh B12 Milega Hi Nahi? Aadha Sach

B12 naso aur khoon ke liye zaroori hai. Kami se thakan, jhunjhuni, khoon ki kami ho sakti hai. B12 sirf meat mein nahi, doodh, dahi, paneer aur ande mein bhi hai. Par dal, sabzi, anaaj mein B12 nahi hota; vegan logon ko fortified food ya doctor ki salah chahiye. Buzurgon mein aur kuch dawaon ke saath B12 kam sokha jaata hai: thakan ya jhunjhuni ho toh test karao.

Supplement Myth Buster #10 · poori series YouTube par: Royal Fitness TV
Sources: NIH Office of Dietary Supplements, Vitamin B12.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#VitaminB12 #Vegetarian #Nutrition #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-omega3-alsi",
    date: "2026-12-10",
    video: "/social/reels/supp-omega3-alsi.mp4",
    theme: "Alsi Kha Lo, Fish Oil Ki Zaroorat Khatam? Omega-3 Ka Sach",
    body: `Alsi Kha Lo, Fish Oil Ki Zaroorat Khatam? Omega-3 Ka Sach

Omega-3 teen tarah ke: ALA, EPA, DHA. Alsi aur akhrot mein ALA, machhli mein EPA aur DHA. Body ALA ka sirf thoda hissa EPA/DHA mein badal paati hai (NIH). Par alsi bekaar nahi: fibre + ALA, peeskar roti, dahi ya salad mein daalo. Machhli khaate ho toh hafte mein do baar kaafi (AHA). Fish oil supplement doctor se pooch kar lo, khaaskar khoon patla karne ki dawa chal rahi ho.

Supplement Myth Buster #11 · poori series YouTube par: Royal Fitness TV
Sources: NIH Office of Dietary Supplements, Omega-3 Fatty Acids; American Heart Association, Fish and Omega-3 Fatty Acids.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#Omega3 #Flaxseed #FishOil #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  tipsReel({
    id: "reel-supp-collagen",
    date: "2026-12-11",
    video: "/social/reels/supp-collagen.mp4",
    theme: "Collagen Powder Se Naye Ghutne? Science Kya Kehti Hai",
    body: `Collagen Powder Se Naye Ghutne? Science Kya Kehti Hai

Collagen ek protein hai: pet mein ye bhi baaki protein ki tarah amino acids aur chhote tukdon mein toot jaata hai, seedha ghutne mein jaakar nahi baithta. Kuch chhoti studies mein jodon ke dard mein thoda fayda, par saboot abhi kamzor. Body collagen khud banati hai: protein + vitamin C chahiye. Amla, amrood, santra, nimbu ke saath dal, paneer, ande. Ghutne mein soojan ya tez dard ho toh pehle doctor ko dikhao.

Supplement Myth Buster #12 · poori series YouTube par: Royal Fitness TV
Sources: NIH Office of Dietary Supplements, Vitamin C; Jäger et al. 2017, ISSN position stand: protein and exercise (JISSN).
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
    tags: "#Collagen #KneeHealth #VitaminC #SupplementMythBuster #RoyalFitnessClub #NoidaGym #Sector93Noida",
  }),
  // Lab Test series EP 1 (thread "Make animated Reel from second Instagram link", 26 Nov 2026): owner said
  // "post it". Evening slot, so it doesn't push out the midday supplement Reels.
  {
    ...tipsReel({
      id: "reel-lab-khoon-ka-safar",
      date: "2026-11-27",
      video: "/social/reels/lab-khoon-ka-safar.mp4",
      theme: "Blood Test Ke Baad Khoon Lab Mein Kahan Jaata Hai? 🧪",
      body: `Blood Test Ke Baad Khoon Lab Mein Kahan Jaata Hai? 🧪

Rangeen dhakkan, centrifuge, plasma, laser se cell counting aur rang se number... poora safar 2 minute mein. Purple dhakkan waala blood count ke liye hai, grey sugar ke liye, peela ya laal serum tests ke liye. Plasma ka lagbhag 92% paani hai.

Gym waalon ke liye: test se pehle ke dinon mein heavy workout se liver aur muscle enzymes (AST, ALT, CK) badh sakte hain. Doctor ko apna gym routine zaroor batao. Report ka matlab khud mat nikalo, doctor ko dikhao.

Lab Ke Andar · EP 1
Sources: WHO guidelines on drawing blood (2010); American Red Cross, blood components; MedlinePlus, complete blood count; Pettersson et al. 2008, Br J Clin Pharmacol 65:253-9.
Visuals aur voice AI se banaye gaye hain.
${EDU}`,
      tags: "#BloodTest #LabTest #HealthScience #LabKeAndar #RoyalFitnessClub #NoidaGym #Sector93Noida",
    }),
    slot: "evening",
  },
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
