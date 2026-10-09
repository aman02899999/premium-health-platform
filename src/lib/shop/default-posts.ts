// Starter articles for the store's blog. Written to inform, not to oversell: every claim is
// the mainstream sports-nutrition position (ISSN position stands, ICMR-NIN 2020), and none
// promise results. Saved into the database on first run; edit or delete them in admin.

type Seed = { slug: string; title: string; excerpt: string; body: string; categorySlug: string | null; tags: string[]; seoTitle: string; seoDescription: string };

export const DEFAULT_POSTS: Seed[] = [
  {
    slug: "whey-protein-guide-india",
    title: "Whey Protein for Beginners: Concentrate vs Isolate, Dose and Timing",
    excerpt: "What whey actually is, which type suits you, how much to take and the one rule that matters more than timing.",
    categorySlug: "protein",
    tags: ["whey protein", "beginners", "protein"],
    seoTitle: "Whey Protein Guide for Beginners in India",
    seoDescription: "Whey concentrate vs isolate, how many scoops a day, best time to take it and how to check a genuine tub. A simple guide for Indian gym-goers.",
    body: `Whey protein is milk protein, filtered and dried. It is not a steroid and not a medicine — it is food in a convenient form. For most Indians, especially vegetarians, it is the easiest way to close the gap between how much protein they eat and how much training needs.

## How much protein do you need?

Sedentary adults need about 0.8–1 g of protein per kg of body weight a day (ICMR-NIN 2020). People who lift weights regularly do better with **1.4–2.0 g per kg** (International Society of Sports Nutrition). A 70 kg lifter therefore needs roughly 100–140 g a day.

A typical vegetarian Indian day — dal, roti, rice, a little curd — often lands at 50–60 g. That gap is where one or two scoops help.

## Concentrate vs isolate

| | Whey concentrate | Whey isolate |
|---|---|---|
| Protein per scoop | ~70–80% | ~90% |
| Lactose | A little | Very little |
| Taste and texture | Creamier | Thinner |
| Price | Lower | Higher |

Choose **concentrate** if dairy suits you and price matters. Choose **isolate** if milk makes you bloated, or you want the most protein per calorie.

## How to take it

- **Dose:** one scoop usually gives 20–25 g of protein. One or two scoops a day is enough for most people.
- **Timing:** total daily protein matters far more than timing. After training or with a low-protein breakfast are simply convenient moments.
- **Mix with:** water for fewer calories, milk for more.

## Check that your tub is genuine

1. An **FSSAI licence number** printed on the label.
2. A batch number and expiry date that match the seller's invoice.
3. A sealed inner foil and an intact outer seal.
4. Buy from authorised sellers — very low prices from unknown sellers are the most common sign of a fake.

## Who should be careful

People with kidney disease, those advised a protein-restricted diet, and pregnant women should check with their doctor first.

> Protein powder helps you reach a target. It does not replace meals, sleep or progressive training.`,
  },
  {
    slug: "how-much-protein-per-day",
    title: "How Much Protein Do You Really Need Per Day?",
    excerpt: "A simple way to work out your own protein target, with Indian food examples for vegetarians and non-vegetarians.",
    categorySlug: "protein",
    tags: ["protein", "diet", "vegetarian"],
    seoTitle: "How Much Protein Per Day? Simple Indian Guide",
    seoDescription: "Work out your daily protein needs in 30 seconds, with vegetarian and non-veg Indian food examples and when a protein shake makes sense.",
    body: `Most people training in the gym under-eat protein — not because they don't care, but because Indian meals are built around grains.

## Your target in 30 seconds

Multiply your body weight (kg) by:

- **1.0** if you don't exercise much
- **1.6** if you lift weights 3–5 days a week
- **2.0** if you are trying to lose fat while keeping muscle

Example: 65 kg × 1.6 = **104 g protein a day**.

## What common Indian foods give you

| Food | Amount | Protein |
|---|---|---|
| Paneer | 100 g | ~18 g |
| Toned milk | 1 glass (250 ml) | ~8 g |
| Curd / dahi | 1 katori (150 g) | ~5 g |
| Dal (cooked) | 1 katori | ~7 g |
| Soya chunks (dry) | 30 g | ~15 g |
| Eggs | 2 whole | ~12 g |
| Chicken breast (cooked) | 100 g | ~31 g |
| Whey protein | 1 scoop | ~22–25 g |

## Spread it out

Aim for **20–40 g of protein per meal**, 3–4 times a day. That beats one huge serving at night.

## When a shake makes sense

If your food gets you to about 70% of your target, a scoop of whey (or a plant protein if you're vegan) closes the rest without extra cooking. If your food already reaches the target, you don't need one.`,
  },
  {
    slug: "creatine-monohydrate-explained",
    title: "Creatine Monohydrate: The Most Researched Supplement, Explained",
    excerpt: "What creatine does, how to take 3–5 g a day, why loading is optional, and the myths about hair and kidneys.",
    categorySlug: "creatine",
    tags: ["creatine", "strength"],
    seoTitle: "Creatine Monohydrate Guide: Dose, Myths, Safety",
    seoDescription: "Creatine monohydrate explained: 3–5 g a day, no need to load, water retention, kidney and hair myths. Evidence-based guide.",
    body: `Creatine is one of the few supplements with decades of consistent research behind it. It helps your muscles regenerate energy for short, hard efforts — heavy sets, sprints, jumps.

## What to expect

- A little more strength and power over weeks of training.
- One or two extra reps on hard sets, which adds up over months.
- A 0.5–2 kg increase in body weight from water stored **inside** the muscle — not fat, and not "bloating".

## How to take it

- **3–5 g of creatine monohydrate every day**, training day or not.
- Loading (20 g a day for a week) only gets you to full stores faster; it's optional.
- Take it at any time, with water, milk or your protein shake. Consistency matters more than timing.

## Myths

- **"It damages kidneys."** In healthy people, studies at normal doses show no harm. If you have kidney disease, ask your doctor first.
- **"It causes hair loss."** One small study measured a hormone change; no study has shown hair loss. If you're worried, discuss it with a dermatologist.
- **"It's a steroid."** It isn't. It is a compound your body makes and that's found in meat and fish.

## Which type?

Plain **creatine monohydrate** is the researched form. Fancier forms cost more without proven extra benefit.`,
  },
  {
    slug: "pre-workout-guide-caffeine-safety",
    title: "Pre-Workout Supplements: What Works and How to Stay Safe",
    excerpt: "Caffeine, citrulline and beta-alanine explained, safe caffeine limits, and when to skip a pre-workout entirely.",
    categorySlug: "pre-workout",
    tags: ["pre-workout", "caffeine", "safety"],
    seoTitle: "Pre-Workout Guide: Ingredients, Caffeine Limits, Safety",
    seoDescription: "What's in a pre-workout, how much caffeine is safe, beta-alanine tingles, and who should avoid pre-workout supplements.",
    body: `A pre-workout is a drink you take 20–30 minutes before training for energy and focus. Most of the effect comes from a few ingredients.

## The ingredients that matter

- **Caffeine** — improves alertness and performance. Most adults tolerate up to about 400 mg a day in total, from all sources (tea and coffee count).
- **L-citrulline** — supports blood flow; studied doses are around 6–8 g.
- **Beta-alanine** — helps in efforts lasting 1–4 minutes; causes a harmless tingling feeling.
- **Creatine** — sometimes added, but works the same whenever you take it.

## Use it safely

1. Start with **half a scoop** to see how you react.
2. Don't take it within 6 hours of bedtime — poor sleep cancels the benefit.
3. Don't stack it with coffee or energy drinks.
4. Drink water through your session.

## Who should avoid pre-workouts

People with high blood pressure, heart rhythm problems, anxiety disorders, pregnancy, or those on regular medicines should speak to their doctor first. Under-18s should skip stimulants.

## Do you even need one?

No. A cup of coffee and a good meal 1–2 hours before training gives most of the same effect. A pre-workout is a convenience, not a requirement.`,
  },
  {
    slug: "eaa-vs-bcaa-vs-glutamine",
    title: "EAA vs BCAA vs Glutamine: Which Amino Acid Should You Buy?",
    excerpt: "The honest difference between EAAs, BCAAs and glutamine, and when each one is worth your money.",
    categorySlug: "amino-acids",
    tags: ["eaa", "bcaa", "glutamine", "amino acids"],
    seoTitle: "EAA vs BCAA vs Glutamine — Which One to Buy?",
    seoDescription: "EAA, BCAA and glutamine compared honestly: what each does, who benefits, and why total protein intake matters most.",
    body: `Amino acids are the building blocks of protein. Supplements sell some of them separately. Here's how they compare.

## EAA — essential amino acids

All nine amino acids your body cannot make. An EAA drink can support muscle building, especially if you train fasted or your protein intake is low. If you already eat enough protein, the extra benefit is small.

## BCAA — branched-chain amino acids

Three of those nine (leucine, isoleucine, valine). Research shows BCAAs alone don't build muscle as well as complete protein or EAAs, because the body needs all nine. Many people enjoy them as a flavoured drink during long sessions.

## Glutamine

Your body makes plenty of glutamine. Studies in healthy lifters show little effect on muscle or strength. Some people use it for gut comfort during heavy training; evidence here is limited.

## Quick guide

| You are… | Best choice |
|---|---|
| Hitting your protein target from food/whey | Nothing extra needed |
| Training fasted or low on protein | EAA |
| Want a flavoured intra-workout drink | BCAA or EAA |
| Very high training volume, gut issues | Glutamine is optional |

## The bottom line

Get your daily protein right first. Amino acid drinks are useful extras, not foundations.`,
  },
  {
    slug: "do-you-need-a-multivitamin",
    title: "Do Gym-Goers Need a Multivitamin? Vitamin D, B12 and Fish Oil",
    excerpt: "Which deficiencies are common in India, which tests to take first, and what a multivitamin can and can't do.",
    categorySlug: "multivitamins-tablets",
    tags: ["multivitamin", "vitamin d", "b12", "fish oil"],
    seoTitle: "Multivitamin for Gym: Vitamin D, B12, Fish Oil Guide",
    seoDescription: "Do you need a multivitamin? Common deficiencies in India (vitamin D, B12, iron), which blood tests to take, and safe use of tablets.",
    body: `A multivitamin is insurance for gaps in your diet. It won't build muscle by itself, but it can fix shortfalls that make you tired and slow your progress.

## Common gaps in India

- **Vitamin D** — very common, even in sunny cities, because we spend our days indoors.
- **Vitamin B12** — especially in vegetarians and vegans.
- **Iron** — especially in women.
- **Omega-3 fats** — low if you rarely eat fish.

## Test before you guess

A simple blood test (vitamin D, B12, haemoglobin/ferritin) tells you what you actually need. If something is very low, your doctor may prescribe a higher dose than any multivitamin contains.

## Using tablets well

- Take a multivitamin with a meal, once a day.
- Don't double up on single vitamins without advice — vitamin A, D and iron can build up to harmful levels.
- Fish oil: 1–2 g of combined EPA+DHA a day is a common amount; check with your doctor if you take blood thinners.

## What tablets can't replace

Vegetables, fruit, pulses and whole grains give fibre and hundreds of nutrients no tablet copies. Eat the food first; use the tablet to fill a gap.`,
  },
  {
    slug: "how-to-spot-fake-supplements",
    title: "How to Spot Fake Supplements in India: 7 Checks Before You Buy",
    excerpt: "Fake whey and pre-workouts are common. Seven quick checks — licence, batch, seal, price — to protect your money and health.",
    categorySlug: null,
    tags: ["authenticity", "fssai", "buying guide"],
    seoTitle: "How to Spot Fake Supplements in India — 7 Checks",
    seoDescription: "Check FSSAI licence, batch number, seals, smell and price to avoid fake whey protein and supplements in India.",
    body: `Counterfeit supplements are a real problem: wrong protein content, cheap fillers, sometimes banned substances. These checks take two minutes.

## 1. FSSAI licence on the label

Every food supplement sold in India must show the manufacturer's or importer's FSSAI licence number. No number is a red flag.

## 2. The seller's licence too

Online sellers of food products must show their own FSSAI licence number. Look for it in the store's footer.

## 3. Batch number and expiry

They should be printed clearly (not a loose sticker) and match your invoice.

## 4. Seals

An intact outer seal and inner foil. Broken or re-glued seals mean don't use it.

## 5. Price that's too good

Sales are normal; a price far below every authorised seller is how fakes are moved.

## 6. Mixability, smell and taste

Genuine whey dissolves reasonably well and smells like its flavour. A chalky texture, odd smell or lumps that won't dissolve deserve a complaint.

## 7. A proper invoice

Always get a GST invoice with the product name, batch and price.

> Buy from authorised sellers, keep your invoice, and contact the brand if anything feels off.`,
  },
  {
    slug: "beginner-supplement-stack",
    title: "The Only Supplement Stack a Beginner Needs (and What to Skip)",
    excerpt: "Start with food, then add protein, creatine and a vitamin check. Everything else is optional.",
    categorySlug: null,
    tags: ["beginners", "stack", "budget"],
    seoTitle: "Beginner Supplement Stack: What to Buy and What to Skip",
    seoDescription: "A simple, budget-friendly supplement stack for beginners: protein, creatine and a vitamin check — plus what you don't need yet.",
    body: `When you start training, supplements can feel essential. They aren't — but a few make life easier.

## Step 1: Food, sleep and training

No supplement makes up for missed meals, five hours of sleep or skipped sessions. Get these steady for a month first.

## Step 2: The useful basics

1. **Protein powder** — if food doesn't reach your daily protein target.
2. **Creatine monohydrate** — 3–5 g a day, the best-researched performance supplement.
3. **A blood test** — then vitamin D, B12 or a multivitamin if you need them.

## Step 3: Optional extras

- **Pre-workout** — if you train early or tired and tolerate caffeine.
- **EAA/BCAA** — if you train fasted or like a flavoured drink while training.
- **Fish oil** — if you rarely eat fish.

## What to skip as a beginner

"Fat burners" with heavy stimulants, testosterone boosters, and anything that promises dramatic results in weeks.

## Save with combos

Buying protein, creatine and a multivitamin together usually costs less than buying them one by one. Our combos bundle these at an extra discount.`,
  },
];
