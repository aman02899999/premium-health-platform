import type { Food, DietPlan } from "@/types";

export const FOODS: Food[] = [
  {
    slug: "oats", name: "Oats", hindiName: "जई", category: "Whole Grains", short: "Beta-glucan-rich grain that supports cholesterol and sugar control.", nutrients: [{ nutrient: "Energy", amount: "389 kcal/100g dry" }, { nutrient: "Fibre", amount: "10.6 g (beta-glucan)" }, { nutrient: "Protein", amount: "16.9 g" }, { nutrient: "Iron/Magnesium", amount: "Good source" }], benefits: ["LDL-lowering soluble fibre", "Steady post-meal sugar vs refined cereals", "Satiety for weight management"], limitations: ["Instant flavoured sachets hide sugar", "Not gluten-free unless certified"], serving: "40–50 g dry (~½ cup) per breakfast with milk/curd, nuts and fruit.", cookingMethods: ["Overnight oats with curd", "Masala oats with vegetables", "Oats cheela"], caution: ["Celiac: use certified gluten-free", "Diabetics: avoid sugary toppings"], relatedDiseases: ["high-cholesterol", "type-2-diabetes", "obesity"], recipes: [{ name: "Masala Vegetable Oats", desc: "Oats simmered with onion, tomato, peas and haldi — 15-min breakfast." }, { name: "Overnight Curd Oats", desc: "Oats + curd + flax + banana, chilled overnight." }], faqs: [{ q: "Steel-cut vs instant?", a: "Steel-cut/rolled have lower GI and better texture; instant plain is okay, flavoured sachets are not." }], references: [{ title: "Oats and LDL: meta-analyses", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of oats bowl with Indian fruits and nuts, cream background, ultra-HD."
  },
  {
    slug: "ragi-finger-millet", name: "Ragi (Finger Millet)", hindiName: "रागी / मंडुआ", category: "Millets", short: "Calcium-rich millet ideal for diabetes, bones and weight-wise rotis.", nutrients: [{ nutrient: "Energy", amount: "336 kcal/100g" }, { nutrient: "Calcium", amount: "344 mg — highest among cereals" }, { nutrient: "Fibre", amount: "3.6 g" }, { nutrient: "Iron", amount: "3.9 mg" }], benefits: ["Low-GI vs white rice", "Bone-friendly calcium", "Gluten-free"], limitations: ["Oxalates — kidney-stone patients need moderation", "Needs tasty prep or adherence drops"], serving: "2 ragi rotis or 1 bowl ragi porridge as grain swap 3–4x/week.", cookingMethods: ["Ragi roti with ghee", "Ragi porridge with jaggery-light milk", "Ragi dosa"], caution: ["Kidney stones (oxalate): moderate", "Pair with dal for complete protein"], relatedDiseases: ["type-2-diabetes", "osteoporosis", "obesity"], recipes: [{ name: "Ragi Masala Roti", desc: "Ragi + onion + methi leaves, tawa-roasted." }], faqs: [{ q: "Is ragi better than wheat?", a: "For calcium and GI it shines; rotate ragi, jowar, bajra and wheat for variety." }], references: [{ title: "Millet and glycaemia: systematic reviews", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of ragi millet grains and rotis, Indian rustic kitchen, ultra-HD."
  },
  {
    slug: "methi-fenugreek-seeds", name: "Methi Seeds", hindiName: "मेथी दाना", category: "Seeds & Spices", short: "Galactomannan fibre seeds that blunt sugar spikes when used consistently.", nutrients: [{ nutrient: "Fibre", amount: "~25 g/100g" }, { nutrient: "Protein", amount: "23 g" }, { nutrient: "Iron", amount: "33 mg" }], benefits: ["Post-meal sugar support", "Satiety"], limitations: ["Bitter; gas initially", "Medicine interactions at high doses"], serving: "1–2 tsp soaked overnight, with breakfast.", cookingMethods: ["Soaked seeds", "Sprouted methi salad", "Methi thepla (leaves)"], caution: ["Diabetes medicines: monitor for lows", "Pregnancy: food amounts only"], relatedDiseases: ["type-2-diabetes", "high-cholesterol"], recipes: [{ name: "Soaked Methi Water", desc: "1 tsp soaked overnight; chew seeds, sip water." }], faqs: [{ q: "Powder or whole?", a: "Whole soaked seeds retain fibre best; powders are convenient but dose carefully." }], references: [{ title: "Fenugreek glycaemia reviews", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial photography of methi seeds in brass bowl with sprouts, ultra-HD."
  },
  {
    slug: "moong-whole-green-gram", name: "Whole Moong (Green Gram)", hindiName: "हरी मूंग", category: "Pulses & Legumes", short: "Easiest-to-digest dal with high protein and low GI.", nutrients: [{ nutrient: "Protein", amount: "24 g/100g dry" }, { nutrient: "Fibre", amount: "16 g" }, { nutrient: "Folate/Iron", amount: "Excellent" }], benefits: ["Muscle-friendly vegetarian protein", "Gut-friendly fibre", "Budget superfood"], limitations: ["Gas if unsoaked; sprouting helps", "Needs grain pairing for complete amino acids"], serving: "30–40 g dry (1 katori cooked) daily with rice/roti.", cookingMethods: ["Moong khichdi", "Sprouted moong chaat", "Moong dal cheela"], caution: ["Kidney disease: protein/potassium personalisation needed"], relatedDiseases: ["protein-deficiency", "type-2-diabetes", "anemia"], recipes: [{ name: "Moong Khichdi", desc: "1:1 moong-rice with haldi, ghee tadka, vegetables." }], faqs: [{ q: "Sprouted vs cooked?", a: "Both great; sprouted adds vitamin C that aids iron absorption." }], references: [{ title: "Pulses and cardiometabolic health", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of sprouted moong chaat in brass bowl, ultra-HD."
  },
  {
    slug: "curd-yogurt", name: "Curd (Dahi)", hindiName: "दही", category: "Fermented Foods", short: "Probiotic staple supporting gut, bones and summer hydration.", nutrients: [{ nutrient: "Protein", amount: "3–4 g/100g" }, { nutrient: "Calcium", amount: "~110 mg" }, { nutrient: "Probiotics", amount: "Live cultures (homemade best)" }], benefits: ["Gut-friendly fermentation", "Bone calcium", "Cooling summer food"], limitations: ["Sweetened flavoured curds spike sugar", "Lactose intolerant need curd tolerance testing"], serving: "1–2 katoris/day with meals.", cookingMethods: ["Plain dahi", "Raita with cucumber", "Chaas/buttermilk"], caution: ["Kidney disease: potassium/phosphorus limits", "Night-cold myth: no evidence; eat as tolerated"], relatedDiseases: ["ibs", "osteoporosis", "diarrhea"], recipes: [{ name: "Cucumber Raita", desc: "Whisked dahi + cucumber + jeera + black salt." }], faqs: [{ q: "Curd at night?", a: "No scientific ban. Eat if it suits your digestion; avoid if it triggers cold symptoms for you personally." }], references: [{ title: "Fermented dairy and gut health reviews", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of curd in kulhad with tadka, Indian table, ultra-HD."
  },
  {
    slug: "moringa-leaves", name: "Moringa Leaves (Sahjan)", hindiName: "सहजन पत्ते", category: "Vegetables", short: "Iron, calcium and vitamin-A leaves — the affordable green multivitamin.", nutrients: [{ nutrient: "Vitamin A", amount: "Very high (as beta-carotene)" }, { nutrient: "Calcium", amount: "440 mg/100g fresh" }, { nutrient: "Iron", amount: "7 mg" }], benefits: ["Anemia-supportive greens", "Bone-friendly calcium"], limitations: ["Bitter if overcooked", "Powder quality varies"], serving: "1 katori cooked leaves 3x/week or 1 tsp powder in dal.", cookingMethods: ["Sahjan sabzi with coconut", "Dal with moringa leaves", "Paratha stuffing"], caution: ["Kidney stones: oxalate moderation"], relatedDiseases: ["anemia", "protein-deficiency"], recipes: [{ name: "Moringa Dal", desc: "Toor dal simmered with fresh moringa leaves, garlic tadka." }], faqs: [{ q: "Fresh vs powder?", a: "Fresh is best; powder is convenient for travel — 1 tsp/day is plenty." }], references: [{ title: "Moringa nutritional reviews", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of moringa leaves and drumsticks, ultra-HD."
  },
  {
    slug: "groundnuts", name: "Groundnuts (Moongfali)", hindiName: "मूंगफली", category: "Nuts & Seeds", short: "Protein-rich affordable nut that aids satiety and heart health in portions.", nutrients: [{ nutrient: "Protein", amount: "26 g/100g" }, { nutrient: "MUFA fats", amount: "Heart-friendly" }, { nutrient: "Niacin/Folate", amount: "Good" }], benefits: ["Satiety for weight control", "Heart-friendly fats"], limitations: ["Calorie-dense — portions matter", "Salted/fried versions harm BP"], serving: "30 g (small handful) roasted, unsalted.", cookingMethods: ["Dry-roasted", "Peanut chutney (less oil)", "Boiled peanuts"], caution: ["Peanut allergy: strict avoidance", "Gallbladder: fat moderation"], relatedDiseases: ["obesity", "high-cholesterol"], recipes: [{ name: "Roasted Masala Peanuts", desc: "Dry-roast with haldi, amchur, no oil." }], faqs: [{ q: "Do peanuts raise cholesterol?", a: "Unsalted portions improve lipid patterns; fried/salted versions do the opposite." }], references: [{ title: "Nuts and CVD: meta-analyses", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of roasted groundnuts in brass bowl, ultra-HD."
  },
  {
    slug: "amla-fruit", name: "Amla Fruit", hindiName: "आंवला", category: "Fruits", short: "Vitamin-C champion that boosts iron absorption from vegetarian meals.", nutrients: [{ nutrient: "Vitamin C", amount: "~600 mg/100g — among highest" }, { nutrient: "Fibre", amount: "4.3 g" }, { nutrient: "Polyphenols", amount: "Rich" }], benefits: ["Iron absorption booster", "Low-calorie tang"], limitations: ["Sour — sugary murabba defeats purpose"], serving: "1 fresh amla or 20 ml unsweetened juice with meals.", cookingMethods: ["Fresh with black salt", "Amla chutney", "Dried amla candy (no sugar)"], caution: ["Acidity-sensitive: take with food"], relatedDiseases: ["anemia", "iron-deficiency"], recipes: [{ name: "Amla-Lemon Chutney", desc: "Grated amla + coriander + lemon + jeera." }], faqs: [{ q: "Juice or whole?", a: "Whole fruit wins for fibre; juices spike sugar without fibre." }], references: [{ title: "Vitamin C and iron absorption", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of fresh amla fruits with leaves, ultra-HD."
  },
  {
    slug: "brown-rice-millets", name: "Millet Rice Mix", hindiName: "मिलेट चावल", category: "Whole Grains", short: "A practical white-rice upgrade blending foxtail/barnyard millet.", nutrients: [{ nutrient: "Fibre", amount: "2–3x of white rice" }, { nutrient: "GI", amount: "Lower than white rice" }], benefits: ["Better sugar control than white rice", "Same-bhat satisfaction"], limitations: ["Texture learning curve"], serving: "1 katori cooked as rice swap.", cookingMethods: ["Millet pulao", "Curd-millet rice", "Khichdi"], caution: ["Thyroid: rotate millets, don't over-rely on one"], relatedDiseases: ["type-2-diabetes", "obesity"], recipes: [{ name: "Foxtail Millet Pulao", desc: "Millet + peas + carrots, pressure-cooked." }], faqs: [{ q: "Which millet for beginners?", a: "Foxtail and barnyard mimic rice best; start 50:50 with rice." }], references: [{ title: "Millet GI studies", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of millet rice bowls, ultra-HD."
  },
  {
    slug: "flaxseeds", name: "Flaxseeds (Alsi)", hindiName: "अलसी", category: "Seeds & Spices", short: "Omega-3 (ALA) and lignan seeds supporting heart and gut.", nutrients: [{ nutrient: "ALA omega-3", amount: "~18 g/100g" }, { nutrient: "Fibre", amount: "27 g" }], benefits: ["Heart-friendly fats", "Constipation relief when ground"], limitations: ["Whole seeds pass undigested — grind fresh", "Goitrogen myth: normal 1–2 tbsp is fine"], serving: "1–2 tbsp ground/day on curd/dal/roti.", cookingMethods: ["Ground over dishes", "Alsi chutney", "Roti flour mix"], caution: ["Drink water with fibre; start with 1 tsp"], relatedDiseases: ["high-cholesterol", "constipation"], recipes: [{ name: "Alsi Chutney", desc: "Roasted flax + garlic + chilli, ground coarse." }], faqs: [{ q: "Do I need to grind?", a: "Yes — whole seeds often pass whole. Grind weekly, refrigerate." }], references: [{ title: "Flaxseed and lipids: meta-analyses", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial photography of flaxseeds in wooden spoons, ultra-HD."
  },
  {
    slug: "paneer", name: "Paneer", hindiName: "पनीर", category: "Protein Foods", short: "Vegetarian protein anchor for muscle, satiety and sugar control.", nutrients: [{ nutrient: "Protein", amount: "18 g/100g" }, { nutrient: "Calcium", amount: "~200 mg" }], benefits: ["High satiety", "Bone calcium"], limitations: ["Saturated fat — portions matter", "Fried paneer bombs calories"], serving: "50–75 g/day grilled/curried, not fried.", cookingMethods: ["Palak paneer (less cream)", "Grilled tikka", "Bhurji with peas"], caution: ["Heart disease: low-fat paneer, measured oil"], relatedDiseases: ["protein-deficiency", "type-2-diabetes"], recipes: [{ name: "Palak Paneer Light", desc: "Blanched spinach + grilled paneer, milk instead of cream." }], faqs: [{ q: "Paneer vs tofu?", a: "Both excellent; tofu is lighter, paneer is calcium-richer. Rotate." }], references: [{ title: "Dairy protein and satiety reviews", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of palak paneer in brass bowl, ultra-HD."
  },
  {
    slug: "banana", name: "Banana", hindiName: "केला", category: "Fruits", short: "Potassium-rich energy fruit — misunderstood by diabetics in portions.", nutrients: [{ nutrient: "Potassium", amount: "358 mg/100g" }, { nutrient: "Fibre", amount: "2.6 g" }], benefits: ["BP-friendly potassium", "Pre-workout energy"], limitations: ["Large ripe bananas spike sugar more"], serving: "1 small/medium (100 g), preferably with nuts/peanut butter.", cookingMethods: ["Fresh", "Banana-oats smoothie (no sugar)", "Curd mix"], caution: ["Kidney disease: potassium restriction may apply", "Diabetes: small + pair with protein"], relatedDiseases: ["high-blood-pressure", "weakness"], recipes: [{ name: "Banana Peanut Smoothie", desc: "1 banana + milk + 1 tsp peanut butter, no sugar." }], faqs: [{ q: "Can diabetics eat banana?", a: "Small bananas with protein/nuts are usually fine; large ripe ones alone spike more. Test your response." }], references: [{ title: "Potassium and BP: reviews", source: "Peer-reviewed journals" }], updatedAt: "2026-08-10", imagePrompt: "Premium editorial food photography of bananas with leaves, ultra-HD."
  },
];

export const FOOD_MAP = new Map(FOODS.map((f) => [f.slug, f]));
export function getFood(slug: string) { return FOOD_MAP.get(slug); }

export const DIET_PLANS: DietPlan[] = [
  {
    slug: "diabetes-diet", title: "Indian Diabetes Diet", audience: "Type 2 diabetes & prediabetes", short: "Low-GI, high-fibre Indian plates that tame post-meal spikes without giving up roti-sabzi.",
    principles: ["Plate method at every meal", "Millets over white rice 4x/week", "Protein at breakfast", "No liquid calories", "10-min post-meal walk"],
    breakfast: ["Vegetable oats + 1 boiled egg or 1 katori moong", "OR 2 millet rotis + palak paneer (50 g)", "Buttermilk or green tea (no sugar)"],
    lunch: ["1 katori millet/brown rice + 1 roti + dal + 2 sabzis + salad + curd", "Salad first, then protein, then grains"],
    dinner: ["Grilled paneer/fish + big sabzi + 1 roti or clear soup + stir-fry", "Finish 3 hours before sleep"],
    snacks: ["Roasted chana (30 g)", "1 fruit + 10 almonds", "Sprouted moong chaat"],
    beverages: ["Buttermilk", "Lemon water", "Green tea", "Water 2.5–3 L"],
    shoppingList: ["Ragi, foxtail millet, oats", "Moong, masoor, chana", "Seasonal vegetables", "Curd, paneer, eggs", "Flax, methi seeds, groundnuts"],
    portionGuidance: ["Grains: 1–1.5 katori cooked/meal", "Protein: palm + half", "Vegetables: 2 katoris", "Oil: 3–4 tsp/day total"],
    cautions: ["If on insulin/sulfonylureas, carry glucose and never skip meals", "Personalise with dietitian if kidney disease coexists"],
    relatedDiseases: ["type-2-diabetes", "prediabetes", "obesity"],
  },
  {
    slug: "heart-healthy-diet", title: "Heart-Healthy Indian Diet", audience: "BP, cholesterol & heart risk", short: "DASH-inspired Indian eating with salt <5 g, nuts daily and fried-food swaps.",
    principles: ["Salt <5 g/day", "Nuts 30 g/day", "Fibre 30 g+", "Zero trans fats", "Fish 2x/week or flax"],
    breakfast: ["Oats porridge with banana + walnuts", "OR poha with peanuts + sprouts"],
    lunch: ["Brown rice + sambar + poriyal + curd + salad", "Papad/pickle: skip or taste-only"],
    dinner: ["Grilled fish/paneer + millet roti + sabzi"],
    snacks: ["Fruit + buttermilk", "Roasted makhana"],
    beverages: ["Water, coconut water (unless kidney-restricted)", "Hibiscus/green tea unsweetened"],
    shoppingList: ["Oats, millets", "Mustard/groundnut oil", "Walnuts, almonds", "Seasonal vegetables/fruits"],
    portionGuidance: ["Salt: measure 1 tsp for full day cooking", "Oil: 3 tsp/day", "Fruits: 2/day"],
    cautions: ["Kidney disease: potassium (banana, coconut water) needs restriction — personalise"],
    relatedDiseases: ["high-blood-pressure", "high-cholesterol", "heart-disease"],
  },
  {
    slug: "pcos-nutrition", title: "PCOS Nutrition Plan", audience: "PCOS & insulin resistance", short: "High-protein, low-GI eating with strength training for cycle and skin support.",
    principles: ["Protein 1.2–1.6 g/kg", "Low-GI carbs only", "Strength 3x/week", "Sleep 8 hours", "Sugar <25 g/day"],
    breakfast: ["Moong cheela (2) + paneer bhurji", "OR Greek yogurt + oats + flax"],
    lunch: ["Quinoa/millet + rajma + sabzi + salad"],
    dinner: ["Chicken/fish/soya curry + stir-fry + 1 roti"],
    snacks: ["Boiled eggs", "Nuts + fruit", "Buttermilk"],
    beverages: ["Water 3 L", "Spearmint tea (folk support)", "No sugary chai"],
    shoppingList: ["Soya, paneer, eggs", "Millets, oats", "Vegetables, berries", "Flax, cinnamon (Ceylon)"],
    portionGuidance: ["Protein each meal", "Carbs: fist-size", "Vegetables: half plate"],
    cautions: ["Fertility planning needs folate + medical review"],
    relatedDiseases: ["pcos", "insulin-resistance", "acne"],
  },
  {
    slug: "thyroid-nutrition", title: "Thyroid-Friendly Nutrition", audience: "Hypothyroidism", short: "Medicine timing + selenium, iron and fibre for energy and weight support.",
    principles: ["Levothyroxine timing sacred", "Protein + fibre for satiety", "Correct iron/B12/D", "Cooked crucifers fine", "No kelp mega-doses"],
    breakfast: ["After medicine gap: eggs + millet toast + fruit"],
    lunch: ["Rice + dal + sabzi + curd + salad"],
    dinner: ["Soup + grilled protein + vegetables"],
    snacks: ["Nuts", "Fruit", "Roasted chana"],
    beverages: ["Water", "Milk after gap", "Limit soy excess with medicine"],
    shoppingList: ["Eggs, fish", "Brazil nuts (small pack)", "Millets", "Amla, guava (vitamin C)"],
    portionGuidance: ["Eat to satiety with protein; avoid crash diets that worsen TSH"],
    cautions: ["Recheck TSH 6–8 weeks after major diet/supplement changes"],
    relatedDiseases: ["hypothyroidism", "obesity"],
  },
  {
    slug: "fatty-liver-nutrition", title: "Fatty-Liver Nutrition", audience: "NAFLD/MASLD", short: "Mediterranean-Indian plates with zero alcohol and fructose cuts.",
    principles: ["Zero alcohol", "No sugary drinks", "Coffee 2–3 cups (less sugar)", "7–10% weight loss goal", "Millets + pulses base"],
    breakfast: ["Vegetable poha + sprouts + buttermilk"],
    lunch: ["Millet rice + dal + 2 sabzis + salad"],
    dinner: ["Grilled protein + stir-fry + soup"],
    snacks: ["Fruit", "Nuts 30 g"],
    beverages: ["Black coffee/light milk coffee", "Water 3 L", "No packaged juice"],
    shoppingList: ["Millets", "Pulses", "Vegetables", "Coffee, nuts"],
    portionGuidance: ["500 kcal deficit/day", "Oil 3 tsp", "Sweets: festive-only, small"],
    cautions: ["Rapid weight loss (>1 kg/week) can worsen liver — go steady"],
    relatedDiseases: ["fatty-liver", "obesity", "high-triglycerides"],
  },
  {
    slug: "kidney-friendly-nutrition", title: "Kidney-Friendly Eating (General)", audience: "Early CKD (stage 1–3, general guide)", short: "Salt, protein and potassium-aware eating — must be personalised by stage.",
    principles: ["Salt <4 g/day", "Protein as prescribed (not high)", "Potassium per blood reports", "Phosphorus awareness", "Fluid as advised"],
    breakfast: ["Poha/upma (less salt) + egg white as allowed"],
    lunch: ["Rice + dal (measured) + low-potassium sabzi (lauki, tinda)"],
    dinner: ["Roti + sabzi + small dal"],
    snacks: ["Puffed rice (unsalted)", "Apple/papaya (if potassium allows)"],
    beverages: ["Water as advised (not forced 3 L)", "Avoid coconut water, banana if potassium high"],
    shoppingList: ["Rice, wheat", "Lauki, tinda, apples", "Limited dairy per dietitian"],
    portionGuidance: ["Weigh protein as prescribed", "Leach vegetables (soak/chop/boil) if potassium high"],
    cautions: ["This is GENERAL education — CKD diets MUST be personalised by stage, potassium, phosphorus and dialysis status. Never copy blindly."],
    relatedDiseases: ["chronic-kidney-disease", "high-blood-pressure", "high-creatinine"],
  },
  {
    slug: "high-protein-vegetarian", title: "High-Protein Vegetarian Diet", audience: "Muscle, hair & satiety", short: "80–100 g protein without meat using dairy, soya and pulses smartly.",
    principles: ["Protein every meal", "Soya + dairy + pulses combo", "Creatine-free, food-first", "Strength training"],
    breakfast: ["Milk 500 ml + oats + peanuts OR paneer bhurji + roti"],
    lunch: ["Soya curry + rice + dal + curd"],
    dinner: ["Paneer tikka + dal + sabzi"],
    snacks: ["Roasted soya", "Milk + banana (post-workout)"],
    beverages: ["Milk/buttermilk", "Water 3 L"],
    shoppingList: ["Milk, curd, paneer", "Soya chunks", "Pulses, oats, peanuts"],
    portionGuidance: ["Protein: 25–30 g/meal", "Track for 2 weeks, then eyeball"],
    cautions: ["Kidney disease: do NOT high-protein without nephrology guidance"],
    relatedDiseases: ["protein-deficiency", "hair-loss", "mens-fitness"],
  },
  {
    slug: "weight-management-diet", title: "Weight-Management Diet", audience: "Belly fat & overweight", short: "500-kcal deficit Indian plan with early dinner and protein protection.",
    principles: ["Early light dinner", "Protein 1.2–1.6 g/kg", "10k steps", "No liquid calories", "Weekly weigh-in"],
    breakfast: ["Eggs/paneer + millet roti + vegetables"],
    lunch: ["Plate method with millet/rice + dal + sabzi + salad"],
    dinner: ["Soup + grilled protein + stir-fry (by 7:30 pm)"],
    snacks: ["Fruit + nuts", "Buttermilk", "Sprouts"],
    beverages: ["Water 3–4 L", "Green tea", "No cold drinks/alcohol"],
    shoppingList: ["Millets, oats", "Pulses, paneer, eggs", "Vegetables, fruits"],
    portionGuidance: ["Use 9-inch plate", "Half vegetables always"],
    cautions: ["PCOS/thyroid/diabetes medicines need parallel medical review"],
    relatedDiseases: ["obesity", "fatty-liver", "pcos"],
  },
];

export const DIET_MAP = new Map(DIET_PLANS.map((d) => [d.slug, d]));
