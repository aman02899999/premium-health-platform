// Ready-made long (16:9, 4–5 minute) myth-buster videos for the YouTube channel. The MP4 and its
// thumbnail live in public/youtube/long/; the YouTube cron uploads each one once, on or after its
// date (see runLongVideo in automation.ts). Every fact in a video was checked against the sources
// listed in its description before it was added here.
import { SITE_URL } from "@/lib/site";

export type LongVideo = {
  id: string;
  /** IST date (YYYY-MM-DD) from which it may go up. */
  date: string;
  title: string;
  /** The opening lines of the description, before the trial link, chapters and sources. */
  intro: string;
  chapters: [string, string][];
  sources: [string, string][];
  tags: string[];
};

const MEDICAL = "Ye general jaankari hai, medical advice nahi. Koi health problem hai toh apne doctor ki salah maano.";
const BASE_TAGS = ["fitness myths", "myth buster hindi", "hinglish fitness", "noida gym", "sector 93 noida gym", "royal fitness club", "coach aman sharma"];

const WHO_PA: [string, string] = ["WHO fact sheet, Physical activity", "https://www.who.int/news-room/fact-sheets/detail/physical-activity"];
const WHO_DIET: [string, string] = ["WHO fact sheet, Healthy diet", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"];

export const LONG_VIDEOS: LongVideo[] = [
  {
    id: "long-fitness-myths-10",
    date: "2026-11-09",
    title: "10 Fitness Myths Jo Aapka Progress Rok Rahe Hain | Sach + Source",
    intro: "Crunches se pet ki charbi? Protein sirf bodybuilders ke liye? 10,000 steps zaroori? Gud-honey healthy?\nIs video mein 10 aam fitness jhooth, har ek ka sach source ke saath, aasaan Hinglish mein.",
    chapters: [
      ["0:00", "Intro"],
      ["0:10", "Myth 1: Crunches se pet ki charbi"],
      ["0:34", "Myth 2: Ladkiyan weights se bulky?"],
      ["0:57", "Myth 3: Protein sirf bodybuilders ke liye?"],
      ["1:22", "Myth 4: 10 din mein 6 kg = fat loss?"],
      ["1:47", "Myth 5: 10,000 steps zaroori?"],
      ["2:20", "Myth 6: Roz 2 ghante gym?"],
      ["2:44", "Myth 7: Neend aur weight"],
      ["3:08", "Myth 8: Gud aur honey"],
      ["3:35", "Myth 9: Fat khane se mote?"],
      ["4:01", "Myth 10: Muscle fat ban jaata hai?"],
      ["4:25", "Recap"],
      ["4:36", "Free trial + subscribe"],
    ],
    sources: [
      ["Vispute et al., J Strength Cond Res 2011", "https://pubmed.ncbi.nlm.nih.gov/21804427/"],
      WHO_PA,
      ["ISSN Position Stand: Protein and exercise, 2017", "https://pubmed.ncbi.nlm.nih.gov/28642676/"],
      ["CDC, Losing Weight", "https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html"],
      ["Ding et al., Lancet Public Health 2025 (daily steps)", "https://pubmed.ncbi.nlm.nih.gov/40713949/"],
      ["Spiegel et al., Ann Intern Med 2004 (sleep and hunger)", "https://pubmed.ncbi.nlm.nih.gov/15583226/"],
      WHO_DIET,
    ],
    tags: ["fat loss myths", "protein myths", "weight loss tips hindi", "gym tips hinglish"],
  },
  {
    id: "long-desi-diet-myths-8",
    date: "2026-11-12",
    title: "8 Desi Diet Myths Jo Roz Ki Thali Mein Chhupe Hain | WHO Facts",
    intro: "Namak se kuch nahi hota? Juice = fruit? Sugar-free se weight kam? Ghee band karo?\nIs video mein 8 desi diet jhooth, har ek ka sach WHO ke source ke saath, aasaan Hinglish mein.",
    chapters: [
      ["0:00", "Intro"],
      ["0:11", "Myth 1: Namak aur BP"],
      ["0:43", "Myth 2: Fruit juice = fruit?"],
      ["1:12", "Myth 3: Sugar-free se weight loss?"],
      ["1:40", "Myth 4: Biscuit-namkeen roz?"],
      ["2:15", "Myth 5: Ghee bilkul band?"],
      ["2:43", "Myth 6: Roti-chawal chhodo?"],
      ["3:07", "Myth 7: Sabzi-fruit side dish?"],
      ["3:37", "Myth 8: Protein powder zaroori?"],
      ["4:08", "Recap"],
      ["4:19", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO fact sheet, Salt reduction", "https://www.who.int/news-room/fact-sheets/detail/salt-reduction"],
      WHO_DIET,
      ["WHO guideline on non-sugar sweeteners, 2023", "https://www.who.int/news/item/15-05-2023-who-advises-not-to-use-non-sugar-sweeteners-for-weight-control-in-newly-released-guideline"],
    ],
    tags: ["diet myths hindi", "indian diet tips", "healthy eating hinglish", "salt sugar ghee"],
  },
  {
    id: "long-exercise-myths-8",
    date: "2026-11-16",
    title: "8 Exercise Myths Har Umar Ke Log Maante Hain | WHO Guidelines",
    intro: "Thodi exercise bekaar? Bachon ke liye khel time waste? Weights sirf jawan logon ke liye? Walking kaafi hai?\nIs video mein 8 exercise jhooth, har ek ka sach WHO guidelines ke saath, aasaan Hinglish mein.",
    chapters: [
      ["0:00", "Intro"],
      ["0:12", "Myth 1: Thodi exercise bekaar?"],
      ["0:39", "Myth 2: Gym ke baad din bhar baithna?"],
      ["1:08", "Myth 3: Bachon ke liye khel time waste?"],
      ["1:35", "Myth 4: Weights sirf jawan logon ke liye?"],
      ["2:12", "Myth 5: Pregnancy ya bimari mein exercise?"],
      ["2:41", "Myth 6: Exercise na karne se kya farak?"],
      ["3:10", "Myth 7: Sirf walking kaafi?"],
      ["3:37", "Myth 8: Intense nahi toh fayda nahi?"],
      ["4:06", "Recap"],
      ["4:18", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO 2020 guidelines on physical activity (Bull et al., Br J Sports Med 2020)", "https://pubmed.ncbi.nlm.nih.gov/33239350/"],
      WHO_PA,
    ],
    tags: ["exercise myths hindi", "workout tips hinglish", "fitness for all ages", "walking vs weights"],
  },
  {
    id: "long-bp-heart-myths-8",
    date: "2026-11-20",
    title: "BP Aur Dil Ke 8 Jhooth Jo Khatarnaak Hain | WHO Facts Hinglish",
    intro: "BP high hoga toh pata chal jaayega? BP sirf budhon ki bimari? Heart attack matlab sirf seene mein dard?\nIs video mein BP aur dil ke 8 jhooth, har ek ka sach WHO ke source ke saath. Heart attack aur stroke ke signs zaroor dekhna.",
    chapters: [
      ["0:00", "Intro"],
      ["0:11", "Myth 1: BP high hoga toh pata chal jaayega?"],
      ["0:41", "Myth 2: BP sirf budhape ki bimari?"],
      ["1:10", "Myth 3: Ek high reading = BP ki bimari?"],
      ["1:40", "Myth 4: Dawai ke baad lifestyle zaroori nahi?"],
      ["2:13", "Myth 5: Exercise ka BP pe asar nahi?"],
      ["2:43", "Myth 6: Heart attack ke signs"],
      ["3:12", "Myth 7: Dil ki bimari sirf genes?"],
      ["3:42", "Myth 8: Pollution aur dil"],
      ["4:09", "Recap"],
      ["4:20", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO fact sheet, Hypertension", "https://www.who.int/news-room/fact-sheets/detail/hypertension"],
      ["WHO fact sheet, Cardiovascular diseases", "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)"],
    ],
    tags: ["bp myths hindi", "heart health hinglish", "high blood pressure", "heart attack signs"],
  },
  {
    id: "long-diabetes-myths-7",
    date: "2026-11-24",
    title: "Diabetes Ke 7 Jhooth Jo Sabse Zyada Chalte Hain | WHO Facts Hinglish",
    intro: "Sugar hogi toh symptoms se pata chal jaayega? Type 2 rok hi nahi sakte? Type 1 aur type 2 same?\nIs video mein diabetes ke 7 jhooth, har ek ka sach WHO ke source ke saath. Dawai aur ilaaj ka har faisla apne doctor ke saath karo.",
    chapters: [
      ["0:00", "Intro"],
      ["0:13", "Myth 1: Symptoms se turant pata?"],
      ["0:45", "Myth 2: Diabetes kuch hi logon ko?"],
      ["1:16", "Myth 3: Type 2 rok nahi sakte?"],
      ["1:48", "Myth 4: Type 1 aur type 2 same?"],
      ["2:31", "Myth 5: Diabetes aur dil"],
      ["3:04", "Myth 6: Diabetes mein exercise bekaar?"],
      ["3:33", "Myth 7: Bina wajah weight girna"],
      ["4:02", "Recap"],
      ["4:16", "Free trial + subscribe"],
    ],
    sources: [["WHO fact sheet, Diabetes", "https://www.who.int/news-room/fact-sheets/detail/diabetes"]],
    tags: ["diabetes myths hindi", "sugar ki bimari", "type 2 diabetes hinglish", "blood sugar"],
  },
  {
    id: "long-obesity-myths-7",
    date: "2026-11-28",
    title: "Motape Ke 7 Jhooth Jo Sab Sach Maante Hain | WHO Facts Hinglish",
    intro: "Motapa sirf looks ki baat? BMI normal toh sab theek? Bachche ka motapa apne aap jaayega? Sab willpower ka khel?\nIs video mein motape ke 7 jhooth, har ek ka sach WHO aur CDC ke source ke saath.",
    chapters: [
      ["0:00", "Intro"],
      ["0:13", "Myth 1: Motapa sirf looks?"],
      ["0:44", "Myth 2: Overweight kuch hi log?"],
      ["1:10", "Myth 3: BMI normal toh sab theek?"],
      ["1:43", "Myth 4: Bachon ka motapa apne aap?"],
      ["2:22", "Myth 5: Sirf willpower ki kami?"],
      ["2:56", "Myth 6: Neend aur weight"],
      ["3:26", "Myth 7: 2 hafte mein 10 kg?"],
      ["4:01", "Recap"],
      ["4:15", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO fact sheet, Obesity and overweight", "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight"],
      ["CDC, Losing Weight", "https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html"],
    ],
    tags: ["obesity myths hindi", "weight loss hinglish", "bmi waist", "motapa kaise kam kare"],
  },
  {
    id: "long-alcohol-tobacco-myths-8",
    date: "2026-12-02",
    title: "Daaru Aur Cigarette Ke 8 Jhooth | WHO Facts Hinglish",
    intro: "Thodi daaru safe hai? Ek-do peg dil ke liye achhe? Gutkha cigarette se safe? Chhodna namumkin?\nIs video mein daaru aur tobacco ke 8 jhooth, har ek ka sach WHO ke source ke saath. Chhodna chahte ho toh apne doctor se baat karo.",
    chapters: [
      ["0:00", "Intro"],
      ["0:12", "Myth 1: Thodi daaru safe?"],
      ["0:37", "Myth 2: Peg dil ke liye achha?"],
      ["1:08", "Myth 3: Mehngi daaru kam nuksan?"],
      ["1:36", "Myth 4: Sirf liver kharab?"],
      ["2:09", "Myth 5: Nuksan sirf budhape mein?"],
      ["2:38", "Myth 6: Gutkha-khaini safe?"],
      ["3:08", "Myth 7: Ghar walon pe asar"],
      ["3:36", "Myth 8: Chhodna namumkin?"],
      ["4:05", "Recap"],
      ["4:17", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO Europe, No level of alcohol consumption is safe for our health (2023)", "https://www.who.int/europe/news/item/04-01-2023-no-level-of-alcohol-consumption-is-safe-for-our-health"],
      ["WHO fact sheet, Alcohol", "https://www.who.int/news-room/fact-sheets/detail/alcohol"],
      ["WHO fact sheet, Tobacco and nicotine", "https://www.who.int/news-room/fact-sheets/detail/tobacco"],
    ],
    tags: ["alcohol myths hindi", "smoking chhodo", "gutkha nuksan", "daaru aur gym"],
  },
  {
    id: "long-anaemia-myths-6",
    date: "2026-12-06",
    title: "Khoon Ki Kami (Anaemia) Ke 6 Jhooth | WHO Facts Hinglish",
    intro: "Anaemia matlab bas thakaan? Heavy periods normal hain? Sirf khane ki kami se hota hai?\nIs video mein khoon ki kami ke 6 jhooth, har ek ka sach WHO ke source ke saath. Test aur ilaaj ka faisla apne doctor ke saath karo.",
    chapters: [
      ["0:00", "Intro"],
      ["0:14", "Myth 1: Bas thodi thakaan?"],
      ["0:48", "Myth 2: Kam logon ko hota hai?"],
      ["1:20", "Myth 3: Sirf khane ki kami?"],
      ["1:58", "Myth 4: Heavy periods normal?"],
      ["2:31", "Myth 5: Sirf ladkiyon ki problem?"],
      ["3:03", "Myth 6: Kuch nahi ho sakta?"],
      ["3:33", "Recap"],
      ["3:47", "Free trial + subscribe"],
    ],
    sources: [["WHO fact sheet, Anaemia", "https://www.who.int/news-room/fact-sheets/detail/anaemia"]],
    tags: ["anaemia hindi", "khoon ki kami", "women health hinglish", "haemoglobin"],
  },
  {
    id: "long-back-pain-myths-7",
    date: "2026-12-10",
    title: "Kamar Dard Ke 7 Jhooth | Bed Rest, Painkiller, Sciatica | WHO Facts Hinglish",
    intro: "Kamar dard matlab reedh kharab? Bed rest hi ilaaj hai? Painkiller pehla ilaaj?\nIs video mein kamar dard ke 7 jhooth, har ek ka sach WHO ke source ke saath. Jaanch aur ilaaj ka faisla apne doctor ke saath karo.",
    chapters: [
      ["0:00", "Intro"],
      ["0:12", "Myth 1: Reedh mein badi kharabi?"],
      ["0:44", "Myth 2: Sirf budhon ko hota hai?"],
      ["1:19", "Myth 3: Poora bed rest?"],
      ["1:52", "Myth 4: Painkiller pehla ilaaj?"],
      ["2:31", "Myth 5: Zindagi bhar rahega?"],
      ["3:03", "Myth 6: Weight, smoking, neend"],
      ["3:35", "Myth 7: Sirf kamar tak rehta hai?"],
      ["4:03", "Recap"],
      ["4:16", "Free trial + subscribe"],
    ],
    sources: [["WHO fact sheet, Low back pain", "https://www.who.int/news-room/fact-sheets/detail/low-back-pain"]],
    tags: ["kamar dard", "back pain hindi", "sciatica hinglish", "lower back pain"],
  },
  {
    id: "long-knee-pain-myths-7",
    date: "2026-12-14",
    title: "Ghutne Ke Dard Ke 7 Jhooth | Arthritis, Exercise, Weight | WHO Facts Hinglish",
    intro: "Ghutne ghis gaye toh exercise band? Arthritis sirf budhape mein? Supplements se theek ho jaata hai?\nIs video mein ghutne ke dard (osteoarthritis) ke 7 jhooth, har ek ka sach WHO ke source ke saath. Jaanch aur ilaaj ka faisla apne doctor ke saath karo.",
    chapters: [
      ["0:00", "Intro"],
      ["0:13", "Myth 1: Sirf budhape ki bimari?"],
      ["0:47", "Myth 2: Exercise band?"],
      ["1:19", "Myth 3: Weight ka lena-dena?"],
      ["1:48", "Myth 4: Mardon ki bimari?"],
      ["2:28", "Myth 5: Supplements se theek?"],
      ["2:58", "Myth 6: Purani chot ka asar"],
      ["3:30", "Myth 7: Kuch nahi ho sakta?"],
      ["4:01", "Recap"],
      ["4:15", "Free trial + subscribe"],
    ],
    sources: [["WHO fact sheet, Osteoarthritis", "https://www.who.int/news-room/fact-sheets/detail/osteoarthritis"]],
    tags: ["ghutne ka dard", "knee pain hindi", "arthritis hinglish", "osteoarthritis"],
  },
  {
    id: "long-after-60-myths-7",
    date: "2026-12-18",
    title: "60 Ke Baad Ke 7 Jhooth | Mummy-Papa Ki Fitness Aur Girne Se Bachaav | WHO Facts",
    intro: "60 ke baad sab kamzor ho jaate hain? Girna toh normal hai? Vitamin D sabko girne se bachata hai?\nIs video mein mummy-papa ki sehat ke 7 jhooth, har ek ka sach WHO ke source ke saath. Exercise, supplement aur dawai ka faisla unke doctor ke saath karo.",
    chapters: [
      ["0:00", "Intro"],
      ["0:12", "Myth 1: 60 ke baad sab kamzor?"],
      ["0:45", "Myth 2: Sab genes ka khel?"],
      ["1:14", "Myth 3: Girna normal hai?"],
      ["1:49", "Myth 4: Chalna-phirna kam karo?"],
      ["2:28", "Myth 5: Ghar toh safe hai?"],
      ["3:01", "Myth 6: Vitamin D sabko bachata hai?"],
      ["3:31", "Myth 7: Dawaiyan aur girna"],
      ["4:03", "Recap"],
      ["4:16", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO fact sheet, Ageing and health", "https://www.who.int/news-room/fact-sheets/detail/ageing-and-health"],
      ["WHO fact sheet, Falls", "https://www.who.int/news-room/fact-sheets/detail/falls"],
      WHO_PA,
    ],
    tags: ["senior fitness hindi", "buzurgon ki sehat", "fall prevention", "parents health hinglish"],
  },
];
export const longVideoFile = (v: LongVideo) => `/youtube/long/${v.id}.mp4`;
export const longVideoThumb = (v: LongVideo) => `/youtube/long/${v.id}.jpg`;

export function longVideoDescription(v: LongVideo): string {
  const trial = `${SITE_URL}/contact?utm_source=youtube&utm_medium=video&utm_campaign=long-myths&utm_content=${v.id}#trial`;
  return [
    v.intro,
    "Coach Aman Sharma, Royal Fitness Club, Sector 93 Noida (since 2019).",
    "",
    `Free trial book karo: ${trial}`,
    "Call / WhatsApp: 88518 30081",
    "Royal Fitness Club, Main Road, near Gali No. 3, Gejha Village, Sector 93, Noida 201304",
    "Mon–Sat 5:30–11 AM & 4–10 PM, Sunday closed",
    "",
    "Chapters",
    ...v.chapters.map(([t, label]) => `${t} ${label}`),
    "",
    "Sources",
    ...v.sources.map(([name, url]) => `- ${name}: ${url}`),
    "",
    MEDICAL,
  ].join("\n");
}

export const longVideoTags = (v: LongVideo) => [...new Set([...v.tags, ...BASE_TAGS])].slice(0, 15);

/** The first video whose date has come and that isn't on YouTube yet (or being uploaded). */
export function dueLongVideo(today: string, used: Iterable<string>, list: LongVideo[] = LONG_VIDEOS): LongVideo | null {
  const done = new Set(used);
  return list.find((v) => v.date <= today && !done.has(v.id)) ?? null;
}
