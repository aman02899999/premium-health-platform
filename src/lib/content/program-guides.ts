// Long-form guides for the built-in programs, keyed by program id. Programs an admin adds later
// simply have no guide page. Outcome ranges are general training guidelines, phrased as what to
// expect when the plan is followed, never as a promise; individual results vary.

export type Level = "Beginner" | "Intermediate" | "Advanced";
export type WeekDay = { day: string; focus: string };
export type SampleWeek = { level: Level; who: string; days: WeekDay[] };
export type FlowStep = { title: string; weeks: string; detail: string };
export type ProgramGuide = {
  id: string;
  headline: string;
  paragraphs: [string, string, string];
  audience: string[];
  metrics: string[];
  equipment: string[];
  session: { part: string; minutes: number }[];
  weeks: SampleWeek[];
  flow: FlowStep[];
  outcomes: string[];
};

const REST = "Rest or a 30-minute walk";

export const PROGRAM_GUIDES: Record<string, ProgramGuide> = {
  strength: {
    id: "strength",
    headline: "Get measurably stronger and build visible muscle, one logged session at a time.",
    paragraphs: [
      "Strength & Bodybuilding is for anyone who wants more muscle and more strength: a first-timer who has never held a barbell, a college student filling out a lean frame, or someone who trained years ago and wants to start again safely. The goal is simple and measurable: lift a little more, or do one more good rep, than last time, while your body composition moves toward more muscle and less fat.",
      "Progress is tracked, not guessed. Your trainer logs the load and reps of your main lifts (squat, bench press, deadlift, overhead press, rows and pull-downs) and checks bodyweight, waist and arm measurements every four weeks. The work happens on the free-weight floor (dumbbells, barbells, plates and racks) with cable stations and plate-loaded and pin machines for safer isolation work. Form comes before load on every big lift.",
      "A typical session runs about 60–75 minutes. You warm up with light cardio and mobility, ramp up to working weight on one main compound lift, then do two or three accessory movements for the same muscles, and finish with core work and a short cool-down. Beginners start with three full-body days a week; as you adapt, the plan moves to upper/lower or push/pull/legs splits so each muscle gets enough work and enough recovery.",
    ],
    audience: ["Beginners who want to learn the big lifts properly", "Lean builds wanting to gain muscle", "Returning lifters rebuilding after a break"],
    metrics: ["Load × reps on the main lifts, every session", "Bodyweight, waist and arm measurements every 4 weeks", "Progress photos in the same light and pose, monthly"],
    equipment: ["Barbells, plates and squat/bench racks", "Dumbbells", "Cable stations", "Plate-loaded and pin machines"],
    session: [
      { part: "Warm-up & mobility", minutes: 10 },
      { part: "Main compound lift", minutes: 20 },
      { part: "Accessory lifts", minutes: 25 },
      { part: "Core & cool-down", minutes: 10 },
    ],
    weeks: [
      {
        level: "Beginner",
        who: "First 8–12 weeks",
        days: [
          { day: "Mon", focus: "Full body A: squat, bench press, row" },
          { day: "Tue", focus: REST },
          { day: "Wed", focus: "Full body B: deadlift technique, overhead press, pull-down" },
          { day: "Thu", focus: REST },
          { day: "Fri", focus: "Full body A, adding a little weight where form was clean" },
          { day: "Sat", focus: "Optional: 20 minutes of easy cardio + mobility" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
      {
        level: "Intermediate",
        who: "3–12 months of steady training",
        days: [
          { day: "Mon", focus: "Upper: bench press, rows, shoulders" },
          { day: "Tue", focus: "Lower: squat, Romanian deadlift, lunges" },
          { day: "Wed", focus: REST },
          { day: "Thu", focus: "Upper: overhead press, pull-ups/pull-downs, arms" },
          { day: "Fri", focus: "Lower: deadlift, leg press, calves, core" },
          { day: "Sat", focus: "Optional conditioning" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
      {
        level: "Advanced",
        who: "1+ year, consistent logbook",
        days: [
          { day: "Mon", focus: "Push: heavy bench, incline, shoulders, triceps" },
          { day: "Tue", focus: "Pull: deadlift or rack pulls, rows, biceps" },
          { day: "Wed", focus: "Legs: squat, leg press, hamstrings" },
          { day: "Thu", focus: "Push: volume work" },
          { day: "Fri", focus: "Pull: volume work" },
          { day: "Sat", focus: "Legs: volume work + core" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
    ],
    flow: [
      { title: "Assess", weeks: "Week 1", detail: "Goal, training history, injuries, starting lifts and measurements." },
      { title: "Learn the lifts", weeks: "Weeks 1–4", detail: "Technique on squat, press, hinge and pull with light loads." },
      { title: "Progressive overload", weeks: "Weeks 5–12", detail: "Small, logged increases in load or reps each week." },
      { title: "Review & re-plan", weeks: "Every 4 weeks", detail: "Measurements and lifts checked; the split is adjusted." },
    ],
    outcomes: [
      "Beginners who train consistently usually add weight to their main lifts most weeks for the first few months.",
      "Visible muscle change typically shows in progress photos after 8–12 weeks of consistent training and enough protein.",
      "Better posture and confidence with free weights within the first month.",
    ],
  },

  "fat-loss": {
    id: "fat-loss",
    headline: "Lose fat steadily without crash diets, and keep the muscle you have.",
    paragraphs: [
      "Fat Loss & Transformation is for people who want to lose fat and keep it off: office workers who have gained weight over the years, new parents, people starting after a doctor's advice, and anyone who has tried crash diets and regained the weight. The goal is a steady, sustainable drop in body fat while keeping (or building) muscle, so you look firmer and not just smaller.",
      "We measure what matters: weekly weigh-ins under the same conditions, waist and hip measurements every two weeks, and monthly progress photos. Strength is tracked too, because holding your strength while losing weight is the best sign that you're losing fat and not muscle. Sessions use the strength floor (dumbbells, machines and cables) plus treadmills, cycles and cross-trainers for conditioning and HIIT.",
      "A typical session is 60 minutes: a 10-minute warm-up, 30 minutes of full-body strength work in supersets or circuits, then 15 minutes of intervals or steady cardio, and a cool-down. Food matters as much as training, so you get calorie and protein targets and a practical Indian meal guide built around home food. We aim for around 0.5–1% of bodyweight lost per week, which is fast enough to stay motivated and slow enough to keep muscle.",
    ],
    audience: ["Desk workers who've gained weight over the years", "People who've tried crash diets and regained", "Anyone told by a doctor to lose weight (with their clearance)"],
    metrics: ["Weekly weigh-in, same day and time", "Waist and hip every 2 weeks", "Strength on 3 key lifts", "Monthly progress photos"],
    equipment: ["Dumbbells, cables and machines", "Treadmills, cycles and cross-trainers", "Bodyweight circuit stations"],
    session: [
      { part: "Warm-up", minutes: 10 },
      { part: "Strength circuits", minutes: 30 },
      { part: "Intervals or steady cardio", minutes: 15 },
      { part: "Cool-down & stretch", minutes: 5 },
    ],
    weeks: [
      {
        level: "Beginner",
        who: "New to exercise or restarting",
        days: [
          { day: "Mon", focus: "Full-body strength (machines) + 10 min brisk walk" },
          { day: "Tue", focus: "30–40 min easy cardio" },
          { day: "Wed", focus: "Full-body strength + 10 min cycle" },
          { day: "Thu", focus: REST },
          { day: "Fri", focus: "Full-body strength + 10 min cross-trainer" },
          { day: "Sat", focus: "Long walk or easy cardio, 40 min" },
          { day: "Sun", focus: "Gym closed: 8,000+ steps at home" },
        ],
      },
      {
        level: "Intermediate",
        who: "Training 2–3 months, ready for intervals",
        days: [
          { day: "Mon", focus: "Upper-body supersets + 10 min intervals" },
          { day: "Tue", focus: "Lower-body supersets + core" },
          { day: "Wed", focus: "30 min steady cardio in zone 2" },
          { day: "Thu", focus: "Full-body circuit" },
          { day: "Fri", focus: "Lower-body strength + 15 min intervals" },
          { day: "Sat", focus: "45 min steady cardio" },
          { day: "Sun", focus: "Gym closed: rest + steps" },
        ],
      },
      {
        level: "Advanced",
        who: "Fit and lean, cutting the last few kilos",
        days: [
          { day: "Mon", focus: "Heavy upper body + intervals" },
          { day: "Tue", focus: "Heavy lower body" },
          { day: "Wed", focus: "Metabolic circuit, 30 min" },
          { day: "Thu", focus: "Upper-body volume + core" },
          { day: "Fri", focus: "Lower-body volume + intervals" },
          { day: "Sat", focus: "60 min zone-2 cardio" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
    ],
    flow: [
      { title: "Assess", weeks: "Week 1", detail: "Weight, waist, food habits, schedule and any medical conditions." },
      { title: "Set targets", weeks: "Week 1", detail: "Calorie and protein targets and a home-food meal guide." },
      { title: "Train & track", weeks: "Weeks 2–12", detail: "Strength plus cardio; weekly weigh-ins and 2-weekly measurements." },
      { title: "Adjust", weeks: "Every 2–4 weeks", detail: "Food and cardio adjusted when progress stalls." },
    ],
    outcomes: [
      "A sustainable pace is about 0.5–1% of bodyweight per week; for a 80 kg person that is roughly 0.4–0.8 kg a week.",
      "Waist measurement usually drops even in weeks when the scale doesn't move.",
      "Stamina improves noticeably within 3–4 weeks of regular cardio.",
    ],
  },

  "personal-training": {
    id: "personal-training",
    headline: "A coach who plans, spots and pushes every session, built around your body.",
    paragraphs: [
      "Personal Training is one-on-one coaching for people who want faster, safer progress and real accountability: busy professionals with limited time, beginners who feel unsure on the gym floor, people working around old injuries, and anyone preparing for an event, a wedding or a sport. The goal is whatever you need it to be (fat loss, muscle gain, strength, mobility), and the plan is written only for you.",
      "Your coach keeps a written record of every session: exercises, loads, reps and how each one felt. Measurements, photos and strength tests are reviewed every four weeks so the plan changes with you. Exercise choice is injury-aware: if a movement hurts, your coach swaps it for one that trains the same muscles safely. You use the whole gym (free weights, racks, cables, machines and cardio) under direct supervision.",
      "A session is about 60 minutes. It starts with a quick check-in on sleep, soreness and food, then a warm-up matched to the day's work, the main training block with your coach spotting and cueing every set, and a cool-down with mobility work for your weak areas. Most clients train three to five days a week with their coach; on the other days you follow a simple plan on your own.",
    ],
    audience: ["Busy professionals short on time", "Beginners who want hands-on guidance", "People training around old injuries", "Event or sport preparation"],
    metrics: ["Session log: exercises, loads, reps, effort", "Measurements and photos every 4 weeks", "Strength or fitness tests matched to your goal"],
    equipment: ["Whole gym floor under supervision", "Free weights and racks", "Cables and machines", "Cardio zone"],
    session: [
      { part: "Check-in", minutes: 5 },
      { part: "Targeted warm-up", minutes: 10 },
      { part: "Coached main block", minutes: 35 },
      { part: "Mobility & cool-down", minutes: 10 },
    ],
    weeks: [
      {
        level: "Beginner",
        who: "3 coached sessions a week",
        days: [
          { day: "Mon", focus: "Coached: full-body technique session" },
          { day: "Tue", focus: "Own: 30 min walk or cycle" },
          { day: "Wed", focus: "Coached: full-body strength" },
          { day: "Thu", focus: REST },
          { day: "Fri", focus: "Coached: full-body strength + conditioning" },
          { day: "Sat", focus: "Own: light cardio + stretching" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
      {
        level: "Intermediate",
        who: "4 coached sessions a week",
        days: [
          { day: "Mon", focus: "Coached: upper body" },
          { day: "Tue", focus: "Coached: lower body" },
          { day: "Wed", focus: "Own: conditioning" },
          { day: "Thu", focus: "Coached: upper body" },
          { day: "Fri", focus: "Coached: lower body" },
          { day: "Sat", focus: "Own: mobility + walk" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
      {
        level: "Advanced",
        who: "5 coached sessions a week",
        days: [
          { day: "Mon", focus: "Coached: push" },
          { day: "Tue", focus: "Coached: pull" },
          { day: "Wed", focus: "Coached: legs" },
          { day: "Thu", focus: "Coached: weak-point session" },
          { day: "Fri", focus: "Coached: full-body power + conditioning" },
          { day: "Sat", focus: "Own: recovery cardio" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
    ],
    flow: [
      { title: "Consultation", weeks: "Day 1", detail: "Goal, history, injuries, schedule and food habits." },
      { title: "Baseline", weeks: "Week 1", detail: "Movement screen, strength tests, measurements, photos." },
      { title: "Coached blocks", weeks: "4-week cycles", detail: "Every session planned, spotted and logged." },
      { title: "Review", weeks: "Every 4 weeks", detail: "Results reviewed; the next block is rewritten." },
    ],
    outcomes: [
      "A clear, written plan from the first week and a coach accountable for following it with you.",
      "Fewer missed sessions: booked appointments are easier to keep than good intentions.",
      "Faster technique learning than training alone, which lets you progress safely sooner.",
    ],
  },

  cardio: {
    id: "cardio",
    headline: "Build the stamina and heart health that make everything else easier.",
    paragraphs: [
      "Cardio & Conditioning is for people who get out of breath on stairs, players who want more stamina for cricket, football or badminton, runners building toward an event, and anyone who wants a healthier heart. The goal is a stronger aerobic base (you can work longer at the same effort) plus the ability to push hard in short bursts when you need to.",
      "Progress is measured with simple, repeatable tests: resting heart rate, distance covered in a fixed 12-minute effort on the treadmill or cycle, and how quickly your heart rate comes down after a hard interval. Training is planned in heart-rate zones, mostly easy zone-2 work with a smaller amount of intervals. Equipment includes treadmills, cycles and cross-trainers, plus bodyweight and dumbbell circuit stations for functional conditioning.",
      "A typical session is 45–60 minutes: a 10-minute gradual warm-up, the main block (either 30–40 minutes of steady zone-2 work or a set of timed intervals), and a 5–10 minute cool-down with stretching. Two or three strength sessions a week are recommended alongside cardio, because stronger legs and core make you a more efficient, less injury-prone athlete.",
    ],
    audience: ["People who get breathless on stairs", "Recreational players wanting stamina", "Runners building toward an event"],
    metrics: ["Resting heart rate", "12-minute distance test every 4 weeks", "Heart-rate recovery after intervals"],
    equipment: ["Treadmills", "Cycles", "Cross-trainers", "Circuit stations"],
    session: [
      { part: "Gradual warm-up", minutes: 10 },
      { part: "Zone-2 block or intervals", minutes: 35 },
      { part: "Cool-down & stretch", minutes: 10 },
    ],
    weeks: [
      {
        level: "Beginner",
        who: "Starting from little activity",
        days: [
          { day: "Mon", focus: "20 min easy cardio (talk-test pace)" },
          { day: "Tue", focus: "Light full-body strength" },
          { day: "Wed", focus: "25 min easy cardio" },
          { day: "Thu", focus: REST },
          { day: "Fri", focus: "20 min easy cardio + light circuit" },
          { day: "Sat", focus: "30 min brisk walk" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
      {
        level: "Intermediate",
        who: "Comfortable with 30 min of steady work",
        days: [
          { day: "Mon", focus: "35 min zone 2" },
          { day: "Tue", focus: "Strength: legs + core" },
          { day: "Wed", focus: "Intervals: 6 × 1 min hard / 2 min easy" },
          { day: "Thu", focus: "Strength: upper body" },
          { day: "Fri", focus: "40 min zone 2" },
          { day: "Sat", focus: "Functional circuit, 25 min" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
      {
        level: "Advanced",
        who: "Event or sport preparation",
        days: [
          { day: "Mon", focus: "45 min zone 2" },
          { day: "Tue", focus: "Intervals: 5 × 3 min hard / 2 min easy" },
          { day: "Wed", focus: "Strength: full body" },
          { day: "Thu", focus: "Tempo: 20 min comfortably hard" },
          { day: "Fri", focus: "Strength: legs + core" },
          { day: "Sat", focus: "60 min long zone-2 session" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
    ],
    flow: [
      { title: "Baseline", weeks: "Week 1", detail: "Resting heart rate and a 12-minute test set your zones." },
      { title: "Aerobic base", weeks: "Weeks 1–6", detail: "Mostly easy zone-2 work, building minutes each week." },
      { title: "Add intensity", weeks: "Weeks 7–12", detail: "Intervals and tempo work on top of the base." },
      { title: "Re-test", weeks: "Every 4 weeks", detail: "Same test, same machine, to show real change." },
    ],
    outcomes: [
      "Steady sessions usually feel noticeably easier within 3–4 weeks.",
      "Resting heart rate often falls over 2–3 months of regular aerobic training.",
      "More distance covered in the same 12-minute test.",
    ],
  },

  diet: {
    id: "diet",
    headline: "Eat for your goal with ghar ka khana, without fad diets or banned foods.",
    paragraphs: [
      "Diet & Nutrition Guidance is for members who train hard but don't see results, vegetarians who struggle to get enough protein, families who want one meal plan that works for everyone, and anyone confused by conflicting diet advice online. The goal is a way of eating you can keep for years: built around normal Indian home food, matched to your calorie and protein needs, and simple enough to follow on a busy day.",
      "We start from your numbers: bodyweight, height, activity and goal give daily calorie and protein targets. Progress is tracked through weekly weigh-ins, waist measurement and simple habit check-ins (protein at each meal, water, vegetables, sleep). If progress stalls for two weeks, portions or meal timing are adjusted. The tools are a kitchen scale or household measures (katori, roti, spoon) and our Diet Pro plan, not expensive supplements.",
      "A typical week isn't a list of banned foods. You get a daily template (breakfast, lunch, pre-workout snack, dinner) with swaps for veg, egg and non-veg days, plus guidance for eating out and festivals. Supplements are discussed only when food can't cover a need, such as whey or vitamin D, and never pushed. Coaching check-ins happen on the gym floor or by WhatsApp. Diet guidance supports your health; it is not a medical treatment, and anyone with a medical condition should follow their doctor's advice first.",
    ],
    audience: ["Members training hard without results", "Vegetarians short on protein", "Families wanting one practical plan", "Anyone confused by diet fads"],
    metrics: ["Calorie and protein targets", "Weekly weigh-in and waist", "Daily habit checklist"],
    equipment: ["Household measures or a kitchen scale", "Diet Pro meal plan", "WhatsApp check-ins"],
    session: [
      { part: "Consultation & targets", minutes: 20 },
      { part: "Meal template walkthrough", minutes: 15 },
      { part: "Weekly check-in", minutes: 10 },
    ],
    weeks: [
      {
        level: "Beginner",
        who: "Weeks 1–4: build habits",
        days: [
          { day: "Mon", focus: "Add one protein source to breakfast" },
          { day: "Tue", focus: "2.5–3 L water through the day" },
          { day: "Wed", focus: "Half the plate vegetables at lunch" },
          { day: "Thu", focus: "Swap one fried snack for roasted chana or fruit" },
          { day: "Fri", focus: "Dinner 2–3 hours before sleep" },
          { day: "Sat", focus: "Plan next week's groceries" },
          { day: "Sun", focus: "Weigh-in + waist, note how the week went" },
        ],
      },
      {
        level: "Intermediate",
        who: "Weeks 5–12: hit targets",
        days: [
          { day: "Mon", focus: "Meet protein target with dal, paneer, curd, eggs or chicken" },
          { day: "Tue", focus: "Pre-workout snack timed 60–90 min before training" },
          { day: "Wed", focus: "Measure roti and rice portions for a day" },
          { day: "Thu", focus: "Practise one eating-out order that fits your plan" },
          { day: "Fri", focus: "Post-workout meal with protein + carbs" },
          { day: "Sat", focus: "Batch-cook protein for the week" },
          { day: "Sun", focus: "Check-in: weigh-in, waist, adjust portions" },
        ],
      },
      {
        level: "Advanced",
        who: "Fine-tuning for a goal",
        days: [
          { day: "Mon", focus: "Higher carbs on heavy training days" },
          { day: "Tue", focus: "Protein spread over 4 meals" },
          { day: "Wed", focus: "Lower carbs on rest days" },
          { day: "Thu", focus: "Track the whole day once for accuracy" },
          { day: "Fri", focus: "Festival or party plan for the weekend" },
          { day: "Sat", focus: "Flexible meal within the weekly budget" },
          { day: "Sun", focus: "Review the week with your coach" },
        ],
      },
    ],
    flow: [
      { title: "Consult", weeks: "Day 1", detail: "Food habits, preferences, schedule and medical notes." },
      { title: "Targets", weeks: "Day 1", detail: "Calories and protein from your body and goal." },
      { title: "Meal template", weeks: "Week 1", detail: "Home-food plan with veg, egg and non-veg swaps." },
      { title: "Check-ins", weeks: "Weekly", detail: "Weigh-in, waist and habits; portions adjusted." },
    ],
    outcomes: [
      "A daily meal template you can follow with your family's normal cooking.",
      "Hitting your protein target most days within the first month.",
      "Steady progress toward your weight goal at the pace your plan sets.",
    ],
  },

  women: {
    id: "women",
    headline: "Strong, confident training in a comfortable, CCTV-secured space.",
    paragraphs: [
      "Women's Fitness is for women at every stage: complete beginners, college students, working women, new mothers (after their doctor's clearance) and women managing PCOS or thyroid conditions alongside their doctor's care. The goal is strength, better shape and energy, and confidence on the gym floor, not just a lower number on the scale. Lifting weights will not make you bulky; it builds firmer muscle, stronger bones and better posture.",
      "Progress is tracked through strength on a few key exercises (goblet squat, hip thrust, rows, push-up progressions), waist and hip measurements every two to four weeks, and monthly photos if you want them. Beginner-friendly progressions start on machines and dumbbells before moving to barbells. The whole floor is air-conditioned and CCTV-monitored, and trainers guide you on the free-weight and machine areas, and on cardio.",
      "A typical session is 50–60 minutes: a warm-up with mobility for hips and shoulders, a guided strength block (lower body, upper body or full body depending on the day), a short conditioning finisher, and a cool-down. Three to four sessions a week works well for most women. For PCOS-friendly fat loss, the plan pairs strength training with daily steps and a protein-forward Indian diet; your doctor's advice always comes first.",
    ],
    audience: ["Complete beginners", "Working women with limited time", "New mothers after doctor's clearance", "Women managing PCOS or thyroid with their doctor"],
    metrics: ["Strength on key lifts", "Waist and hip every 2–4 weeks", "Optional monthly photos", "Energy and sleep check-ins"],
    equipment: ["Dumbbells and kettlebell-style work", "Machines and cables", "Hip-thrust and glute work", "Cardio zone"],
    session: [
      { part: "Warm-up & mobility", minutes: 10 },
      { part: "Guided strength block", minutes: 30 },
      { part: "Conditioning finisher", minutes: 10 },
      { part: "Cool-down", minutes: 5 },
    ],
    weeks: [
      {
        level: "Beginner",
        who: "First 8 weeks",
        days: [
          { day: "Mon", focus: "Full body on machines + 10 min walk" },
          { day: "Tue", focus: REST },
          { day: "Wed", focus: "Full body with dumbbells" },
          { day: "Thu", focus: "20–30 min easy cardio" },
          { day: "Fri", focus: "Full body + core" },
          { day: "Sat", focus: "Optional: mobility + walk" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
      {
        level: "Intermediate",
        who: "2–6 months of training",
        days: [
          { day: "Mon", focus: "Lower body: squats, hip thrusts, lunges" },
          { day: "Tue", focus: "Upper body: rows, presses, push-up progressions" },
          { day: "Wed", focus: "30 min zone-2 cardio" },
          { day: "Thu", focus: "Lower body: deadlift variations, glutes" },
          { day: "Fri", focus: "Upper body + core" },
          { day: "Sat", focus: "Optional circuit" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
      {
        level: "Advanced",
        who: "6+ months, strength goals",
        days: [
          { day: "Mon", focus: "Heavy lower body" },
          { day: "Tue", focus: "Heavy upper body" },
          { day: "Wed", focus: "Intervals + core" },
          { day: "Thu", focus: "Lower-body volume, glute focus" },
          { day: "Fri", focus: "Upper-body volume" },
          { day: "Sat", focus: "45 min zone-2 cardio" },
          { day: "Sun", focus: "Gym closed: rest" },
        ],
      },
    ],
    flow: [
      { title: "Welcome", weeks: "Day 1", detail: "Goals, health notes, comfort level and preferred batch." },
      { title: "Foundations", weeks: "Weeks 1–4", detail: "Machines and dumbbells, form first." },
      { title: "Build strength", weeks: "Weeks 5–12", detail: "Free weights and progressive loads." },
      { title: "Review", weeks: "Every 4 weeks", detail: "Measurements and strength reviewed; plan updated." },
    ],
    outcomes: [
      "More confidence on the gym floor within the first 2–3 weeks.",
      "Strength on key lifts usually rises steadily over the first few months.",
      "Waist and hip changes typically show within 6–8 weeks when training and diet are consistent.",
    ],
  },
};

export const guideFor = (id: string): ProgramGuide | undefined => PROGRAM_GUIDES[id];
