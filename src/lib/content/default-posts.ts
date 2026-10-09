import type { BlogPost } from "./types";

// Shortcodes understood by lib/markdown.ts:
//   [[calculator:bmi]]   embeds a live calculator (see lib/calculators.ts CALCULATORS)
//   [[quiz:Question|Option A|*Correct option|Option C|Explanation]]
//   [[cta]]              free-trial call-to-action card

export const DEFAULT_POSTS: BlogPost[] = [
  {
    slug: "best-gym-in-sector-93-noida-checklist",
    title: "Choosing a Gym in Sector 93, Noida: A 10-Point Checklist",
    excerpt:
      "Before you pay for a membership in Sector 93, Gejha or 93A/93B, run through these ten checks. They separate a gym you'll actually use from one you'll quit in a month.",
    category: "Gym Guide",
    tags: ["gym near me", "sector 93 noida", "gejha", "beginners"],
    cover: "/gallery/aman-sharma-royal-fitness-gym.webp",
    author: "Royal Fitness Club",
    published: "2026-09-01",
    updated: "2026-09-28",
    draft: false,
    seoTitle: "Gym in Sector 93 Noida — 10-Point Checklist Before You Join",
    seoDescription:
      "How to pick the right gym in Sector 93, Gejha, 93A & 93B Noida: trainers, equipment, hygiene, timings, pricing and trial sessions explained.",
    body: `Most people pick a gym on price alone, then stop going within six weeks. The gym that gets you results is the one you keep showing up to — and that comes down to a handful of practical things you can check in a single visit.

## 1. Distance: under 10 minutes wins

Research on exercise adherence keeps finding the same thing: the closer the gym, the more often people go. If you live in Gejha, Sector 93, 93A, 93B or Sector 100, a gym on Gejha Main Road beats a fancier one across the Expressway.

## 2. Certified trainers on the floor, not just at the desk

Ask who is on the floor during *your* time slot. A certified trainer should correct form on squats, deadlifts and bench press without you asking.

## 3. Enough free weights for peak hours

Visit between 6–8 PM. Count the benches and squat racks. If people are queueing for dumbbells, your workouts will take twice as long.

## 4. Air-conditioning and ventilation

Noida summers are brutal. A fully air-conditioned floor is the difference between training in May and skipping all of May.

## 5. Cleanliness you can see

Check the washroom, the mats and whether equipment is wiped. Hygiene is a direct signal of how well the gym is managed.

## 6. Safety: CCTV and a clear emergency exit

Especially important for women training in the evening and for anyone leaving valuables in a locker.

## 7. Timings that match your life

Early risers need a 6 AM opening; office-goers need the gym open till 10 PM.

## 8. Transparent pricing

Ask for the price of every plan, what's included and the freeze policy. Longer plans should cost noticeably less per month.

[[quiz:Which factor predicts gym consistency best?|The number of machines|*How close the gym is to your home|The brand name|Whether there is music|Proximity consistently beats features — a gym within 10 minutes is the one you keep visiting.]]

## 9. Real reviews

Read Google and Justdial reviews, and look at the gym's Instagram for real member transformations — not stock photos.

## 10. A free trial

A good gym is confident enough to let you train for free first. Use the trial to check points 2–6 in person.

[[cta]]

## Know your starting point

Before your trial, check where you stand today so your trainer can set realistic targets:

[[calculator:bmi]]
`,
  },
  {
    slug: "beginner-gym-workout-plan-first-month",
    title: "Beginner Gym Workout Plan: Your First 4 Weeks (Printable)",
    excerpt:
      "A simple, safe 3-day full-body plan for complete beginners — the same structure our trainers use for new members in their first month.",
    category: "Workouts",
    tags: ["beginner workout", "full body", "gym plan"],
    cover: "/gallery/aman-sharma-grind-conquer-repeat.webp",
    author: "Royal Fitness Club",
    published: "2026-09-05",
    updated: "2026-09-25",
    draft: false,
    seoTitle: "Beginner Gym Workout Plan for the First Month (3 Days/Week)",
    seoDescription:
      "A 4-week beginner gym plan: 3 full-body days a week, sets, reps, rest times and progression rules. Safe for first-timers.",
    body: `Your first month in the gym is not about lifting heavy. It is about learning six movement patterns well, building the habit and letting your joints and tendons adapt.

## The rules for month one

- **Train 3 days a week** with a rest day in between (e.g. Mon/Wed/Fri).
- **Leave 2–3 reps in the tank** on every set. You should finish feeling you could do a bit more.
- **Add a little each week** — one more rep, or 1–2.5 kg — only when form stays perfect.
- **Warm up for 8 minutes**: 5 minutes on the cycle, then light sets of your first exercise.

## Workout A

| Exercise | Sets × Reps | Rest |
|---|---|---|
| Goblet squat | 3 × 10 | 90 s |
| Dumbbell bench press | 3 × 10 | 90 s |
| Lat pulldown | 3 × 12 | 60 s |
| Romanian deadlift (dumbbells) | 3 × 10 | 90 s |
| Plank | 3 × 30 s | 45 s |

## Workout B

| Exercise | Sets × Reps | Rest |
|---|---|---|
| Leg press | 3 × 12 | 90 s |
| Seated cable row | 3 × 12 | 60 s |
| Dumbbell shoulder press | 3 × 10 | 60 s |
| Walking lunges | 2 × 10 each leg | 60 s |
| Dead bug | 3 × 10 | 45 s |

Alternate A and B: week 1 is A-B-A, week 2 is B-A-B, and so on.

## How much should you lift?

After 3–4 weeks, estimate your one-rep max safely from a set of 5–8 reps rather than testing a true max:

[[calculator:one-rep-max]]

[[quiz:How many reps should you leave "in the tank" as a beginner?|0 — always go to failure|*2–3|8–10|It doesn't matter|Stopping 2–3 reps short of failure lets you practise good form and recover for the next session.]]

## Cardio in month one

Add 10–15 minutes of brisk incline walking or cycling after weights. Keep it conversational — zone 2.

> Consistency beats intensity. Twelve decent workouts in four weeks will change your body more than four brutal ones.

[[cta]]
`,
  },
  {
    slug: "indian-diet-plan-for-muscle-gain-vegetarian",
    title: "Vegetarian Indian Diet for Muscle Gain: Hit 100 g Protein with Ghar Ka Khana",
    excerpt:
      "Paneer, dal, curd, soya and eggs-optional swaps that get vegetarians to their protein target without living on supplements.",
    category: "Nutrition",
    tags: ["muscle gain", "vegetarian protein", "indian diet"],
    cover: "https://images.pexels.com/photos/29148133/pexels-photo-29148133.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    author: "Royal Fitness Club",
    published: "2026-09-10",
    updated: "2026-09-26",
    draft: false,
    seoTitle: "Vegetarian Indian Diet for Muscle Gain — 100 g Protein Meal Plan",
    seoDescription:
      "A practical vegetarian Indian meal plan for muscle gain with protein counts: paneer, dal, curd, soya chunks, sprouts and whey (optional).",
    body: `"Vegetarians can't build muscle" is a myth. The real problem is that a typical Indian vegetarian day has 40–50 g of protein, while someone training for muscle needs roughly **1.6–2.2 g per kg of body weight**.

## Find your numbers first

[[calculator:macro]]

## High-protein vegetarian staples (approx.)

| Food | Serving | Protein |
|---|---|---|
| Paneer | 100 g | 18 g |
| Soya chunks (dry) | 50 g | 26 g |
| Greek-style curd / hung curd | 200 g | 16–20 g |
| Moong dal (cooked) | 1 katori | 7–9 g |
| Chana / rajma (cooked) | 1 katori | 8–9 g |
| Milk | 300 ml | 10 g |
| Sprouts | 1 cup | 7 g |
| Whey protein (optional) | 1 scoop | 22–25 g |

## Sample 100 g day (70 kg person)

- **Breakfast:** 2 besan chillas with paneer filling + 200 ml milk — *~28 g*
- **Lunch:** 2 roti, 1 katori dal, 1 katori soya-matar sabzi, curd — *~30 g*
- **Pre-workout:** banana + handful of roasted chana — *~7 g*
- **Post-workout:** hung curd bowl with fruit or 1 scoop whey — *~20 g*
- **Dinner:** paneer bhurji + 2 roti + salad — *~22 g*

That is roughly 107 g of protein from normal home food.

[[quiz:Roughly how much protein does 50 g of dry soya chunks give?|5 g|12 g|*26 g|50 g|Soya chunks are about half protein by dry weight, making them one of the cheapest vegetarian protein sources.]]

## Three rules that matter more than the menu

1. Spread protein across 4–5 meals.
2. Eat in a small calorie surplus (≈ +250–300 kcal) — too much surplus just adds fat.
3. Sleep 7–8 hours. Muscle is built during recovery.

Our trainers build meal plans around what your family already cooks. Ask about it at your trial.

[[cta]]
`,
  },
  {
    slug: "fat-loss-guide-noida-working-professionals",
    title: "Fat Loss for Busy Noida Professionals: A 45-Minute, 4-Day Plan",
    excerpt:
      "Long commutes and desk jobs make fat loss harder, not impossible. Here is a time-efficient plan that fits around office hours.",
    category: "Fat Loss",
    tags: ["fat loss", "weight loss", "working professionals"],
    cover: "/gallery/aman-sharma-physique.webp",
    author: "Royal Fitness Club",
    published: "2026-09-14",
    updated: "2026-09-27",
    draft: false,
    seoTitle: "Fat Loss Plan for Working Professionals in Noida (45 Min, 4 Days)",
    seoDescription:
      "A realistic 4-day, 45-minute gym plan plus calorie targets for office-goers in Noida who want to lose fat without crash diets.",
    body: `Fat loss comes down to a sustained calorie deficit. Training decides whether the weight you lose is fat or muscle; food decides whether you lose weight at all.

## Step 1: Know your maintenance calories

[[calculator:tdee]]

Aim to eat **300–500 kcal below** that number. Bigger deficits feel faster but usually end in a binge weekend.

## Step 2: Train 4 days, 45 minutes

- **Mon — Upper strength:** bench press, rows, shoulder press, pulldown (3 × 8–10)
- **Tue — Lower strength:** squat or leg press, Romanian deadlift, lunges, calf raises
- **Thu — Full-body circuit:** 5 exercises × 40 s work / 20 s rest × 4 rounds
- **Sat — Strength + 20 min incline walk**

Lifting weights while in a deficit is what keeps your metabolism and shape intact.

## Step 3: Hit 8,000+ steps

Desk jobs burn very little. Walking during calls and taking the stairs adds 200–400 kcal a day — as much as a hard gym session.

[[quiz:What matters most for losing fat?|Doing cardio on an empty stomach|*A consistent calorie deficit|Avoiding rice completely|Sweating more|Every successful fat-loss approach works by creating a calorie deficit; the rest are tools to make that deficit easier.]]

## Step 4: Keep Indian food, fix portions

- Fill half the plate with sabzi and salad.
- Keep roti/rice to a measured portion rather than cutting them out.
- Go easy on fried snacks, sweets and sugary chai — the hidden calorie sources.

## Track the right numbers

Weigh yourself 3 mornings a week and use the weekly average. Measure your waist every two weeks — it often drops even when the scale stalls.

[[calculator:body-fat]]

[[cta]]
`,
  },
  {
    slug: "how-much-water-should-you-drink-gym",
    title: "How Much Water Should You Drink on Gym Days? (Noida Summer Edition)",
    excerpt:
      "Dehydration quietly kills your strength and stamina. Here is how much to drink before, during and after training in Delhi-NCR heat.",
    category: "Health",
    tags: ["hydration", "summer workout", "water intake"],
    cover: "/gallery/aman-sharma-between-sets.webp",
    author: "Royal Fitness Club",
    published: "2026-09-18",
    updated: "2026-09-28",
    draft: false,
    seoTitle: "How Much Water to Drink on Gym Days — Hydration Calculator",
    seoDescription:
      "Calculate your daily water needs for workouts in hot Noida weather, plus simple before/during/after hydration rules and electrolyte tips.",
    body: `Losing just 2% of your body weight in sweat can noticeably reduce strength and endurance. In a Delhi-NCR summer, that can happen within one workout.

## Your daily target

[[calculator:water]]

## Before, during, after

- **2 hours before:** 400–500 ml of water.
- **During:** a few sips every 10–15 minutes; about 500–750 ml per hour of training.
- **After:** drink steadily over the next hour. Nimbu pani with a pinch of salt or coconut water replaces electrolytes cheaply.

## Signs you're under-drinking

- Dark yellow urine
- Headache or dizziness during sets
- Unusual cramps
- A sudden drop in performance

[[quiz:What's a cheap, effective electrolyte drink after a sweaty session?|Cola|*Nimbu pani with a pinch of salt|Energy drink|Black coffee|Lemon water with salt (and a little sugar or honey) replaces sodium lost in sweat for almost nothing.]]

Our gym floor is fully air-conditioned, which helps — but you still need to drink.

[[cta]]
`,
  },
  {
    slug: "heart-rate-zones-cardio-training-explained",
    title: "Heart Rate Zones Explained: Burn Fat and Build Stamina Smarter",
    excerpt:
      "Zone 2, zone 4, fat-burning zone — what these numbers mean and how to use your treadmill or smartwatch to train in the right one.",
    category: "Workouts",
    tags: ["cardio", "heart rate zones", "zone 2"],
    cover: "/gallery/aman-sharma-rule-your-strength.webp",
    author: "Royal Fitness Club",
    published: "2026-09-22",
    updated: "2026-09-29",
    draft: false,
    seoTitle: "Heart Rate Zones Calculator & Guide — Zone 2 Cardio Explained",
    seoDescription:
      "Calculate your 5 heart-rate training zones and learn when to use zone 2 for endurance and fat burning, and zone 4–5 for fitness gains.",
    body: `Heart-rate zones turn "do some cardio" into a precise instruction. Each zone trains a different system in your body.

## Calculate your zones

[[calculator:heart-rate]]

## What each zone does

| Zone | % of max HR | Feels like | Use it for |
|---|---|---|---|
| 1 | 50–60% | Very easy | Warm-up, recovery |
| 2 | 60–70% | Can hold a conversation | Aerobic base, fat oxidation |
| 3 | 70–80% | Talking gets hard | Tempo work |
| 4 | 80–90% | A few words at a time | Improving VO₂max |
| 5 | 90–100% | All-out | Short sprints |

## A simple weekly split

- **2–3 sessions of zone 2**, 30–45 minutes (incline walk, cycle, cross-trainer).
- **1 session of intervals**: 6 × 1 minute in zone 4–5 with 2 minutes easy between.

[[quiz:Which zone lets you comfortably hold a conversation?|Zone 5|Zone 4|*Zone 2|None of them|Zone 2 is the "talking pace" zone — easy enough to chat, yet it builds your aerobic engine.]]

> If you're taking blood-pressure or heart medication, zone formulas may not apply — speak to your doctor first.

[[cta]]
`,
  },
];
