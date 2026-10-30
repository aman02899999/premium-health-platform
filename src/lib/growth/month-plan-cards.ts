// The month plan's feed posts: 60 cheat-sheet cards (2 a day for 30 days), dark and premium,
// written from scratch for Royal Fitness Club. Morning cards teach training, afternoon cards teach
// food and lifestyle. Rules for every card:
//   - every number that is a health fact names its source on the card (`source`);
//   - workout sets and reps are programming suggestions, not health claims, and say "adjust to you";
//   - no supplement or medicine doses: "as advised by your doctor" only;
//   - diet and training support treatment, they never cure; health cards carry the medical note;
//   - no invented results, reviews or counts.
// Values marked ≈ are approximate and vary by brand, recipe and cooking.

export type CardGoal = "join" | "diet" | "pt";

export type Card = {
  id: string;
  /** Small line above the title, e.g. "STRENGTH SCIENCE". */
  series: string;
  /** Two title lines: the first in white, the second in gold. */
  title: [string, string];
  subtitle: string;
  /** Column headings for a single table (optional). */
  columns?: [string, string];
  /** One section = a full-width table; 2–6 sections = boxes in a grid. Rows are [label, value]. */
  sections: { head?: string; rows: [string, string][] }[];
  /** The one-line lesson at the bottom of the card. */
  footer: string;
  /** Where the numbers come from (shown on the card and in the caption). */
  source?: string;
  /** Caption paragraph: why this matters, in plain words. */
  caption: string;
  /** What the call to action sells. */
  goal: CardGoal;
  medical?: boolean;
  tags: string[];
};

const ACSM = "ACSM Position Stand, Progression Models in Resistance Training, 2009";
const WHO_PA = "WHO Guidelines on Physical Activity, 2020";
const IFCT = "Indian Food Composition Tables (NIN, 2017) and USDA FoodData Central";

export const CARDS: Card[] = [
  // ---------------- Day 1 ----------------
  {
    id: "beginner-full-body",
    series: "ROYAL PROGRAMS",
    title: ["BEGINNER", "FULL-BODY 3-DAY"],
    subtitle: "Mon · Wed · Fri — the first 8 weeks done right",
    columns: ["EXERCISE", "SETS × REPS"],
    sections: [
      {
        rows: [
          ["Goblet Squat", "3 × 10–12"],
          ["Dumbbell Bench Press", "3 × 8–12"],
          ["Seated Cable Row", "3 × 10–12"],
          ["Romanian Deadlift (DB)", "3 × 10"],
          ["Lat Pulldown", "3 × 10–12"],
          ["Plank", "3 × 20–40 s"],
        ],
      },
    ],
    footer: "Same plan, slightly heavier every week. That's the whole secret.",
    source: `Rep ranges: ${ACSM}`,
    caption: "New to the gym? You don't need a 6-day bodybuilder split. Three full-body sessions a week train every muscle often enough to learn the moves and get stronger. Add a little weight when all sets feel smooth. Sets and reps are a starting point: a coach adjusts them to you.",
    goal: "join",
    tags: ["BeginnerWorkout", "FullBodyWorkout", "GymBeginner"],
  },
  {
    id: "protein-indian-foods",
    series: "DESI NUTRITION",
    title: ["PROTEIN IN", "INDIAN FOODS"],
    subtitle: "Approximate protein per serving",
    columns: ["FOOD (SERVING)", "PROTEIN ≈"],
    sections: [
      {
        rows: [
          ["Eggs (2 large)", "12 g"],
          ["Chicken breast (100 g, cooked)", "31 g"],
          ["Paneer (100 g)", "18 g"],
          ["Soya chunks (30 g, dry)", "15 g"],
          ["Moong dal (30 g, raw)", "7 g"],
          ["Curd (200 g)", "7 g"],
          ["Milk (250 ml)", "8 g"],
        ],
      },
    ],
    footer: "Put one protein food on every plate, not all of it at dinner.",
    source: IFCT,
    caption: "Most of us eat roti, rice and sabzi and call it a meal, then wonder why we feel hungry and soft. Here is what a normal serving of common Indian proteins gives you. Values are approximate and change with brand and cooking.",
    goal: "diet",
    tags: ["ProteinFoods", "IndianDiet", "VegProtein"],
  },
  // ---------------- Day 2 ----------------
  {
    id: "rep-ranges",
    series: "STRENGTH SCIENCE",
    title: ["REP RANGES", "DECODED"],
    subtitle: "Pick the range for your goal",
    columns: ["GOAL", "TYPICAL RANGE"],
    sections: [
      {
        rows: [
          ["Max strength", "1–6 reps, heavy"],
          ["Muscle size", "6–12 reps, moderate"],
          ["Muscular endurance", "15+ reps, light"],
          ["Rest (heavy lifts)", "2–3 min"],
          ["Rest (lighter work)", "1–2 min"],
        ],
      },
    ],
    footer: "Muscle grows in many ranges when sets end close to failure.",
    source: ACSM,
    caption: "Heavy, low reps build the most strength. Moderate reps are the classic muscle-building zone, but studies show muscle can grow across a wide range as long as the set is hard. Use all three over a year.",
    goal: "pt",
    tags: ["StrengthTraining", "Hypertrophy", "GymScience"],
  },
  {
    id: "plate-method",
    series: "DESI NUTRITION",
    title: ["THE ROYAL", "THALI METHOD"],
    subtitle: "Build a fat-loss plate without counting",
    sections: [
      { head: "½ PLATE", rows: [["Sabzi & salad", "2 katori"], ["Raita or soup", "optional"]] },
      { head: "¼ PLATE", rows: [["Protein", "dal, paneer, egg, chicken"], ["Size", "palm-sized"]] },
      { head: "¼ PLATE", rows: [["Carbs", "roti, rice, millet"], ["Size", "fist-sized"]] },
      { head: "ADD", rows: [["Fat", "1 tsp ghee or oil"], ["Water", "1 glass before"]] },
    ],
    footer: "Same food you love. Better proportions.",
    caption: "You don't need a foreign diet to lose fat. Fill half the plate with vegetables, a quarter with protein, a quarter with roti or rice. Your hands are the measuring cups.",
    goal: "diet",
    tags: ["FatLossDiet", "IndianThali", "PortionControl"],
  },
  // ---------------- Day 3 ----------------
  {
    id: "push-pull-legs",
    series: "ROYAL PROGRAMS",
    title: ["PUSH · PULL · LEGS", "6-DAY SPLIT"],
    subtitle: "For lifters with 6+ months of training",
    sections: [
      { head: "PUSH", rows: [["Bench Press", "4 × 6–8"], ["Incline DB Press", "3 × 8–10"], ["Shoulder Press", "3 × 8–10"], ["Triceps Pushdown", "3 × 12"]] },
      { head: "PULL", rows: [["Barbell Row", "4 × 6–8"], ["Lat Pulldown", "3 × 10"], ["Face Pull", "3 × 15"], ["EZ-Bar Curl", "3 × 10–12"]] },
      { head: "LEGS", rows: [["Back Squat", "4 × 6–8"], ["Romanian Deadlift", "3 × 8"], ["Leg Press", "3 × 10–12"], ["Calf Raise", "4 × 12–15"]] },
      { head: "REPEAT", rows: [["Days 4–6", "same order"], ["Day 7", "rest + walk"], ["Progress", "+1 rep or +2.5 kg"], ["Deload", "every 6–8 weeks"]] },
    ],
    footer: "Every muscle, twice a week. Recovery is part of the plan.",
    source: "Training each muscle twice a week: Schoenfeld et al., Sports Med 2016",
    caption: "Push, pull, legs, repeat. Each muscle gets hit twice a week, which research links to better growth than once a week. Not for beginners: earn it with 6 months of consistent full-body training first.",
    goal: "pt",
    tags: ["PushPullLegs", "PPL", "WorkoutSplit"],
  },
  {
    id: "water-needs",
    series: "DAILY BASICS",
    title: ["HOW MUCH", "WATER?"],
    subtitle: "Total water from drinks and food, per day",
    columns: ["WHO", "ADEQUATE INTAKE"],
    sections: [
      {
        rows: [
          ["Adult women", "≈ 2.0 L / day"],
          ["Adult men", "≈ 2.5 L / day"],
          ["Training day / summer", "more: drink to thirst"],
          ["Quick check", "pale-yellow urine"],
        ],
      },
    ],
    footer: "Keep a bottle where you can see it.",
    source: "EFSA Scientific Opinion on Dietary Reference Values for Water, 2010",
    caption: "These are total water amounts, and about a fifth usually comes from food (dal, sabzi, fruit, curd). Noida summers and hard sessions push the need up. If you have kidney or heart problems, follow your doctor's limit instead.",
    goal: "join",
    medical: true,
    tags: ["Hydration", "DrinkWater", "HealthyHabits"],
  },
  // ---------------- Day 4 ----------------
  {
    id: "progressive-overload",
    series: "STRENGTH SCIENCE",
    title: ["5 WAYS TO", "PROGRESS"],
    subtitle: "Progressive overload isn't only more weight",
    columns: ["METHOD", "EXAMPLE"],
    sections: [
      {
        rows: [
          ["Add weight", "60 kg → 62.5 kg"],
          ["Add reps", "3 × 8 → 3 × 10"],
          ["Add a set", "3 sets → 4 sets"],
          ["Slow the lowering", "1 s → 3 s down"],
          ["Cleaner form", "full range, no bounce"],
        ],
      },
    ],
    footer: "Beat last week by a little. Write it down.",
    source: ACSM,
    caption: "Your body adapts to what you ask of it, then stops. Asking for a little more each week is how strength and muscle keep coming. Weight is only one of the dials.",
    goal: "pt",
    tags: ["ProgressiveOverload", "StrengthTraining", "GymTips"],
  },
  {
    id: "veg-protein-day",
    series: "DESI NUTRITION",
    title: ["A VEG DAY", "WITH PROTEIN"],
    subtitle: "Sample day, no eggs or meat",
    columns: ["MEAL", "PROTEIN SOURCE"],
    sections: [
      {
        rows: [
          ["Breakfast", "Besan chilla + curd"],
          ["Mid-morning", "Roasted chana"],
          ["Lunch", "Rajma + rice + salad"],
          ["Evening", "Milk or lassi (no sugar)"],
          ["Dinner", "Paneer bhurji + roti"],
          ["Swap in", "Soya, tofu, moong sprouts"],
        ],
      },
    ],
    footer: "Vegetarian is not the problem. Low protein is.",
    caption: "A vegetarian Indian diet can be high in protein when every meal has a protein food. This is a pattern, not a prescription: portions depend on your body and goal.",
    goal: "diet",
    tags: ["VegetarianProtein", "VegDiet", "IndianFood"],
  },
  // ---------------- Day 5 ----------------
  {
    id: "squat-checklist",
    series: "FORM CHECK",
    title: ["THE SQUAT", "CHECKLIST"],
    subtitle: "Six cues before you add weight",
    columns: ["CUE", "WHY"],
    sections: [
      {
        rows: [
          ["Feet shoulder-width, toes slightly out", "room for hips"],
          ["Brace like you'll be punched", "protects the back"],
          ["Knees follow the toes", "no caving in"],
          ["Sit between the heels", "stay balanced"],
          ["Depth you can control", "no rounding"],
          ["Drive the floor away", "full lockout"],
        ],
      },
    ],
    footer: "Film one set from the side. Your phone is a coach.",
    caption: "Squats are safe and powerful when the basics are right. If something pinches, stop and get it checked: pain is information, not a test of willpower. Our trainers check form on the floor every day.",
    goal: "pt",
    tags: ["SquatForm", "LegDay", "FormCheck"],
  },
  {
    id: "sleep-recovery",
    series: "RECOVERY",
    title: ["SLEEP IS", "A SUPPLEMENT"],
    subtitle: "The free recovery tool most people skip",
    columns: ["HABIT", "TARGET"],
    sections: [
      {
        rows: [
          ["Sleep for adults", "7+ hours a night"],
          ["Same wake-up time", "± 30 min daily"],
          ["Screens off", "30–60 min before bed"],
          ["Room", "dark, cool, quiet"],
          ["Tea / coffee", "not late in the day"],
        ],
      },
    ],
    footer: "Train hard. Sleep harder.",
    source: "AASM & Sleep Research Society consensus, Watson et al., Sleep 2015",
    caption: "Short sleep makes hunger louder, workouts feel heavier and recovery slower. The 7-hour figure is the adult consensus; the habits are coaching suggestions. If you snore loudly or wake up tired every day, see a doctor.",
    goal: "join",
    medical: true,
    tags: ["SleepWell", "Recovery", "FitnessLifestyle"],
  },
  // ---------------- Day 6 ----------------
  {
    id: "upper-lower",
    series: "ROYAL PROGRAMS",
    title: ["UPPER / LOWER", "4-DAY SPLIT"],
    subtitle: "Mon Upper A · Tue Lower A · Thu Upper B · Fri Lower B",
    sections: [
      { head: "UPPER A", rows: [["Bench Press", "4 × 5–8"], ["Barbell Row", "4 × 6–8"], ["Seated DB Press", "3 × 8–10"], ["Chin-ups / Pulldown", "3 × 8–10"]] },
      { head: "LOWER A", rows: [["Back Squat", "4 × 5–8"], ["Romanian Deadlift", "3 × 8"], ["Walking Lunge", "3 × 10/leg"], ["Plank", "3 × 40 s"]] },
      { head: "UPPER B", rows: [["Incline DB Press", "3 × 8–12"], ["Cable Row", "3 × 10–12"], ["Lateral Raise", "3 × 12–15"], ["Curl + Pushdown", "3 × 12"]] },
      { head: "LOWER B", rows: [["Deadlift", "3 × 5"], ["Leg Press", "3 × 10–12"], ["Leg Curl", "3 × 10–12"], ["Calf Raise", "4 × 12–15"]] },
    ],
    footer: "Four days, every muscle twice. Fits a working week.",
    source: "Frequency: Schoenfeld et al., Sports Med 2016",
    caption: "The upper/lower split is the sweet spot for busy professionals: four sessions, each muscle trained twice a week, and three full rest days. Adjust the weights to you, never the other way round.",
    goal: "pt",
    tags: ["UpperLowerSplit", "WorkoutPlan", "StrengthTraining"],
  },
  {
    id: "protein-target",
    series: "NUTRITION SCIENCE",
    title: ["YOUR DAILY", "PROTEIN TARGET"],
    subtitle: "Grams per kg of body weight, per day",
    columns: ["WHO", "PROTEIN / KG / DAY"],
    sections: [
      {
        rows: [
          ["Healthy adult (minimum)", "≈ 0.8 g"],
          ["Lifting to build muscle", "≈ 1.6 g (up to 2.2)"],
          ["Active people (range)", "1.4–2.0 g"],
          ["Example, 70 kg lifter", "≈ 112 g a day"],
        ],
      },
    ],
    footer: "Kidney disease or a medical diet? Your doctor sets your number.",
    source: "ICMR-NIN 2020; Morton et al., Br J Sports Med 2018; ISSN Position Stand 2017",
    caption: "The minimum keeps a sedentary adult healthy. People who lift and want muscle benefit from more: a large review found gains level off around 1.6 g per kg a day. Spread it across meals. If you have a kidney condition, don't raise protein without your doctor.",
    goal: "diet",
    medical: true,
    tags: ["ProteinIntake", "MuscleGain", "NutritionFacts"],
  },
  // ---------------- Day 7 ----------------
  {
    id: "rpe-rir",
    series: "STRENGTH SCIENCE",
    title: ["HOW HARD IS", "HARD ENOUGH?"],
    subtitle: "Reps in reserve (RIR): reps you could still do",
    columns: ["RIR", "WHAT IT FEELS LIKE"],
    sections: [
      {
        rows: [
          ["0 RIR", "couldn't do one more"],
          ["1–2 RIR", "1–2 left: best for most sets"],
          ["3–4 RIR", "challenging, still smooth"],
          ["5+ RIR", "warm-up territory"],
        ],
      },
    ],
    footer: "Most working sets: stop 1–3 reps before failure.",
    source: "Zourdos et al., J Strength Cond Res 2016 (RIR-based RPE scale)",
    caption: "Ten easy reps don't build much. Ten hard reps do. Rate every set by how many more you could have done, and keep most sets 1 to 3 reps short of failure. Safe, and still effective.",
    goal: "pt",
    tags: ["RPE", "TrainingIntensity", "GymScience"],
  },
  {
    id: "healthy-swaps",
    series: "DESI NUTRITION",
    title: ["SMART", "DESI SWAPS"],
    subtitle: "Same craving, better choice",
    columns: ["INSTEAD OF", "TRY"],
    sections: [
      {
        rows: [
          ["Namkeen / bhujia", "Roasted chana or makhana"],
          ["Cold drink", "Nimbu pani, no sugar"],
          ["Maida bread", "Besan or moong chilla"],
          ["Fried samosa", "Paneer or sprouts chaat"],
          ["Sweet lassi", "Chaas or plain dahi"],
          ["Biscuits with chai", "A fruit or a handful of nuts"],
        ],
      },
    ],
    footer: "You don't need willpower. You need a better default.",
    caption: "You won't stick to food you hate. Keep the taste you love and swap the version: more protein, more fibre, less sugar and deep frying.",
    goal: "diet",
    tags: ["HealthySwaps", "IndianSnacks", "CleanEating"],
  },
  // ---------------- Day 8 ----------------
  {
    id: "warm-up",
    series: "FORM CHECK",
    title: ["THE 8-MINUTE", "WARM-UP"],
    subtitle: "Before every lifting session",
    columns: ["STEP", "TIME"],
    sections: [
      {
        rows: [
          ["Cycle, row or brisk walk", "3 min"],
          ["Arm circles & band pull-aparts", "1 min"],
          ["Bodyweight squats & lunges", "1 min"],
          ["Hip hinges & glute bridges", "1 min"],
          ["Ramp-up sets of first lift", "2 min"],
        ],
      },
    ],
    footer: "Warm muscles lift more and complain less.",
    caption: "Walking in and loading the bar cold is how strains happen. Eight minutes raises your temperature, wakes up the joints and rehearses the first lift with light weight.",
    goal: "pt",
    tags: ["WarmUp", "InjuryPrevention", "GymRoutine"],
  },
  {
    id: "bmr-formula",
    series: "NUTRITION SCIENCE",
    title: ["CALORIES AT", "REST (BMR)"],
    subtitle: "Mifflin–St Jeor equation (W kg, H cm, A years)",
    columns: ["WHO", "FORMULA"],
    sections: [
      {
        rows: [
          ["Men", "10W + 6.25H − 5A + 5"],
          ["Women", "10W + 6.25H − 5A − 161"],
          ["Example: man, 70 kg, 175 cm, 30 y", "≈ 1,649 kcal"],
          ["Then × activity", "≈ 1.2 (desk) to 1.7 (very active)"],
        ],
      },
    ],
    footer: "An estimate to start from. Your scale trend decides the rest.",
    source: "Mifflin et al., Am J Clin Nutr 1990",
    caption: "BMR is what your body burns doing nothing. Multiply by your activity to estimate maintenance, then adjust by watching your weekly average weight. Formulas are a starting point, not a verdict.",
    goal: "diet",
    tags: ["CalorieCounting", "BMR", "FatLossScience"],
  },
  // ---------------- Day 9 ----------------
  {
    id: "chest-day",
    series: "ROYAL PROGRAMS",
    title: ["CHEST DAY", "BLUEPRINT"],
    subtitle: "Upper, middle and lower chest in one session",
    columns: ["EXERCISE", "SETS × REPS"],
    sections: [
      {
        rows: [
          ["Barbell Bench Press", "4 × 6–8"],
          ["Incline Dumbbell Press", "3 × 8–10"],
          ["Weighted Dips (or machine)", "3 × 8–10"],
          ["Cable Fly (high to low)", "3 × 12–15"],
          ["Push-ups to near failure", "2 sets"],
        ],
      },
    ],
    footer: "Shoulders down and back on every press.",
    caption: "Heavy compound first, then angles, then a stretch movement and a finisher. Keep the shoulder blades pinned and the elbows about 45 degrees from the body to keep the shoulders happy. Adjust to your level.",
    goal: "pt",
    tags: ["ChestDay", "ChestWorkout", "BenchPress"],
  },
  {
    id: "asian-bmi",
    series: "HEALTH CHECK",
    title: ["BMI & WAIST", "FOR INDIANS"],
    subtitle: "Indian cut-offs are lower than Western ones",
    columns: ["MEASURE", "INDIAN CUT-OFF"],
    sections: [
      {
        rows: [
          ["Normal BMI", "18.0–22.9"],
          ["Overweight BMI", "23.0–24.9"],
          ["Obese BMI", "25 and above"],
          ["Waist (men), higher risk", "90 cm and above"],
          ["Waist (women), higher risk", "80 cm and above"],
        ],
      },
    ],
    footer: "Measure your waist at the belly button, relaxed.",
    source: "Misra et al., Consensus guidelines for Asian Indians, JAPI 2009",
    caption: "Indians tend to carry more belly fat at the same BMI, so the risk lines start lower. BMI can't tell muscle from fat, so lifters should look at waist size too. A number is a reason to check in with your doctor, not a diagnosis.",
    goal: "join",
    medical: true,
    tags: ["BMI", "BellyFat", "IndianHealth"],
  },
  // ---------------- Day 10 ----------------
  {
    id: "back-day",
    series: "ROYAL PROGRAMS",
    title: ["BACK: WIDTH", "& THICKNESS"],
    subtitle: "Vertical pulls for width, rows for thickness",
    sections: [
      { head: "WIDTH", rows: [["Pull-ups / Pulldown", "4 × 6–10"], ["Straight-arm Pulldown", "3 × 12–15"]] },
      { head: "THICKNESS", rows: [["Barbell Row", "4 × 6–8"], ["Chest-supported Row", "3 × 10–12"]] },
      { head: "UPPER BACK", rows: [["Face Pull", "3 × 15"], ["Shrugs", "3 × 10–12"]] },
      { head: "CUES", rows: [["Lead with elbows", "not hands"], ["Pause & squeeze", "1 second"]] },
    ],
    footer: "A strong back is the best posture fix.",
    caption: "Most people train what they see in the mirror. Your back is half your upper body: train it as hard as your chest and your shoulders will thank you. Sets and reps are a starting point.",
    goal: "pt",
    tags: ["BackDay", "BackWorkout", "VTaper"],
  },
  {
    id: "steps",
    series: "DAILY BASICS",
    title: ["STEPS THAT", "MATTER"],
    subtitle: "What a large analysis found about daily steps",
    columns: ["AGE GROUP", "BENEFIT LEVELLED OFF AT"],
    sections: [
      {
        rows: [
          ["Adults under 60", "≈ 8,000–10,000 steps"],
          ["Adults 60+", "≈ 6,000–8,000 steps"],
          ["Starting from low?", "+1,000 a day each week"],
          ["Easy wins", "walk after meals, take stairs"],
        ],
      },
    ],
    footer: "Lift 3 days, walk every day.",
    source: "Paluch et al., Lancet Public Health 2022",
    caption: "In a study of over 47,000 adults, more daily steps went with lower risk of death, until the benefit levelled off around these numbers. You don't need 20,000. You need to move every day.",
    goal: "join",
    tags: ["DailySteps", "WalkMore", "NEAT"],
  },
  // ---------------- Day 11 ----------------
  {
    id: "periodisation",
    series: "STRENGTH SCIENCE",
    title: ["PLAN YOUR", "TRAINING YEAR"],
    subtitle: "Three simple ways coaches organise training",
    columns: ["APPROACH", "HOW IT WORKS"],
    sections: [
      {
        rows: [
          ["Linear", "weeks get heavier, reps drop"],
          ["Undulating", "heavy, medium, light days in a week"],
          ["Block", "4 weeks size → 4 weeks strength → test"],
          ["Deload", "lighter week every 4–8 weeks"],
          ["Autoregulate", "adjust load to how you feel (RIR)"],
        ],
      },
    ],
    footer: "Random workouts get random results.",
    source: ACSM,
    caption: "Periodisation just means planning change on purpose so you keep improving without burning out. Beginners do best with linear progress; after a year, waves and blocks keep things moving.",
    goal: "pt",
    tags: ["Periodization", "StrengthCoach", "TrainingPlan"],
  },
  {
    id: "sugar-salt",
    series: "HEALTH CHECK",
    title: ["SUGAR & SALT", "DAILY LIMITS"],
    subtitle: "What WHO recommends for adults",
    columns: ["ITEM", "LIMIT"],
    sections: [
      {
        rows: [
          ["Free sugars", "under 10% of calories"],
          ["Better still", "under 5% (≈ 25 g on 2,000 kcal)"],
          ["Salt", "under 5 g a day (≈ 1 tsp)"],
          ["Hidden in", "namkeen, pickles, sauces, cold drinks"],
        ],
      },
    ],
    footer: "Read the label: sugar and sodium hide well.",
    source: "WHO Guideline: Sugars intake, 2015; WHO fact sheet on sodium",
    caption: "Free sugars are the ones added to food and drinks, plus honey and juices. One soft drink can use up most of a day's limit. If you have high BP or diabetes, your doctor's targets come first.",
    goal: "diet",
    medical: true,
    tags: ["SugarFree", "LowSalt", "HealthyIndia"],
  },
  // ---------------- Day 12 ----------------
  {
    id: "home-workout",
    series: "ROYAL PROGRAMS",
    title: ["NO GYM?", "NO EXCUSE"],
    subtitle: "20-minute home circuit · 3–4 rounds",
    columns: ["MOVE", "REPS"],
    sections: [
      {
        rows: [
          ["Squats", "15"],
          ["Push-ups (knees ok)", "8–12"],
          ["Reverse Lunges", "10 / leg"],
          ["Glute Bridges", "15"],
          ["Plank Shoulder Taps", "20"],
          ["Rest between rounds", "60–90 s"],
        ],
      },
    ],
    footer: "Busy day? Do this. Then come back to the iron tomorrow.",
    caption: "Travelling, late meeting, rain? A short home circuit keeps the habit alive. It won't replace heavy training forever, but it beats a zero day every time. Stop if anything hurts.",
    goal: "join",
    tags: ["HomeWorkout", "NoEquipment", "QuickWorkout"],
  },
  {
    id: "fibre",
    series: "DESI NUTRITION",
    title: ["FIBRE: THE", "FORGOTTEN NUTRIENT"],
    subtitle: "Adults: at least 25 g of natural fibre a day",
    columns: ["EASY SOURCE", "WHY IT HELPS"],
    sections: [
      {
        rows: [
          ["Whole dals & rajma", "keeps you full"],
          ["Sabzi & salad", "volume, few calories"],
          ["Atta with chokar, millets", "steadier energy"],
          ["Fruit (whole, not juice)", "fibre stays in"],
          ["Flax or chia (1 tbsp)", "easy add-on"],
        ],
      },
    ],
    footer: "Add slowly and drink water with it.",
    source: "WHO Guideline: Carbohydrate intake for adults and children, 2023",
    caption: "Fibre fills you up, feeds good gut bacteria and slows how fast sugar hits your blood. Most city diets fall short. Add it gradually so your stomach can adjust.",
    goal: "diet",
    tags: ["FibreFoods", "GutHealth", "IndianDiet"],
  },
  // ---------------- Day 13 ----------------
  {
    id: "deadlift-checklist",
    series: "FORM CHECK",
    title: ["DEADLIFT", "WITHOUT FEAR"],
    subtitle: "Set-up decides the lift",
    columns: ["CUE", "WHY"],
    sections: [
      {
        rows: [
          ["Bar over mid-foot", "straight bar path"],
          ["Hips back, shins to bar", "load the hamstrings"],
          ["Chest up, lats tight", "flat back"],
          ["Push the floor away", "legs start the lift"],
          ["Stand tall, don't lean back", "spine stays neutral"],
          ["Lower under control", "same path down"],
        ],
      },
    ],
    footer: "Light and perfect beats heavy and ugly.",
    caption: "Deadlifts build the whole back of your body. Learn them light with a coach watching, and add weight only when every rep looks the same. Old back injury? Get cleared by your doctor first.",
    goal: "pt",
    tags: ["Deadlift", "FormCheck", "Powerlifting"],
  },
  {
    id: "protein-per-meal",
    series: "NUTRITION SCIENCE",
    title: ["PROTEIN", "PER MEAL"],
    subtitle: "Spread it, don't save it for dinner",
    columns: ["BODY WEIGHT", "PER MEAL ≈ 0.4 G/KG"],
    sections: [
      {
        rows: [
          ["55 kg", "≈ 22 g × 4 meals"],
          ["70 kg", "≈ 28 g × 4 meals"],
          ["85 kg", "≈ 34 g × 4 meals"],
          ["What ≈ 28 g looks like", "150 g paneer"],
        ],
      },
    ],
    footer: "Breakfast is where most Indian diets lose protein.",
    source: "Schoenfeld & Aragon, J Int Soc Sports Nutr 2018",
    caption: "A review suggests about 0.4 g per kg per meal, over at least four meals, to make the most of muscle building. It's a guide, not a rule. If you have kidney disease, follow your doctor's advice.",
    goal: "diet",
    medical: true,
    tags: ["ProteinTiming", "MealPlanning", "MuscleGain"],
  },
  // ---------------- Day 14 ----------------
  {
    id: "women-strength",
    series: "ROYAL PROGRAMS",
    title: ["WOMEN'S", "STRENGTH 3-DAY"],
    subtitle: "Strong legs, strong back, confident posture",
    sections: [
      { head: "DAY 1", rows: [["Goblet Squat", "3 × 10"], ["DB Row", "3 × 10"], ["Hip Thrust", "3 × 10–12"]] },
      { head: "DAY 2", rows: [["Romanian Deadlift", "3 × 10"], ["DB Shoulder Press", "3 × 10"], ["Step-ups", "3 × 10/leg"]] },
      { head: "DAY 3", rows: [["Leg Press", "3 × 12"], ["Lat Pulldown", "3 × 10–12"], ["Dead Bug", "3 × 10/side"]] },
      { head: "TRUTH", rows: [["\"Bulky\" from lifting?", "a myth"], ["What it builds", "strength, bones"]] },
    ],
    footer: "Lifting won't make you bulky. It makes you capable.",
    source: `Strength training for bone and muscle health: ${WHO_PA}`,
    caption: "WHO recommends muscle-strengthening work at least two days a week for all adults. For women, lifting builds the shape most people call 'toned', plus stronger bones with age. Our Female's Special plan includes a calorie-based diet plan.",
    goal: "join",
    tags: ["WomenWhoLift", "StrongWomen", "GirlsWhoLift"],
  },
  {
    id: "activity-guidelines",
    series: "HEALTH CHECK",
    title: ["THE WEEKLY", "MINIMUM"],
    subtitle: "Physical activity for adults 18–64",
    columns: ["TYPE", "PER WEEK"],
    sections: [
      {
        rows: [
          ["Moderate cardio (brisk walk)", "150–300 min"],
          ["or Vigorous cardio (running)", "75–150 min"],
          ["Muscle strengthening", "2+ days"],
          ["Sitting", "less, and break it up"],
        ],
      },
    ],
    footer: "Something is better than nothing. More is better still.",
    source: WHO_PA,
    caption: "This is the global minimum for health, not for a six-pack. Three gym sessions plus daily walks covers it. Starting from zero? Start small and build up.",
    goal: "join",
    tags: ["ActiveLifestyle", "WHO", "ExerciseDaily"],
  },
  // ---------------- Day 15 ----------------
  {
    id: "one-rep-max",
    series: "STRENGTH SCIENCE",
    title: ["ESTIMATE YOUR", "1-REP MAX"],
    subtitle: "Epley formula: 1RM ≈ weight × (1 + reps ÷ 30)",
    columns: ["YOU LIFTED", "ESTIMATED 1RM"],
    sections: [
      {
        rows: [
          ["60 kg × 5", "≈ 70 kg"],
          ["80 kg × 8", "≈ 101 kg"],
          ["100 kg × 3", "≈ 110 kg"],
          ["Most accurate", "sets under 10 reps"],
        ],
      },
    ],
    footer: "Know your numbers without testing a true max.",
    source: "Epley B., Poundage Chart, 1985",
    caption: "Testing a real one-rep max is risky without experience and a spotter. The Epley formula estimates it from a hard set, which you can use to set your training weights. Estimates get rough above 10 reps.",
    goal: "pt",
    tags: ["1RM", "StrengthTest", "Powerlifting"],
  },
  {
    id: "fat-loss-rate",
    series: "FAT LOSS SCIENCE",
    title: ["HOW FAST", "SHOULD YOU LOSE?"],
    subtitle: "Slow enough to keep your muscle",
    columns: ["BODY WEIGHT", "≈ 0.5–1% PER WEEK"],
    sections: [
      {
        rows: [
          ["60 kg", "0.3–0.6 kg / week"],
          ["80 kg", "0.4–0.8 kg / week"],
          ["100 kg", "0.5–1.0 kg / week"],
          ["Faster than this?", "muscle and energy suffer"],
        ],
      },
    ],
    footer: "Judge the weekly average, not one morning.",
    source: "Helms et al., J Int Soc Sports Nutr 2014",
    caption: "Crash diets drop weight fast and take muscle with it. Research on lean athletes suggests 0.5–1% of body weight a week keeps more muscle. The first week can drop faster because of water.",
    goal: "diet",
    tags: ["FatLoss", "WeightLossTips", "SustainableFatLoss"],
  },
  // ---------------- Day 16 ----------------
  {
    id: "shoulders",
    series: "ROYAL PROGRAMS",
    title: ["3D SHOULDERS", "BLUEPRINT"],
    subtitle: "Front, side and rear delts",
    columns: ["EXERCISE", "SETS × REPS"],
    sections: [
      {
        rows: [
          ["Seated DB Shoulder Press", "4 × 8–10"],
          ["Cable Lateral Raise", "4 × 12–15"],
          ["Rear Delt Fly / Reverse Pec Deck", "3 × 15"],
          ["Face Pull", "3 × 15"],
          ["Upright Row (wide grip)", "2 × 12"],
        ],
      },
    ],
    footer: "Side and rear delts make the width. Train them often.",
    caption: "Pressing already works the front delts. The side and rear delts need direct work, light and strict, with high reps. Shoulder pain overhead? Skip that move and get it checked.",
    goal: "pt",
    tags: ["ShoulderWorkout", "BoulderShoulders", "DeltDay"],
  },
  {
    id: "eating-out",
    series: "DESI NUTRITION",
    title: ["EATING OUT", "CHEAT SHEET"],
    subtitle: "Order smart at any Indian restaurant",
    columns: ["PICK", "OVER"],
    sections: [
      {
        rows: [
          ["Tandoori chicken / tikka", "Butter chicken"],
          ["Dal tadka", "Dal makhani"],
          ["Tandoori roti", "Butter naan"],
          ["Paneer tikka", "Paneer butter masala"],
          ["Jeera rice (1 katori)", "Biryani (large plate)"],
          ["Chaas", "Cold drink"],
        ],
      },
    ],
    footer: "Enjoy the outing. Choose the cooking method.",
    caption: "The difference is mostly cream, butter and oil, not the dish. Grilled and tandoori beats gravy-heavy for calories, and you still get the taste.",
    goal: "diet",
    tags: ["EatingOut", "RestaurantHacks", "SmartEating"],
  },
  // ---------------- Day 17 ----------------
  {
    id: "rest-times",
    series: "STRENGTH SCIENCE",
    title: ["REST BETWEEN", "SETS"],
    subtitle: "Rest is part of the program",
    columns: ["SET TYPE", "REST"],
    sections: [
      {
        rows: [
          ["Heavy squats, deadlifts, bench", "2–3 min (or more)"],
          ["Muscle-building sets", "1–2 min"],
          ["Small muscles (arms, calves)", "60–90 s"],
          ["Circuits / conditioning", "30–60 s"],
        ],
      },
    ],
    footer: "Scrolling for 7 minutes isn't rest. It's a different workout.",
    source: ACSM,
    caption: "Rest too little before heavy sets and your strength drops. Rest too long and you lose an hour. Use a timer: it keeps your workouts productive and on time.",
    goal: "pt",
    tags: ["RestPeriods", "GymTips", "TrainSmart"],
  },
  {
    id: "pre-post-workout",
    series: "DESI NUTRITION",
    title: ["PRE & POST", "WORKOUT FOOD"],
    subtitle: "Simple Indian options",
    sections: [
      { head: "60–90 MIN BEFORE", rows: [["Banana + curd", "light"], ["Poha with peanuts", "steady"], ["Toast + eggs", "filling"]] },
      { head: "WITHIN 2 H AFTER", rows: [["Dal + rice + sabzi", "classic"], ["Paneer roti wrap", "quick"], ["Eggs + roti + salad", "easy"]] },
      { head: "EARLY MORNING", rows: [["Fruit or a few dates", "if hungry"], ["Then a full breakfast", "after"]] },
      { head: "ALWAYS", rows: [["Water", "before & after"], ["Total daily protein", "matters most"]] },
    ],
    footer: "Daily totals beat perfect timing.",
    caption: "You don't need a shaker the second you finish. A normal meal with protein and carbs within a couple of hours works. Train early? Something light, or nothing, is fine if you feel good.",
    goal: "diet",
    tags: ["PreWorkoutMeal", "PostWorkout", "IndianFood"],
  },
  // ---------------- Day 18 ----------------
  {
    id: "core",
    series: "ROYAL PROGRAMS",
    title: ["CORE THAT'S", "NOT CRUNCHES"],
    subtitle: "Train the core to resist, not just to bend",
    columns: ["EXERCISE", "SETS × REPS"],
    sections: [
      {
        rows: [
          ["Plank", "3 × 30–60 s"],
          ["Dead Bug", "3 × 10 / side"],
          ["Pallof Press", "3 × 12 / side"],
          ["Farmer's Carry", "3 × 30 m"],
          ["Hanging Knee Raise", "3 × 10–15"],
        ],
      },
    ],
    footer: "Abs are built in the gym and revealed in the kitchen.",
    caption: "Your core's real job is to keep your spine steady while your arms and legs move. These moves train exactly that. Visible abs also depend on body fat, which comes down to food and consistency.",
    goal: "pt",
    tags: ["CoreWorkout", "AbsWorkout", "CoreStrength"],
  },
  {
    id: "max-heart-rate",
    series: "CARDIO SCIENCE",
    title: ["HEART RATE", "ZONES"],
    subtitle: "Max HR ≈ 208 − 0.7 × age",
    columns: ["ZONE", "≈ % OF MAX HR"],
    sections: [
      {
        rows: [
          ["Easy (can chat freely)", "50–60%"],
          ["Moderate (can talk, can't sing)", "60–75%"],
          ["Hard (few words only)", "75–90%"],
          ["Example: age 30", "max ≈ 187 bpm"],
        ],
      },
    ],
    footer: "The talk test works even without a watch.",
    source: "Tanaka, Monahan & Seals, J Am Coll Cardiol 2001",
    caption: "Most cardio should feel moderate: you can talk but not sing. Max heart rate formulas are estimates and can be off by 10+ beats for an individual. On BP or heart medication? Ask your doctor for your own targets.",
    goal: "join",
    medical: true,
    tags: ["HeartRateZones", "Cardio", "Zone2"],
  },
  // ---------------- Day 19 ----------------
  {
    id: "legs-glutes",
    series: "ROYAL PROGRAMS",
    title: ["LEGS & GLUTES", "BUILDER"],
    subtitle: "Quads, hamstrings and glutes in 60 minutes",
    columns: ["EXERCISE", "SETS × REPS"],
    sections: [
      {
        rows: [
          ["Back Squat or Hack Squat", "4 × 6–10"],
          ["Romanian Deadlift", "3 × 8–10"],
          ["Bulgarian Split Squat", "3 × 8 / leg"],
          ["Hip Thrust", "3 × 10–12"],
          ["Leg Curl", "3 × 12"],
          ["Standing Calf Raise", "4 × 12–15"],
        ],
      },
    ],
    footer: "Never skip leg day. Your walk, stairs and knees depend on it.",
    caption: "Big lifts first while you're fresh, single-leg work to fix imbalances, then isolation to finish. Expect to be sore the first time. Start lighter than your ego wants.",
    goal: "pt",
    tags: ["LegDay", "GluteWorkout", "NeverSkipLegDay"],
  },
  {
    id: "label-reading",
    series: "SMART SHOPPING",
    title: ["READ A FOOD", "LABEL IN 20 S"],
    subtitle: "Five checks in the supermarket aisle",
    columns: ["CHECK", "LOOK FOR"],
    sections: [
      {
        rows: [
          ["Serving size", "is it the whole pack?"],
          ["Protein per 100 g", "higher is better"],
          ["Sugar", "first 3 ingredients? skip"],
          ["Sodium", "high in namkeen & soups"],
          ["\"Multigrain\" / \"diet\"", "marketing, check the numbers"],
        ],
      },
    ],
    footer: "The front of the pack sells. The back tells.",
    caption: "'Healthy' on the front means nothing. Ingredients are listed from most to least, so if sugar or maida comes first, that's what you're buying.",
    goal: "diet",
    tags: ["FoodLabels", "HealthyShopping", "NutritionTips"],
  },
  // ---------------- Day 20 ----------------
  {
    id: "arms",
    series: "ROYAL PROGRAMS",
    title: ["ARMS DAY", "BLUEPRINT"],
    subtitle: "Biceps and triceps, both trained properly",
    sections: [
      { head: "BICEPS", rows: [["EZ-Bar Curl", "3 × 8–12"], ["Incline DB Curl", "3 × 10–12"], ["Hammer Curl", "3 × 12"]] },
      { head: "TRICEPS", rows: [["Close-Grip Bench", "3 × 8–10"], ["Overhead Cable Ext.", "3 × 10–12"], ["Rope Pushdown", "3 × 12–15"]] },
      { head: "CUES", rows: [["Elbows still", "no swinging"], ["Full stretch", "every rep"]] },
      { head: "FREQUENCY", rows: [["Direct arm work", "2 × a week"], ["Plus", "all your presses & rows"]] },
    ],
    footer: "Want bigger arms? Train triceps as hard as biceps.",
    caption: "Everyone curls. Fewer people train triceps properly, and they are a big part of the arm. Use controlled reps and a full stretch: swinging the weight trains your ego, not your arms.",
    goal: "pt",
    tags: ["ArmDay", "Biceps", "Triceps"],
  },
  {
    id: "ghar-ka-khana",
    series: "DESI NUTRITION",
    title: ["GHAR KA KHANA", "FAT-LOSS EDITION"],
    subtitle: "Small changes to the food you already eat",
    columns: ["MEAL", "ONE CHANGE"],
    sections: [
      {
        rows: [
          ["Paratha", "less ghee, add paneer stuffing"],
          ["Dal", "thicker dal, smaller rice portion"],
          ["Sabzi", "1 tsp oil, double the serving"],
          ["Roti", "count them: 2 instead of 4"],
          ["Dessert", "small katori, after a full meal"],
        ],
      },
    ],
    footer: "No boiled-chicken punishment needed.",
    caption: "Indian home food is not the enemy. Portions, oil and sugar are. Change one thing per meal and keep the taste your family loves.",
    goal: "diet",
    tags: ["GharKaKhana", "IndianFatLoss", "HomeFood"],
  },
  // ---------------- Day 21 ----------------
  {
    id: "tempo",
    series: "TRAINING TOOLS",
    title: ["TEMPO", "TRAINING"],
    subtitle: "Read it as: lower – pause – lift – pause",
    columns: ["TEMPO", "USE IT FOR"],
    sections: [
      {
        rows: [
          ["3-0-1-0", "control and muscle feel"],
          ["2-1-1-0", "pause at the bottom, no bounce"],
          ["4-0-1-0", "beginners learning form"],
          ["1-0-X-0", "explosive power (X = fast)"],
        ],
      },
    ],
    footer: "Lighter weight, slower reps, same hard effort.",
    caption: "Controlling the lowering part of a rep keeps tension on the muscle and makes form errors obvious. Slow tempos need lighter weights: that's the point.",
    goal: "pt",
    tags: ["TempoTraining", "TimeUnderTension", "GymScience"],
  },
  {
    id: "maintenance-calories",
    series: "FAT LOSS SCIENCE",
    title: ["CALORIES BY", "GOAL"],
    subtitle: "Start from maintenance, adjust by results",
    columns: ["GOAL", "STARTING POINT"],
    sections: [
      {
        rows: [
          ["Find maintenance", "BMR × activity factor"],
          ["Fat loss", "≈ 300–500 kcal below"],
          ["Lean muscle gain", "≈ 200–300 kcal above"],
          ["Check every 2 weeks", "weekly average weight"],
        ],
      },
    ],
    footer: "Numbers start the plan. Results steer it.",
    source: "BMR: Mifflin et al., Am J Clin Nutr 1990",
    caption: "Calculators give you a first guess, nothing more. Eat that for two weeks, look at your weekly average weight, and adjust. Pregnant, diabetic or on medicines? Plan this with your doctor.",
    goal: "diet",
    medical: true,
    tags: ["CalorieDeficit", "LeanBulk", "MacroCounting"],
  },
  // ---------------- Day 22 ----------------
  {
    id: "45-minute",
    series: "ROYAL PROGRAMS",
    title: ["THE 45-MINUTE", "WORKOUT"],
    subtitle: "For busy professionals: supersets save time",
    columns: ["PAIR", "SETS × REPS"],
    sections: [
      {
        rows: [
          ["A1 Squat + A2 Pull-down", "4 × 8 each"],
          ["B1 DB Bench + B2 DB Row", "3 × 10 each"],
          ["C1 RDL + C2 Shoulder Press", "3 × 10 each"],
          ["D Plank + Carry", "2 rounds"],
          ["Rest", "60–90 s after each pair"],
        ],
      },
    ],
    footer: "No time is usually no plan.",
    caption: "Pair two exercises that don't tire the same muscle and alternate them. You do the same work in less time. Morning batch from 5:30 AM or evening from 4 PM: pick the slot you'll actually keep.",
    goal: "join",
    tags: ["QuickWorkout", "BusyProfessionals", "Supersets"],
  },
  {
    id: "fruits",
    series: "DESI NUTRITION",
    title: ["FRUIT", "MYTH vs FACT"],
    subtitle: "Fruit is not the reason you're not losing fat",
    columns: ["MYTH", "FACT"],
    sections: [
      {
        rows: [
          ["\"Fruit has sugar, avoid it\"", "whole fruit comes with fibre"],
          ["\"Banana makes you fat\"", "total calories decide"],
          ["\"Juice = fruit\"", "juice loses the fibre"],
          ["\"Eat fruit only at night\"", "any time works"],
          ["Diabetic?", "portion & timing with your doctor"],
        ],
      },
    ],
    footer: "Eat the fruit. Skip the juice.",
    caption: "Whole fruit fills you up for few calories. Juice and shakes with added sugar are a different story. If you have diabetes, ask your doctor or dietitian how much fruit suits you.",
    goal: "diet",
    medical: true,
    tags: ["FruitFacts", "MythBusting", "HealthyEating"],
  },
  // ---------------- Day 23 ----------------
  {
    id: "deload",
    series: "RECOVERY",
    title: ["THE DELOAD", "WEEK"],
    subtitle: "Back off to come back stronger",
    columns: ["SIGN YOU NEED ONE", "WHAT TO DO"],
    sections: [
      {
        rows: [
          ["Weights feel heavier for 2 weeks", "cut sets by half"],
          ["Joints achy, sleep poor", "same lifts, ≈ 60–70% load"],
          ["No motivation", "keep the habit, lower the effort"],
          ["Every 4–8 weeks", "plan it in advance"],
        ],
      },
    ],
    footer: "Recovery is when the gains are made.",
    caption: "Training breaks you down; rest builds you up. A planned lighter week every month or two lets your joints and nerves catch up. Sharp or lasting pain needs a doctor, not a deload.",
    goal: "pt",
    tags: ["Deload", "Recovery", "Overtraining"],
  },
  {
    id: "desk-job",
    series: "DAILY BASICS",
    title: ["DESK JOB", "SURVIVAL KIT"],
    subtitle: "For the 9-to-7 crowd",
    columns: ["HABIT", "HOW"],
    sections: [
      {
        rows: [
          ["Stand up", "every 30–60 min"],
          ["Walk calls", "take phone calls on foot"],
          ["Chin tucks", "10 reps, 3 × a day"],
          ["Hip flexor stretch", "30 s / side"],
          ["Lift", "3 days a week, back included"],
        ],
      },
    ],
    footer: "Sitting isn't evil. Sitting all day is.",
    source: `Less sitting, more moving: ${WHO_PA}`,
    caption: "WHO advises adults to limit sitting and replace it with any activity. These micro-habits keep stiffness away between gym sessions. Ongoing back or neck pain? See a doctor or physio.",
    goal: "join",
    medical: true,
    tags: ["DeskJob", "Posture", "OfficeFitness"],
  },
  // ---------------- Day 24 ----------------
  {
    id: "beginner-mistakes",
    series: "GYM TRUTHS",
    title: ["6 BEGINNER", "MISTAKES"],
    subtitle: "And the simple fix for each",
    columns: ["MISTAKE", "FIX"],
    sections: [
      {
        rows: [
          ["Copying an influencer's split", "full body 3 × a week"],
          ["Ego lifting", "form first, then load"],
          ["No warm-up", "8 minutes, every time"],
          ["Changing plans weekly", "same plan 8–12 weeks"],
          ["Only cardio for fat loss", "lift + walk + food"],
          ["No sleep, no protein", "fix both"],
        ],
      },
    ],
    footer: "Boring basics, done consistently, win.",
    caption: "We see these every month at Royal Fitness Club and they're all easy to fix. Starting out? Ask any trainer on the floor to check your form, it's free with membership.",
    goal: "join",
    tags: ["GymBeginner", "GymMistakes", "FitnessTips"],
  },
  {
    id: "millets",
    series: "DESI NUTRITION",
    title: ["MILLETS", "MADE SIMPLE"],
    subtitle: "Shree Anna: old grains, easy swaps",
    columns: ["MILLET", "TRY IT AS"],
    sections: [
      {
        rows: [
          ["Ragi (finger millet)", "roti, dosa, porridge"],
          ["Bajra (pearl millet)", "winter roti"],
          ["Jowar (sorghum)", "roti, upma"],
          ["Foxtail / kodo", "in place of rice"],
          ["Start with", "half atta, half millet"],
        ],
      },
    ],
    footer: "Variety on the plate, not a magic grain.",
    caption: "Millets bring fibre, minerals and variety. They still have calories, so portions matter as with any grain. Mix them into atta first so the family barely notices.",
    goal: "diet",
    tags: ["Millets", "ShreeAnna", "IndianSuperfood"],
  },
  // ---------------- Day 25 ----------------
  {
    id: "conditioning",
    series: "ROYAL PROGRAMS",
    title: ["FAT-BURN", "CONDITIONING"],
    subtitle: "Finisher after lifting · 12–15 minutes",
    columns: ["MOVE", "WORK / REST"],
    sections: [
      {
        rows: [
          ["Rowing or bike sprint", "30 s / 30 s"],
          ["Kettlebell Swings", "30 s / 30 s"],
          ["Battle Ropes", "20 s / 40 s"],
          ["Sled Push or Walking Lunge", "30 s / 30 s"],
          ["Rounds", "3–4"],
        ],
      },
    ],
    footer: "Intervals are hard. Pick moves you can do with clean form.",
    caption: "Short intervals push your heart rate up and finish a session strong. They're tough, so do them 1–2 times a week, not daily. New to exercise, or have a heart condition? Talk to your doctor first and start with walking.",
    goal: "join",
    medical: true,
    tags: ["HIIT", "Conditioning", "FatBurn"],
  },
  {
    id: "supplement-truth",
    series: "SUPPLEMENT TRUTH",
    title: ["WHAT HAS", "EVIDENCE?"],
    subtitle: "Food first. Then, only if needed",
    columns: ["SUPPLEMENT", "HONEST TAKE"],
    sections: [
      {
        rows: [
          ["Whey / plant protein", "food in a tub, for convenience"],
          ["Creatine monohydrate", "well studied for strength"],
          ["Vitamin D", "only if a test shows low"],
          ["Fat burners", "skip"],
          ["Doses", "as advised by your doctor"],
        ],
      },
    ],
    footer: "No pill replaces food, sleep and training.",
    source: "ISSN Position Stands: Protein (2017), Creatine (2017)",
    caption: "Most supplements are marketing. A few have good research behind them, and even those only help once food, sleep and training are in place. Kidney, liver, BP or pregnancy? Speak to your doctor before taking anything.",
    goal: "join",
    medical: true,
    tags: ["SupplementFacts", "Creatine", "WheyProtein"],
  },
  // ---------------- Day 26 ----------------
  {
    id: "bench-checklist",
    series: "FORM CHECK",
    title: ["BENCH PRESS", "SET-UP"],
    subtitle: "Six cues for a stronger, safer press",
    columns: ["CUE", "WHY"],
    sections: [
      {
        rows: [
          ["Eyes under the bar", "short unrack"],
          ["Shoulder blades back & down", "stable base"],
          ["Feet planted, slight arch", "leg drive"],
          ["Grip just outside shoulders", "strong lockout"],
          ["Bar to lower chest", "elbows ≈ 45°"],
          ["Always a spotter or safeties", "non-negotiable"],
        ],
      },
    ],
    footer: "Set up the same way every rep, every time.",
    caption: "Most shoulder pain on the bench comes from flared elbows and loose shoulder blades. Lock these in with a light bar first. Ask for a spot: our trainers are on the floor every session.",
    goal: "pt",
    tags: ["BenchPress", "FormCheck", "ChestDay"],
  },
  {
    id: "meal-prep",
    series: "SMART HABITS",
    title: ["SUNDAY", "MEAL PREP"],
    subtitle: "One hour, a better week",
    columns: ["PREP", "LASTS (FRIDGE)"],
    sections: [
      {
        rows: [
          ["Boil chana, rajma or eggs", "2–3 days"],
          ["Chop salad veg", "2–3 days"],
          ["Marinate paneer / chicken", "1–2 days"],
          ["Roast makhana, peanuts", "a week (airtight)"],
          ["Set curd", "daily"],
        ],
      },
    ],
    footer: "Make the healthy choice the easy choice.",
    caption: "Most bad food choices happen when we're tired and hungry. A little prep on Sunday means the good option is already waiting. Store safely and reheat well.",
    goal: "diet",
    tags: ["MealPrep", "SundayPrep", "HealthyHabits"],
  },
  // ---------------- Day 27 ----------------
  {
    id: "mobility",
    series: "RECOVERY",
    title: ["10-MINUTE", "MOBILITY FLOW"],
    subtitle: "Rest days and after training",
    columns: ["MOVE", "TIME"],
    sections: [
      {
        rows: [
          ["Cat–cow", "1 min"],
          ["World's greatest stretch", "1 min / side"],
          ["90/90 hip switches", "2 min"],
          ["Thoracic rotations", "1 min / side"],
          ["Deep squat hold", "2 min"],
          ["Doorway chest stretch", "1 min"],
        ],
      },
    ],
    footer: "Stiff is a habit. So is mobile.",
    caption: "Ten minutes on rest days keeps hips, back and shoulders moving well for your next session. Stretch to mild tension, never sharp pain.",
    goal: "join",
    tags: ["Mobility", "ActiveRecovery", "Flexibility"],
  },
  {
    id: "protein-myths",
    series: "NUTRITION SCIENCE",
    title: ["PROTEIN", "MYTH vs FACT"],
    subtitle: "What we hear at the front desk",
    columns: ["MYTH", "FACT"],
    sections: [
      {
        rows: [
          ["\"Protein is only for bodybuilders\"", "every adult needs it"],
          ["\"Whey is a steroid\"", "it's a milk protein"],
          ["\"High protein damages healthy kidneys\"", "not shown in healthy adults"],
          ["\"Kidney disease? eat more\"", "no: doctor sets the limit"],
          ["\"Veg can't get enough\"", "plan it and you can"],
        ],
      },
    ],
    footer: "Facts first. Then fix your plate.",
    source: "ISSN Position Stand: Protein and Exercise, 2017",
    caption: "Research in healthy adults hasn't shown harm from higher-protein diets in normal ranges. People with existing kidney disease are different: their doctor decides. Not sure which you are? Get a check-up.",
    goal: "diet",
    medical: true,
    tags: ["ProteinMyths", "WheyProtein", "NutritionFacts"],
  },
  // ---------------- Day 28 ----------------
  {
    id: "first-week",
    series: "GYM TRUTHS",
    title: ["YOUR FIRST", "WEEK AT THE GYM"],
    subtitle: "What to expect at Royal Fitness Club",
    columns: ["DAY", "PLAN"],
    sections: [
      {
        rows: [
          ["Day 1", "tour, goal chat, injury check"],
          ["Day 2", "learn 5 basic lifts, light"],
          ["Day 3", "rest + 30-min walk"],
          ["Day 4", "repeat, a little heavier"],
          ["Day 5", "cardio + core"],
          ["Weekend", "walk, sleep, eat protein"],
        ],
      },
    ],
    footer: "Everyone was a beginner once. Nobody's watching you, everyone's working.",
    caption: "Nervous about starting? Most people are. Our trainers set you up on day one and check in through the first weeks, so you never wander around guessing.",
    goal: "join",
    tags: ["FirstDayAtGym", "GymBeginner", "NoidaGym"],
  },
  {
    id: "pcos-support",
    series: "WOMEN'S HEALTH",
    title: ["PCOS:", "LIFESTYLE SUPPORT"],
    subtitle: "Habits that support your treatment",
    columns: ["HABIT", "WHY"],
    sections: [
      {
        rows: [
          ["Strength training 2–3 × a week", "helps insulin sensitivity"],
          ["Protein + fibre at each meal", "steadier energy"],
          ["Fewer sugary drinks", "less sugar spikes"],
          ["Sleep 7+ hours", "hunger & mood"],
          ["Medicines & tests", "with your doctor"],
        ],
      },
    ],
    footer: "Supports treatment. Never replaces it.",
    source: "International Evidence-based Guideline for PCOS, 2023",
    caption: "International PCOS guidelines put healthy lifestyle first for most women: regular activity and a balanced diet. It supports medical care; it doesn't replace it. Keep your doctor in the loop.",
    goal: "join",
    medical: true,
    tags: ["PCOS", "WomensHealth", "PCOSFitness"],
  },
  // ---------------- Day 29 ----------------
  {
    id: "tracking",
    series: "SMART HABITS",
    title: ["TRACK THIS,", "NOT JUST WEIGHT"],
    subtitle: "Five ways to measure progress",
    columns: ["MEASURE", "HOW OFTEN"],
    sections: [
      {
        rows: [
          ["Weekly average weight", "weigh daily, average weekly"],
          ["Waist at the belly button", "every 2 weeks"],
          ["Lifts in your log", "every session"],
          ["Photos, same light", "every 4 weeks"],
          ["Energy & sleep", "daily, 1–5"],
        ],
      },
    ],
    footer: "What gets measured gets managed.",
    caption: "The scale is one number with a lot of noise. Waist size, strength and photos tell the real story, especially when you're building muscle and losing fat at the same time.",
    goal: "pt",
    tags: ["ProgressTracking", "FitnessJourney", "BodyRecomp"],
  },
  {
    id: "thyroid-support",
    series: "HEALTH & TRAINING",
    title: ["THYROID &", "TRAINING"],
    subtitle: "Exercise alongside treatment",
    columns: ["DO", "WHY"],
    sections: [
      {
        rows: [
          ["Take medicine as prescribed", "the base of everything"],
          ["Lift 2–3 × a week", "keeps muscle & strength"],
          ["Walk daily", "energy & mood"],
          ["Regular blood tests", "doctor adjusts the dose"],
          ["Tell your trainer", "we plan around it"],
        ],
      },
    ],
    footer: "Training supports treatment. Your doctor leads it.",
    caption: "With hypothyroidism under treatment, regular exercise is generally encouraged. Weight change is slower for some people, so focus on strength, energy and habits. Never change your medicine without your doctor.",
    goal: "pt",
    medical: true,
    tags: ["Thyroid", "Hypothyroidism", "HealthyLiving"],
  },
  // ---------------- Day 30 ----------------
  {
    id: "consistency",
    series: "GYM TRUTHS",
    title: ["THE ROYAL", "CONSISTENCY RULES"],
    subtitle: "What actually changes bodies",
    columns: ["RULE", "IN PRACTICE"],
    sections: [
      {
        rows: [
          ["Never miss twice", "one off day is fine"],
          ["Plan the week on Sunday", "gym days in the calendar"],
          ["Minimum session", "20 min still counts"],
          ["Same time daily", "habit beats motivation"],
          ["Train with a buddy", "harder to skip"],
        ],
      },
    ],
    footer: "Motivation starts it. Habit finishes it.",
    caption: "Results come from what you do most weeks, not from one perfect week. Make the gym a fixed appointment, and on bad days, do the minimum. Morning 5:30–11 AM, evening 4–10 PM, Monday to Saturday.",
    goal: "join",
    tags: ["Consistency", "Discipline", "GymMotivation"],
  },
  {
    id: "month-review",
    series: "ROYAL PROGRAMS",
    title: ["YOUR NEXT", "30 DAYS"],
    subtitle: "Save this and start Monday",
    sections: [
      { head: "WEEK 1", rows: [["Lift 3 ×", "full body"], ["Steps", "+1,000 a day"]] },
      { head: "WEEK 2", rows: [["Protein", "every meal"], ["Sleep", "7+ hours"]] },
      { head: "WEEK 3", rows: [["Add", "1 rep or 2.5 kg"], ["Cut", "1 sugary drink"]] },
      { head: "WEEK 4", rows: [["Measure", "waist & lifts"], ["Plan", "the next block"]] },
    ],
    footer: "One habit a week. Thirty days. A different you.",
    caption: "Stack one habit each week instead of changing everything on Monday and quitting by Thursday. Want a coach to set this up for your body? That's what we do every day.",
    goal: "join",
    tags: ["30DayChallenge", "FitnessGoals", "NewHabits"],
  },
];
