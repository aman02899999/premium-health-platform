// Ready-made long (16:9, 4–5 minute) myth-buster videos for the YouTube channel. The MP4 and its
// thumbnail live in public/youtube/long/; the YouTube cron uploads each one once, on or after its
// date (see runLongVideo in automation.ts). Every fact in a video was checked against the sources
// listed in its description before it was added here.
import { SITE_URL, YOUTUBE_CHANNEL } from "@/lib/site";

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
    // Pulled forward from 12 Nov at the owner's request (10 Nov): two extra long videos that day.
    date: "2026-11-10",
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
    // Pulled forward from 16 Nov with the one above.
    date: "2026-11-10",
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
  // Made 11 Nov 2026 for the 12 and 16 Nov gaps. Facts checked that day against each video's sources.
  {
    id: "long-salt-sugar-myths-7",
    date: "2026-11-12",
    title: "Namak Aur Cheeni Ke 7 Jhooth | Shahad, Juice, Sugar-Free | WHO Facts Hinglish",
    intro: "Upar se namak nahi daalte toh sab theek? Shahad aur fruit juice natural hain toh tension nahi? Sugar-free se weight kam?\nIs video mein namak aur cheeni ke 7 jhooth, har ek ka sach WHO ke source ke saath. BP, kidney ya diabetes ho toh apne doctor ki salah maano.",
    chapters: [
      ["0:00", "Intro"],
      ["0:13", "Myth 1: Upar se namak nahi daalta?"],
      ["0:45", "Myth 2: Thoda zyada namak chalega?"],
      ["1:19", "Myth 3: Namak poori tarah band?"],
      ["1:48", "Myth 4: Shahad aur juice natural?"],
      ["2:26", "Myth 5: Mithai nahi toh cheeni theek?"],
      ["3:00", "Myth 6: Sugar-free se weight kam?"],
      ["3:30", "Myth 7: Fruit band kar do?"],
      ["4:02", "Recap"],
      ["4:15", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO fact sheet, Sodium reduction", "https://www.who.int/news-room/fact-sheets/detail/sodium-reduction"],
      ["WHO fact sheet, Healthy diet", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"],
      ["WHO, Non-sugar sweeteners guideline (2023)", "https://www.who.int/news/item/15-05-2023-who-advises-not-to-use-non-sugar-sweeteners-for-weight-control-in-newly-released-guideline"],
    ],
    tags: ["namak kitna khaye", "cheeni ke nuksan", "sugar free weight loss", "salt sugar myths hindi"],
  },
  // Made 15 Nov 2026 from a topic list the owner sent (a viral "good, better, best" food chart).
  // None of that chart's artwork is used: food photos are CC0 / public domain (credits in
  // public/youtube/long/long-good-better-best-foods-8.credits.json). Its weak claims are corrected
  // on screen in each topic's FACT CHECK card. Facts checked that day against the sources below.
  {
    id: "long-good-better-best-foods-8",
    // Owner asked on 15 Nov for it to go up the same day.
    date: "2026-11-15",
    title: "Kya Khaayein? 8 Problems Ke Good, Better, Best Foods | Viral Chart Fact-Check",
    intro: "Dimaag, aankhein, neend, kabz, paani ki kami, khoon ki kami, immunity aur healthy umar: har problem ke liye GOOD, BETTER aur BEST food.\nInternet ke viral food charts mein kuch galtiyan bhi hain (badaam mein melatonin? red meat hi best? haldi immunity ki dawa?). Har galti ka sach source ke saath, aur har topic mein veg option bhi. Koi bimari hai, pregnancy hai ya dawai chal rahi hai toh diet badalne se pehle apne doctor se baat karo.",
    chapters: [
      ["0:00", "Intro: Good, Better, Best ka matlab"],
      ["0:16", "1. Dimaag aur focus"],
      ["1:00", "2. Aankhon ke liye"],
      ["1:45", "3. Healthy umar"],
      ["2:29", "4. Kabz se raahat"],
      ["3:19", "5. Gehri neend"],
      ["4:04", "6. Paani ki kami"],
      ["4:49", "7. Khoon ki kami"],
      ["5:34", "8. Immunity"],
      ["6:18", "Recap: sabka best"],
      ["6:31", "Free trial + subscribe"],
    ],
    sources: [
      ["Brenna et al. 2009, ALA to DHA conversion in humans", "https://pubmed.ncbi.nlm.nih.gov/19269799/"],
      ["MedlinePlus, Vitamin A", "https://medlineplus.gov/ency/article/002400.htm"],
      ["NEI, AREDS/AREDS2 (lutein and zeaxanthin)", "https://www.nei.nih.gov/research/clinical-trials/age-related-eye-disease-studies-aredsareds2"],
      ["Gärtner et al. 1997, lycopene from tomato paste vs fresh tomatoes", "https://pubmed.ncbi.nlm.nih.gov/9209178/"],
      ["WHO fact sheet, Healthy diet", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"],
      ["WHO fact sheet, Physical activity", "https://www.who.int/news-room/fact-sheets/detail/physical-activity"],
      ["NIDDK, Eating and diet for constipation", "https://www.niddk.nih.gov/health-information/digestive-diseases/constipation/eating-diet-nutrition"],
      ["MedlinePlus, Magnesium in diet", "https://medlineplus.gov/ency/article/002423.htm"],
      ["Lin et al. 2011, kiwifruit and sleep (24 adults, no control group)", "https://pubmed.ncbi.nlm.nih.gov/21669584/"],
      ["CDC, About Sleep", "https://www.cdc.gov/sleep/about/index.html"],
      ["CDC, Water and healthier drinks", "https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html"],
      ["WHO fact sheet, Diarrhoeal disease (ORS)", "https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease"],
      ["WHO fact sheet, Anaemia", "https://www.who.int/news-room/fact-sheets/detail/anaemia"],
      ["MedlinePlus, Iron in diet", "https://medlineplus.gov/ency/article/002422.htm"],
      ["MedlinePlus, Vitamin C", "https://medlineplus.gov/ency/article/002404.htm"],
      ["NCCIH, Garlic", "https://www.nccih.nih.gov/health/garlic"],
      ["NCCIH, Ginger", "https://www.nccih.nih.gov/health/ginger"],
      ["NCCIH, Turmeric", "https://www.nccih.nih.gov/health/turmeric"],
    ],
    tags: ["kya khaye", "healthy food hindi", "good better best foods", "diet tips hinglish", "food fact check"],
  },
  {
    id: "long-sleep-myths-7",
    date: "2026-11-16",
    title: "Neend Ke 7 Jhooth | 5 Ghante Kaafi? Weight Aur Gains Par Asar | CDC Facts",
    intro: "5 ghante ki neend kaafi? Weekend pe poori kar lenge? Phone chalate-chalate neend aa jaati hai? Neend ka weight se kya lena?\nIs video mein neend ke 7 jhooth, har ek ka sach CDC aur research ke source ke saath. Neend ki problem lagatar ho toh doctor se milo.",
    chapters: [
      ["0:00", "Intro"],
      ["0:13", "Myth 1: 5 ghante kaafi?"],
      ["0:44", "Myth 2: Weekend pe poora?"],
      ["1:14", "Myth 3: Neend aur weight"],
      ["1:45", "Myth 4: Phone se jaldi neend?"],
      ["2:22", "Myth 5: Raat ki chai-coffee"],
      ["2:53", "Myth 6: Exercise ka role"],
      ["3:24", "Myth 7: Din bhar neend normal?"],
      ["4:01", "Recap"],
      ["4:15", "Free trial + subscribe"],
    ],
    sources: [
      ["CDC, About Sleep", "https://www.cdc.gov/sleep/about/index.html"],
      ["Watson et al., Recommended amount of sleep for a healthy adult, 2015", "https://pubmed.ncbi.nlm.nih.gov/26039963/"],
      ["Spiegel et al., Ann Intern Med 2004 (sleep and hunger)", "https://pubmed.ncbi.nlm.nih.gov/15583226/"],
    ],
    tags: ["neend kitni zaroori", "sleep myths hindi", "neend aur weight loss", "sleep and muscle gain"],
  },
  // Made 15 Nov 2026, Part 2 of the "Kya Khaayein?" series (owner picked lifestyle problems).
  // Same animated renderer as Part 1; food photos are CC0 / public domain (credits in
  // public/youtube/long/long-kya-khaayein-lifestyle-9.credits.json). Each topic has a FACT CHECK card
  // for a common claim, a see-a-doctor line and no medicine doses. Facts checked that day.
  {
    id: "long-kya-khaayein-lifestyle-9",
    date: "2026-11-18",
    title: "Kya Khaayein? Part 2: BP, Sugar, Cholesterol, Thyroid, PCOS | Good, Better, Best",
    intro: "High BP, blood sugar, cholesterol, acidity, pet ki sehat, fatty liver, PCOS aur thyroid: har problem ke liye GOOD, BETTER aur BEST step.\nSaath mein 8 popular claims ka fact check (sendha namak safe hai? gud cheeni se better? anda cholesterol badhata hai? gobhi thyroid kharab karti hai?), har ek source ke saath. Dawai khud shuru ya band mat karo; koi bimari, pregnancy ya dawai chal rahi hai toh diet badalne se pehle apne doctor se baat karo.",
    chapters: [
      ["0:00", "Intro: Good, Better, Best ka matlab"],
      ["0:17", "1. High BP"],
      ["1:03", "2. Blood sugar"],
      ["1:49", "3. Cholesterol"],
      ["2:35", "4. Acidity"],
      ["3:25", "5. Pet ki sehat (gut)"],
      ["4:09", "6. Fatty liver"],
      ["4:54", "7. PCOS"],
      ["5:40", "8. Thyroid"],
      ["6:25", "Recap: sabka best"],
      ["6:38", "Free trial + subscribe"],
    ],
    sources: [
      ["Appel et al. 1997, DASH diet trial", "https://pubmed.ncbi.nlm.nih.gov/9099655/"],
      ["Sacks et al. 2001, DASH-Sodium trial", "https://pubmed.ncbi.nlm.nih.gov/11136953/"],
      ["WHO fact sheet, Sodium reduction", "https://www.who.int/news-room/fact-sheets/detail/sodium-reduction"],
      ["WHO fact sheet, Healthy diet (free sugars)", "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"],
      ["NIDDK, Diabetes diet, eating and physical activity", "https://www.niddk.nih.gov/health-information/diabetes/overview/diet-eating-physical-activity"],
      ["Buffey et al. 2022, light walking breaks and blood sugar (review)", "https://pubmed.ncbi.nlm.nih.gov/35147898/"],
      ["Whitehead et al. 2014, oat beta-glucan and cholesterol (28 trials)", "https://pubmed.ncbi.nlm.nih.gov/25411276/"],
      ["Carson et al. 2020, AHA advisory on dietary cholesterol", "https://pubmed.ncbi.nlm.nih.gov/31838890/"],
      ["WHO fact sheet, Trans fat", "https://www.who.int/news-room/fact-sheets/detail/trans-fat"],
      ["NIDDK, Eating and diet for GER and GERD", "https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults/eating-diet-nutrition"],
      ["NIDDK, Treatment for GER and GERD", "https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults/treatment"],
      ["NCCIH, Probiotics: usefulness and safety", "https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety"],
      ["NIDDK, Eating and diet for fatty liver (NAFLD)", "https://www.niddk.nih.gov/health-information/liver-disease/nafld-nash/eating-diet-nutrition"],
      ["NIDDK, Treatment for fatty liver (NAFLD)", "https://www.niddk.nih.gov/health-information/liver-disease/nafld-nash/treatment"],
      ["Vilar-Gomez et al. 2015, weight loss and NASH (293 patients)", "https://pubmed.ncbi.nlm.nih.gov/25865049/"],
      ["Teede et al. 2023, international PCOS guideline", "https://pubmed.ncbi.nlm.nih.gov/37580037/"],
      ["MedlinePlus, Iodine in diet", "https://medlineplus.gov/ency/article/002421.htm"],
      ["MedlinePlus, Levothyroxine (how to take it)", "https://medlineplus.gov/druginfo/meds/a682461.html"],
      ["Galanty et al. 2024, brassica vegetables and thyroid (review)", "https://pubmed.ncbi.nlm.nih.gov/38612798/"],
    ],
    tags: ["kya khaye", "bp diet hindi", "sugar diet hinglish", "thyroid diet", "pcos diet hindi"],
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
  // Myth-buster batch (16 Nov 2026): 6 viral claims with a FAKE / ADHURA SACH verdict, a source on
  // screen for each, charts where numbers help, coach tip, recap and CTA. Animated renderer, own
  // EDM/trance track (credits in public/youtube/long/long-supplement-myths-10.credits.json).
  {
    id: "long-supplement-myths-10",
    date: "2026-11-21",
    title: "Supplement Ke 6 Jhooth: Creatine, Whey, Fat Burner | Fact Check Hinglish",
    intro: "Creatine kidney kharab karta hai? Creatine se baal jhadte hain? Whey matlab steroid? Fat burner se charbi pighalti hai?\nGym mein sabse zyada suni jaane wali 6 supplement baatein, lab report style mein test ki: har ek ka verdict (FAKE ya ADHURA SACH), research ke saath. Kidney, liver ya koi bimari ho, ya dawai chal rahi ho, toh koi bhi supplement doctor se pooch ke hi lo.",
    chapters: [
      ["0:00", "Intro: lab report"],
      ["0:16", "1. Creatine aur kidney"],
      ["0:43", "2. Creatine aur baal"],
      ["1:18", "3. Whey = steroid?"],
      ["1:51", "4. Zyada protein aur kidney"],
      ["2:27", "5. Fat burner pills"],
      ["2:55", "6. Multivitamin vs khaana"],
      ["3:23", "Recap: 6 verdict"],
      ["3:36", "Free trial + subscribe"],
    ],
    sources: [
      ["Kreider et al. 2017, ISSN position stand on creatine", "https://pubmed.ncbi.nlm.nih.gov/28615996/"],
      ["van der Merwe et al. 2009, creatine and DHT in rugby players", "https://pubmed.ncbi.nlm.nih.gov/19741313/"],
      ["Lak et al. 2025, creatine and hair: randomised trial", "https://pubmed.ncbi.nlm.nih.gov/40265319/"],
      ["NIDA, Anabolic steroids", "https://nida.nih.gov/research-topics/anabolic-steroids"],
      ["Devries et al. 2018, protein intake and kidney function (meta-analysis)", "https://pubmed.ncbi.nlm.nih.gov/30383278/"],
      ["USDA FoodData Central (protein per 100 g)", "https://fdc.nal.usda.gov/"],
      ["FDA, Questions and answers on dietary supplements", "https://www.fda.gov/food/information-consumers-using-dietary-supplements/questions-and-answers-dietary-supplements"],
      ["USPSTF 2022, vitamin and mineral supplements (JAMA)", "https://pubmed.ncbi.nlm.nih.gov/35727271/"],
    ],
    tags: ["supplement myths hindi", "creatine side effects hindi", "whey protein steroid", "fat burner sach", "fact check hinglish"],
  },
  // Myth-buster batch (16 Nov 2026): 6 viral claims with a FAKE / ADHURA SACH verdict, a source on
  // screen for each, charts where numbers help, coach tip, recap and CTA. Animated renderer, own
  // EDM/trance track (credits in public/youtube/long/long-weight-loss-hacks-11.credits.json).
  {
    id: "long-weight-loss-hacks-11",
    date: "2026-11-23",
    title: "Weight Loss Ke 6 Viral Hacks: Jeera Paani, ACV, Detox | Sach Ya Jhooth?",
    intro: "Subah jeera ya nimbu-shahad paani se charbi pighalti hai? Apple cider vinegar se pet andar? Jitna paseena utni charbi? 3 din ka detox?\nFamily group mein aane wale 6 weight loss forwards ka fact check, research aur charts ke saath. Diabetes, thyroid, pregnancy ya koi dawai chal rahi ho toh diet badalne se pehle doctor se baat karo.",
    chapters: [
      ["0:00", "Intro: family group forwards"],
      ["0:16", "1. Jeera / nimbu-shahad paani"],
      ["0:52", "2. Apple cider vinegar"],
      ["1:18", "3. Paseena = charbi?"],
      ["1:58", "4. Detox juice cleanse"],
      ["2:26", "5. Carbs band karo"],
      ["3:02", "6. Breakfast skip"],
      ["3:28", "Recap: 6 verdict"],
      ["3:41", "Free trial + subscribe"],
    ],
    sources: [
      ["Dennis et al. 2010, water before meals and weight loss", "https://pubmed.ncbi.nlm.nih.gov/19661958/"],
      ["Launholt et al. 2020, vinegar and health (review)", "https://pubmed.ncbi.nlm.nih.gov/32170375/"],
      ["Meerman & Brown 2014, When somebody loses weight, where does the fat go? (BMJ)", "https://pubmed.ncbi.nlm.nih.gov/25516540/"],
      ["NCCIH, Detoxes and cleanses", "https://www.nccih.nih.gov/health/detoxes-and-cleanses-what-you-need-to-know"],
      ["Hall et al. 2015, cutting fat vs cutting carbs (Cell Metabolism)", "https://pubmed.ncbi.nlm.nih.gov/26278052/"],
      ["Sievert et al. 2019, breakfast and weight (BMJ meta-analysis)", "https://pubmed.ncbi.nlm.nih.gov/30700403/"],
    ],
    tags: ["weight loss myths hindi", "jeera water weight loss", "apple cider vinegar sach", "detox fact check", "fat loss hinglish"],
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
  // Myth-buster batch (16 Nov 2026): 6 viral claims with a FAKE / ADHURA SACH verdict, a source on
  // screen for each, charts where numbers help, coach tip, recap and CTA. Animated renderer, own
  // EDM/trance track (credits in public/youtube/long/long-whatsapp-forwards-12.credits.json).
  {
    id: "long-whatsapp-forwards-12",
    date: "2026-11-25",
    title: "WhatsApp Ke 6 Viral Health Forwards: Microwave, Ajinomoto, Cancer | Fact Check",
    intro: "Microwave ka khaana cancer deta hai? Ajinomoto zehar hai? Machhli ke baad doodh se safed daag? Cheeni se cancer tez failta hai?\nBreaking news style mein 6 viral WhatsApp health forwards ka fact check, FDA, NCI aur MedlinePlus ke saath. Forward karne se pehle source dekho. Cancer ka ilaaj sirf doctor ki salah se; jadi-booti ke bharose ilaaj mat chhodo.",
    chapters: [
      ["0:00", "Intro: fact check desk"],
      ["0:16", "1. Microwave aur cancer"],
      ["0:42", "2. Ajinomoto (MSG)"],
      ["1:09", "3. Machhli + doodh = safed daag?"],
      ["1:43", "4. Cheeni aur cancer"],
      ["2:10", "5. Deodorant aur breast cancer"],
      ["2:38", "6. Jadi-booti se cancer khatam?"],
      ["3:04", "Recap: 6 verdict"],
      ["3:17", "Free trial + subscribe"],
    ],
    sources: [
      ["FDA, Microwave oven radiation", "https://www.fda.gov/radiation-emitting-products/resources-you-radiation-emitting-products/microwave-oven-radiation"],
      ["FDA, Questions and answers on monosodium glutamate (MSG)", "https://www.fda.gov/food/food-additives-petitions/questions-and-answers-monosodium-glutamate-msg"],
      ["MedlinePlus, Vitiligo", "https://medlineplus.gov/ency/article/000831.htm"],
      ["National Cancer Institute, Common cancer myths and misconceptions", "https://www.cancer.gov/about-cancer/causes-prevention/risk/myths"],
    ],
    tags: ["whatsapp forward fact check", "microwave cancer sach", "ajinomoto msg sach", "health myths hindi", "fake news health"],
  },
  // Myth-buster batch (16 Nov 2026): 6 viral claims with a FAKE / ADHURA SACH verdict, a source on
  // screen for each, charts where numbers help, coach tip, recap and CTA. Animated renderer, own
  // EDM/trance track (credits in public/youtube/long/long-gym-rumours-13.credits.json).
  {
    id: "long-gym-rumours-13",
    date: "2026-11-27",
    title: "Gym Ke 6 Rumours: Squats, Cardio, Heavy Weights | Myth vs Fact",
    intro: "Squats ghutne kharab karte hain? Teenagers weights uthayenge toh height rukegi? Cardio se muscle khatam? Sirf heavy weight se muscle?\nScoreboard style mein gym ke 6 rumours ka fact check, sports science research ke saath. Dard, purani chot ya koi bimari ho toh pehle doctor ya physio se baat karo.",
    chapters: [
      ["0:00", "Intro: myth vs fact scoreboard"],
      ["0:16", "1. Squats aur ghutne"],
      ["0:43", "2. Teenagers aur height"],
      ["1:09", "3. Cardio vs muscle"],
      ["1:50", "4. Sirf heavy weight?"],
      ["2:26", "5. Stretching aur injury"],
      ["2:53", "6. Weekend workout"],
      ["3:28", "Recap: 6 verdict"],
      ["3:41", "Free trial + subscribe"],
    ],
    sources: [
      ["Hartmann et al. 2013, squat depth and knee safety (review)", "https://pubmed.ncbi.nlm.nih.gov/23821469/"],
      ["Faigenbaum et al. 2009, NSCA youth resistance training position statement", "https://pubmed.ncbi.nlm.nih.gov/19620931/"],
      ["Schumann et al. 2022, concurrent training (meta-analysis, 43 studies)", "https://pubmed.ncbi.nlm.nih.gov/34757594/"],
      ["Schoenfeld et al. 2017, low vs high load training (meta-analysis)", "https://pubmed.ncbi.nlm.nih.gov/28834797/"],
      ["Behm et al. 2016, stretching and performance/injury (review)", "https://pubmed.ncbi.nlm.nih.gov/26642915/"],
      ["O'Donovan et al. 2017, weekend warrior activity and mortality", "https://pubmed.ncbi.nlm.nih.gov/28097313/"],
      ["WHO fact sheet, Physical activity", "https://www.who.int/news-room/fact-sheets/detail/physical-activity"],
    ],
    tags: ["gym myths hindi", "squats knee pain sach", "cardio muscle loss", "gym rumours", "workout fact check"],
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
  // Myth-buster batch (16 Nov 2026): 6 viral claims with a FAKE / ADHURA SACH verdict, a source on
  // screen for each, charts where numbers help, coach tip, recap and CTA. Animated renderer, own
  // EDM/trance track (credits in public/youtube/long/long-water-drink-myths-14.credits.json).
  {
    id: "long-water-drink-myths-14",
    date: "2026-11-29",
    title: "Paani Aur Drinks Ke 6 Jhooth: 8 Glass, Coffee, Energy Drink | Fact Check",
    intro: "Har insaan ko theek 8 glass paani? Chai-coffee se paani ki kami? Energy drink healthy? Alkaline water se cancer rukta hai?\nSehat ki adaalat mein paani aur drinks ke 6 daave, har ek ka verdict research ke saath. Kidney ya dil ki bimari ho toh paani kitna peena hai, apne doctor se poochho.",
    chapters: [
      ["0:00", "Intro: sehat ki adaalat"],
      ["0:16", "1. Roz 8 glass paani?"],
      ["0:52", "2. Chai-coffee aur paani"],
      ["1:18", "3. Energy drinks"],
      ["1:58", "4. Alkaline water"],
      ["2:24", "5. Sports drinks"],
      ["2:50", "6. Jitna zyada paani utna achha?"],
      ["3:18", "Recap: 6 verdict"],
      ["3:31", "Free trial + subscribe"],
    ],
    sources: [
      ["Valtin 2002, Drink at least eight glasses of water a day? Really?", "https://pubmed.ncbi.nlm.nih.gov/12376390/"],
      ["MedlinePlus, Water in diet", "https://medlineplus.gov/ency/article/002471.htm"],
      ["Killer et al. 2014, coffee and hydration", "https://pubmed.ncbi.nlm.nih.gov/24416202/"],
      ["NCCIH, Energy drinks", "https://www.nccih.nih.gov/health/energy-drinks"],
      ["Fenton & Huang 2016, alkaline diet and cancer (systematic review)", "https://pubmed.ncbi.nlm.nih.gov/27297008/"],
      ["ACSM 2007, Exercise and fluid replacement", "https://pubmed.ncbi.nlm.nih.gov/17277604/"],
      ["MedlinePlus, Hyponatremia (low blood sodium)", "https://medlineplus.gov/ency/article/000394.htm"],
      ["Hew-Butler et al. 2015, exercise-associated hyponatremia consensus", "https://pubmed.ncbi.nlm.nih.gov/26227507/"],
    ],
    tags: ["8 glass water myth", "coffee dehydration sach", "energy drink side effects hindi", "alkaline water fact check", "paani kitna piye"],
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
  // December 2026. Facts checked on 10 Nov 2026 against the pages in each video's sources.
  {
    id: "long-air-pollution-myths-6",
    date: "2026-12-22",
    title: "Pollution Ke 6 Jhooth Jo Har Sardi Sunte Hain | WHO Facts Hinglish",
    intro: "Pollution sirf Delhi ki problem? Bas thodi khaansi? Ghar ke andar sab safe? Smog hai toh exercise band?\nIs video mein pollution ke 6 jhooth, har ek ka sach WHO ke source ke saath. Asthma ya dil ki bimari ho toh apne doctor ki salah maano.",
    chapters: [
      ["0:00", "Intro"],
      ["0:14", "Myth 1: Sirf Delhi-NCR ki problem?"],
      ["0:46", "Myth 2: Bas thodi khaansi?"],
      ["1:23", "Myth 3: Sirf phephde kharab?"],
      ["2:04", "Myth 4: Ghar ki hawa saaf?"],
      ["2:39", "Myth 5: Hum kuch nahi kar sakte?"],
      ["3:13", "Myth 6: Exercise band kar dein?"],
      ["3:47", "Recap"],
      ["4:01", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO fact sheet, Ambient (outdoor) air quality and health", "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health"],
      ["WHO fact sheet, Physical activity", "https://www.who.int/news-room/fact-sheets/detail/physical-activity"],
    ],
    tags: ["pollution myths hindi", "smog aur exercise", "aqi noida", "delhi ncr pollution"],
  },
  {
    id: "long-kids-fitness-myths-7",
    date: "2026-12-26",
    title: "Bachchon Ki Fitness Ke 7 Jhooth | Phone, Khel, Neend | WHO Facts",
    intro: "Bachche toh khelte hi rehte hain? Phone dikhake khana chalta hai? Gol-matol bachcha healthy? Khel se padhai kharab?\nChhuttiyon ke liye bachchon ki fitness ke 7 jhooth, har ek ka sach WHO ke source ke saath. Bachche ki sehat ka koi sawaal ho toh apne doctor se poochho.",
    chapters: [
      ["0:00", "Intro"],
      ["0:13", "Myth 1: Bachche khelte hi rehte hain?"],
      ["0:46", "Myth 2: Phone dikhake khana?"],
      ["1:22", "Myth 3: Gol-matol = healthy?"],
      ["1:54", "Myth 4: Khel se padhai kharab?"],
      ["2:31", "Myth 5: Ladkiyon ke liye zaroori nahi?"],
      ["3:01", "Myth 6: Neend kam chalegi?"],
      ["3:33", "Myth 7: Juice se energy?"],
      ["4:03", "Recap"],
      ["4:16", "Free trial + subscribe"],
    ],
    sources: [
      ["WHO fact sheet, Physical activity", "https://www.who.int/news-room/fact-sheets/detail/physical-activity"],
      ["WHO fact sheet, Obesity and overweight", "https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight"],
      ["WHO, To grow up healthy, children need to sit less and play more (2019)", "https://www.who.int/news/item/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more"],
    ],
    tags: ["bachchon ki fitness", "kids screen time hindi", "parenting hinglish", "bachcho ka motapa"],
  },
  {
    id: "long-new-year-myths-7",
    date: "2026-12-30",
    title: "New Year Resolution Ke 7 Jhooth | 2027 Mein Gym Mat Chhodna",
    intro: "21 din mein aadat? Pehle din se 7 din gym? Ek mahine mein 10 kilo? Protein shake zaroori?\nIs video mein New Year fitness resolution ke 7 jhooth, har ek ka sach source ke saath, taaki 2027 mein February tak gym na chhoote.",
    chapters: [
      ["0:00", "Intro"],
      ["0:13", "Myth 1: 21 din mein aadat?"],
      ["0:45", "Myth 2: Pehle din se 7 din gym?"],
      ["1:17", "Myth 3: Ek mahine mein 8-10 kilo?"],
      ["1:52", "Myth 4: Pehle cardio, weights baad mein?"],
      ["2:32", "Myth 5: Protein shake zaroori?"],
      ["3:04", "Myth 6: Neend kam chalegi?"],
      ["3:34", "Myth 7: Ek din miss = sab khatam?"],
      ["4:03", "Recap"],
      ["4:16", "Free trial + subscribe"],
    ],
    sources: [
      ["Lally et al., How are habits formed, Eur J Soc Psychol 2010", "https://doi.org/10.1002/ejsp.674"],
      ["WHO Guidelines on Physical Activity and Sedentary Behaviour, 2020", "https://www.who.int/publications/i/item/9789240015128"],
      ["CDC, Losing Weight", "https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html"],
      ["ISSN Position Stand: Protein and exercise, 2017", "https://pubmed.ncbi.nlm.nih.gov/28642676/"],
      ["Watson et al., Recommended amount of sleep for a healthy adult, 2015", "https://pubmed.ncbi.nlm.nih.gov/26039963/"],
      ["Spiegel et al., Ann Intern Med 2004 (sleep and hunger)", "https://pubmed.ncbi.nlm.nih.gov/15583226/"],
    ],
    tags: ["new year resolution hindi", "gym motivation hinglish", "fitness goals 2027", "weight loss tips hindi"],
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
    "👍 Video kaam ki lagi? Like karo aur channel SUBSCRIBE karo. Roz 1-minute ki tips Shorts mein aati hain.",
    `🔔 Subscribe: ${YOUTUBE_CHANNEL.subscribe}`,
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
