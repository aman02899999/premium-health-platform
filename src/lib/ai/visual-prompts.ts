// Prompts for the one-time Imagen / Veo job (scripts/gemini/visuals.ts), paid from the Google
// Cloud credit. Plain module so the GitHub Action script and the tests can both use it.
//
// House rules for AI visuals: stock-style scenes only. No identifiable faces, no "members", no
// before/after or body results, no text, logos or brands. Every file is labelled AI when posted
// (Meta "AI info" label, YouTube "altered or synthetic content").

export type VisualPrompt = { id: string; prompt: string; use: string; style?: "anatomy" };

const STYLE = "Photorealistic, natural light, warm tones, shallow depth of field, Indian setting. No text, no logos, no brand names, no watermarks. No identifiable faces: faces out of frame, turned away or in silhouette.";

export const IMAGE_PROMPTS: VisualPrompt[] = [
  { id: "dumbbell-rack", prompt: "A neat rack of black hex dumbbells in a small, clean neighbourhood gym in India, early morning light through a window.", use: "Gym posts, ad backgrounds" },
  { id: "chalk-hands", prompt: "Close-up of hands rubbing gym chalk over a loaded barbell in a modern indoor gym with black rubber flooring, chalk dust in the light.", use: "Strength tips Reels cover" },
  { id: "dal-roti-plate", prompt: "Top-down view of a balanced Indian home meal on a steel thali: dal, two rotis, sabzi, salad and curd.", use: "Diet trial, nutrition posts" },
  { id: "paneer-protein", prompt: "Top-down view of grilled paneer cubes, boiled chana and sprouts salad in bowls on a wooden table.", use: "Protein posts" },
  { id: "morning-walk", prompt: "A person in sports shoes walking on a park track at sunrise in an Indian city, seen from behind, trees and joggers far away.", use: "Walking and heart-health posts" },
  { id: "yoga-mat", prompt: "A person in a calm stretching pose on a yoga mat on a terrace at dawn, silhouette against the sky.", use: "Mobility and stress posts" },
  { id: "water-bottle", prompt: "A steel water bottle, a small towel and a skipping rope on a gym bench, morning light.", use: "Hydration and habit posts" },
  { id: "treadmill-row", prompt: "A row of treadmills in a small gym, one in use by a person seen only from the waist down.", use: "Cardio posts" },
  { id: "kettlebell-floor", prompt: "Two kettlebells on a rubber gym floor with soft side light.", use: "Workout plan covers" },
  { id: "fruit-bowl", prompt: "A bowl of seasonal Indian fruit: guava, banana, papaya and orange slices on a kitchen counter.", use: "Healthy snack posts" },
  { id: "measuring-tape", prompt: "A cloth measuring tape coiled next to a notebook and a pen on a table, no numbers readable.", use: "Fat-loss guides (never as a result claim)" },
  { id: "barbell-plates", prompt: "Close-up of a loaded barbell with iron plates on a squat rack, low angle.", use: "Strength posts" },
  { id: "sleep-room", prompt: "A tidy, dim bedroom at night with a phone face-down on the side table, calm mood.", use: "Sleep and recovery posts" },
  { id: "sugarcane-vs-soda", prompt: "A glass of coconut water next to a plain glass of water on a table, bright daylight.", use: "Drink myth posts" },
  { id: "gym-shoes-door", prompt: "A pair of training shoes and a gym bag by a front door, early morning.", use: "Motivation posts" },
  { id: "senior-walk", prompt: "Two older people walking side by side in a park, seen from behind, morning light.", use: "Senior fitness posts" },
];

export const VIDEO_PROMPTS: VisualPrompt[] = [
  { id: "plates-loading", prompt: "Slow-motion close-up of hands sliding an iron plate onto a barbell in a small gym. Camera slowly pushes in.", use: "Strength Reels b-roll" },
  { id: "rope-skipping", prompt: "Feet in sports shoes skipping rope on a rubber floor, slow motion, only legs visible.", use: "Cardio Reels b-roll" },
  { id: "thali-pan", prompt: "Top-down slow pan across a steel thali with dal, roti, sabzi, salad and curd being placed on a table.", use: "Diet trial Reels" },
  { id: "sunrise-run", prompt: "A runner seen from behind on a park track at sunrise in an Indian city, camera tracking alongside at a distance.", use: "Morning routine Reels" },
  { id: "dumbbell-curl", prompt: "Side view of an arm doing a slow dumbbell curl, face out of frame, gym background softly blurred.", use: "Exercise tips b-roll" },
  { id: "water-pour", prompt: "Water being poured into a steel bottle in slow motion on a gym bench, morning light.", use: "Hydration Reels" },
  { id: "stretch-terrace", prompt: "A person doing a slow forward stretch on a yoga mat on a terrace at dawn, in silhouette.", use: "Mobility Reels" },
  { id: "empty-gym-lights", prompt: "Lights switching on row by row in an empty small gym at opening time, early morning, slow camera glide.", use: "Gym opening-hours posts" },
  { id: "sprouts-bowl", prompt: "Hands mixing a sprouts and chana salad with lemon in a steel bowl, top-down, slow motion.", use: "Protein Reels" },
  { id: "stairs-climb", prompt: "Feet climbing apartment building stairs quickly, shot from behind at ankle height.", use: "Daily activity Reels" },
];

// "anatomy" set: realistic medical 3D renders and food close-ups for the Desi Food Science Reels
// (joints, muscles, gut, absorption). Education visuals only: no gore, no faces, no text.
const ANATOMY_STYLE = "Ultra-realistic 3D medical visualisation or macro photograph, cinematic lighting, dark clean background, high detail, educational, not gory. No text, no labels, no logos, no watermarks. No identifiable faces.";
const A = (id: string, prompt: string, use: string): VisualPrompt => ({ id, prompt, use, style: "anatomy" });

export const ANATOMY_IMAGE_PROMPTS: VisualPrompt[] = [
  A("knee-joint-cutaway", "Cutaway view of a human knee joint: femur, tibia and kneecap bones, glossy blue-white articular cartilage on the bone ends, crescent menisci, and the joint capsule filled with clear golden synovial fluid.", "Joints Reel: inside the knee"),
  A("cartilage-macro", "Microscopic close-up of smooth articular cartilage surface with a thin layer of glistening synovial fluid, soft blue and pearl tones.", "Joints Reel: cartilage"),
  A("leg-muscles-xray", "Human leg in a half-squat seen from the side, skin semi-transparent to show red quadriceps, hamstrings and glute muscles wrapped around the knee and hip bones.", "Joints Reel: strong muscles support the knee"),
  A("hip-glute-muscles", "Anatomical render of the hip and thigh: gluteus maximus and medius, quadriceps and the hip joint, seen from behind at an angle.", "Joints Reel: hip muscles"),
  A("large-intestine", "Translucent human torso showing the large intestine (colon) glowing softly, small intestine coiled in the centre.", "Fibre Reel: big intestine"),
  A("gut-bacteria", "Microscopic scene inside the human colon: many rod-shaped and round friendly bacteria among fibre strands on the intestinal lining, purple, green and blue tones.", "Fibre / gond Reel: gut bacteria"),
  A("colon-cells-energy", "Microscopic view of colon lining cells absorbing tiny glowing molecules, warm energy glow around the cells.", "Fibre Reel: butyrate feeds colon cells"),
  A("villi-absorption", "Microscopic view of finger-like small-intestine villi absorbing tiny golden particles into the blood vessels inside them.", "Synergy Reel: absorption"),
  A("red-blood-cells", "Red blood cells flowing through a blood vessel, realistic, deep red tones.", "Synergy Reel: iron"),
  A("acacia-gum-tree", "Macro photograph of amber-coloured natural gum resin drops on the bark of an acacia (babool) tree, Indian countryside, sunlight.", "Gond Reel: where gond comes from"),
  A("gond-laddu-plate", "Photograph of homemade Indian gond laddus with almonds and dry fruits on a brass plate, warm kitchen light, winter mood.", "Gond Reel: hook"),
  A("gond-ghee-kadhai", "Photograph of edible gum pieces puffing up into white crunchy balls in hot ghee in an iron kadhai, close-up.", "Gond Reel: gond puffs in ghee"),
  A("laddu-ingredients", "Top-down photograph of laddu ingredients in small bowls on a dark wooden table: edible gum, ghee, wheat flour, jaggery, almonds, dry coconut, dry ginger powder, black peppercorns.", "Gond Reel: ingredients"),
  A("almonds-pumpkin-seeds", "Photograph of almonds and green pumpkin seeds in two small brass bowls, close-up, natural light.", "Gond Reel: dry fruits and seeds"),
  A("turmeric-black-pepper", "Photograph of fresh turmeric roots, a mound of turmeric powder and black peppercorns on a wooden board.", "Synergy Reel: haldi + kali mirch"),
  A("tadka-ghee", "Photograph of a tadka: turmeric and black pepper sizzling in ghee in a small iron ladle above a bowl of dal.", "Synergy Reel: tadka"),
  A("dal-palak-lemon", "Photograph of a bowl of palak dal with a hand squeezing a lemon half over it, close-up.", "Synergy Reel: vitamin C + iron"),
  A("dal-chawal", "Photograph of a plate of steamed rice with yellow dal, homely Indian lunch, top-down.", "Synergy Reel: dal chawal"),
  A("chai-with-meal", "Photograph of a cup of masala chai next to a plate of Indian food on a table.", "Synergy Reel: chai with meals"),
  A("fibre-foods", "Top-down photograph of high-fibre Indian foods in bowls: rajma, chana, bajra, green vegetables, apple and guava with skin.", "Fibre Reel: desi fibre"),
];

export const ANATOMY_VIDEO_PROMPTS: VisualPrompt[] = [
  A("knee-bend-anim", "3D medical animation of a human knee joint slowly bending and straightening; the cartilage-covered bone ends glide smoothly over each other with synovial fluid between them. Slow orbiting camera.", "Joints Reel"),
  A("cartilage-pump-anim", "3D microscopic animation: articular cartilage is gently compressed and released in a rhythm, and tiny glowing nutrient particles from the synovial fluid flow into it each time.", "Joints Reel: movement feeds cartilage"),
  A("squat-muscles-anim", "3D anatomical animation of a human leg doing a slow bodyweight squat, skin semi-transparent, quadriceps and glute muscles contracting and glowing red, knee joint visible.", "Joints Reel: muscles support the knee"),
  A("gut-bacteria-anim", "3D microscopic animation inside the colon: friendly bacteria swarm around strands of plant fibre and break them down, releasing small glowing molecules. Slow drifting camera.", "Fibre / gond Reel"),
  A("villi-absorb-anim", "3D microscopic animation of small-intestine villi waving gently as tiny golden particles pass into them and into the blood vessels inside. Slow push-in.", "Synergy Reel: absorption"),
  A("colon-flythrough-anim", "Smooth 3D fly-through inside a healthy human large intestine, soft pink lining, gentle lighting, educational medical animation.", "Fibre Reel"),
  A("gond-puffing-anim", "Close-up slow motion of edible gum pieces puffing up and turning white and crunchy in hot ghee in an iron kadhai.", "Gond Reel"),
  A("laddu-rolling-anim", "Close-up of hands rolling a gond laddu with dry fruits into a ball and placing it on a brass plate, warm light, faces out of frame.", "Gond Reel"),
  A("lemon-dal-anim", "Slow motion of a lemon half being squeezed over a bowl of palak dal, juice drops falling.", "Synergy Reel"),
  A("tadka-anim", "Slow motion of turmeric and black pepper sizzling in hot ghee in a small iron ladle, then poured over dal.", "Synergy Reel"),
];

// "habits" set: realistic visuals for the Desi Habit Science Reels (saunf after meals, a walk after
// meals, soaked almonds, water with meals). Same style and rules as the anatomy set.
export const HABITS_IMAGE_PROMPTS: VisualPrompt[] = [
  A("fennel-seeds-macro", "Macro photograph of green fennel seeds (saunf) heaped in a small brass bowl, every ridge on the seeds visible, warm side light.", "Saunf Reel: hook"),
  A("saunf-mishri-bowl", "Photograph of a small steel bowl of fennel seeds mixed with crystal sugar (mishri) next to a finished Indian thali on a restaurant table.", "Saunf Reel: after the meal"),
  A("fennel-plant", "Photograph of a fennel plant in a field with yellow umbrella-shaped flowers and green seed heads, soft morning light.", "Saunf Reel: where saunf comes from"),
  A("fennel-oil-drop", "Macro photograph of a single golden drop of fennel essential oil falling from a glass dropper onto fennel seeds.", "Saunf Reel: anethole oils"),
  A("stomach-calm", "Translucent human torso showing the stomach and intestines with a soft calm blue-green glow, relaxed, medical 3D render.", "Saunf Reel: pet ki marod"),
  A("smooth-muscle-micro", "Microscopic 3D render of smooth muscle fibres in the wall of the intestine, spindle-shaped cells in soft pink and gold light.", "Saunf Reel: smooth muscle"),
  A("saunf-airtight-jar", "Photograph of fennel seeds stored in a closed glass jar with a steel lid on a kitchen shelf.", "Saunf Reel: store it closed"),
  A("evening-walk-family", "Two people walking side by side on a lit park path in an Indian city late in the evening, seen from behind at a distance, street lamps, calm night.", "Walk Reel: hook"),
  A("glucose-muscle-cells", "3D medical render of glowing glucose molecules flowing from a blood vessel into red skeletal muscle fibres.", "Walk Reel: muscles use glucose"),
  A("legs-walking-anatomy", "Side view of human legs mid-stride while walking, skin semi-transparent to show the red calf and thigh muscles working.", "Walk Reel: leg muscles"),
  A("dinner-thali", "Top-down photograph of a homely Indian dinner thali: roti, dal, sabzi, rice and salad on a steel plate.", "Walk Reel: after dinner"),
  A("soaked-almonds-bowl", "Photograph of almonds soaking in water in a glass bowl, a few peeled soaked almonds on a saucer beside it, morning light.", "Badam Reel: hook"),
  A("almonds-handful", "Photograph of a cupped hand holding a small handful of almonds, close-up, face out of frame.", "Badam Reel: how many"),
  A("almond-nutrients", "Macro photograph of almonds split open on a dark board, showing the creamy inside and brown skin.", "Badam Reel: what's inside"),
  A("brain-glow", "3D medical render of a human brain with soft glowing neural pathways, dark background.", "Badam Reel: dimaag tez?"),
  A("water-glass-thali", "Photograph of a steel glass of water next to an Indian thali on a dining table, natural light.", "Paani Reel: hook"),
  A("stomach-anatomy", "Translucent 3D render of the human stomach with gastric folds visible inside and a little clear fluid, medical visualisation.", "Paani Reel: stomach"),
  A("water-pour-glass", "Photograph of water being poured from a steel jug into a glass, droplets frozen mid-air.", "Paani Reel: drink water"),
];

export const HABITS_VIDEO_PROMPTS: VisualPrompt[] = [
  A("saunf-pour-anim", "Slow motion close-up of green fennel seeds pouring into a small brass bowl, warm light.", "Saunf Reel"),
  A("stomach-calm-anim", "3D medical animation of the intestines with gentle wave-like movement slowing down and relaxing, soft blue-green glow, slow orbiting camera.", "Saunf Reel: relaxes smooth muscle"),
  A("glucose-muscle-anim", "3D medical animation: glowing glucose molecules leave a blood vessel and enter red muscle fibres, which light up as they contract. Slow push-in.", "Walk Reel"),
  A("night-walk-anim", "Feet in sports shoes walking on a park path at night under street lamps, camera tracking at ankle height.", "Walk Reel"),
  A("almond-soak-anim", "Slow motion of almonds dropping into a glass bowl of water, bubbles rising, morning light.", "Badam Reel"),
  A("water-pour-anim", "Slow motion of water being poured from a steel jug into a glass next to an Indian thali.", "Paani Reel"),
  A("stomach-water-anim", "3D medical animation of water flowing into a translucent human stomach and quickly moving on into the small intestine, educational.", "Paani Reel: water passes quickly"),
];

// "supplements" set: realistic visuals for the Supplement Myth Buster series (whey, mass gainer,
// BCAA, pre-workout, fat burners, vitamins, omega-3, collagen). Same style and rules as above.
// No packaging, no labels you can read, nothing that looks like a product we sell or endorse.
export const SUPPLEMENT_IMAGE_PROMPTS: VisualPrompt[] = [
  A("paneer-whey-strain", "Photograph of fresh paneer being strained in a muslin cloth over a steel bowl, pale yellow-green whey liquid dripping into the bowl, Indian home kitchen.", "Whey video: whey is the water left from paneer"),
  A("protein-powder-scoop", "Photograph of a plain white scoop of off-white powder resting on a dark kitchen counter, a little powder spilled, no packaging in frame.", "Whey video: the powder"),
  A("milk-proteins-micro", "3D medical visualisation of milk proteins: large round casein micelles and many small whey protein molecules floating in milky liquid.", "Whey video: 80% casein, 20% whey"),
  A("amino-acids-gut", "3D medical render of long protein chains breaking into glowing individual amino acid beads inside the small intestine, absorbed by finger-like villi.", "Protein digestion"),
  A("muscle-repair", "3D medical render of red skeletal muscle fibres with tiny tears being repaired by glowing golden amino acid particles.", "Muscle repair"),
  A("hormone-receptor", "3D medical visualisation of a hormone molecule docking into a receptor on a cell surface, a glowing signal travelling to the cell nucleus.", "How hormones signal cells"),
  A("lab-testing-powder", "Photograph of a food testing laboratory: a gloved hand holding a test tube of dissolved white powder beside a lab balance and glassware.", "Lab-tested supplements"),
  A("protein-foods-desi", "Top-down photograph of Indian high-protein foods on a dark table: paneer cubes, boiled eggs, a bowl of dal, roasted chana, soya chunks and a bowl of curd.", "Food swaps"),
  A("kidney-liver", "Translucent 3D human torso highlighting the liver and both kidneys with a soft glow, medical visualisation.", "See a doctor note"),
  A("banana-black-coffee", "Photograph of a ripe banana and a cup of black coffee on a towel on a gym bench, morning light.", "Pre-workout swap"),
  A("dal-rice-curd", "Top-down photograph of a steel plate with dal, rice and a small bowl of curd.", "BCAA swap"),
  A("fat-cells", "3D medical visualisation of fat cells as soft yellow spheres packed together, a few slowly shrinking.", "Fat burner video"),
  A("capsules-spilled", "Photograph of assorted plain unmarked capsules and tablets spilled on a dark surface, shallow depth of field.", "Pills"),
  A("sunlight-forearm", "Close-up photograph of morning sunlight falling on a bare forearm outdoors, warm golden light, face out of frame.", "Vitamin D"),
  A("dairy-eggs-table", "Top-down photograph of a glass of milk, a bowl of curd, paneer cubes and two eggs on a wooden table.", "B12 foods"),
  A("flaxseed-walnut", "Macro photograph of flaxseeds and walnut halves in two small brass bowls on a dark board.", "Omega-3 swap"),
  A("fish-curry-bowl", "Photograph of an Indian fish curry in a clay bowl with a sprig of coriander, warm light.", "Omega-3 food"),
  A("knee-cartilage", "3D medical render of a human knee joint showing smooth cartilage and glowing collagen fibres, medical visualisation.", "Collagen video"),
  A("amla-fresh", "Macro photograph of fresh green amla (Indian gooseberries) with water droplets on a dark surface.", "Collagen video: vitamin C"),
  A("label-reading-hand", "Close-up of a hand holding a plain unmarked white tub turned to show a nutrition table, all text blurred and unreadable.", "Fake supplement check"),
];

export const SUPPLEMENT_VIDEO_PROMPTS: VisualPrompt[] = [
  A("milk-curdling-anim", "Slow motion close-up of hot milk curdling in a steel pot as lemon juice is added, white curds separating from pale yellow-green whey.", "Whey video"),
  A("amino-absorb-anim", "3D medical animation: protein chains break into glowing amino acid beads that are absorbed by intestinal villi and flow into a blood vessel. Slow orbit.", "Protein digestion"),
  A("muscle-repair-anim", "3D medical animation: glowing golden amino acids flow into torn red muscle fibres, which knit back together. Slow push-in.", "Muscle repair"),
  A("hormone-receptor-anim", "3D medical animation of a hormone molecule docking into a receptor on a cell, a glowing signal travelling to the nucleus, slow camera move.", "How hormones work"),
  A("powder-shaker-anim", "Slow motion of a scoop of off-white powder being poured into a plain clear shaker of milk on a dark counter.", "Whey video"),
  A("sunlight-skin-anim", "3D medical animation of sunlight rays entering the layers of human skin and small glowing molecules forming, educational.", "Vitamin D"),
  A("fat-cell-anim", "3D medical animation of yellow fat cells slowly shrinking as glowing energy particles leave them toward a blood vessel.", "Fat burner video"),
  A("knee-collagen-anim", "3D medical animation orbiting a knee joint, cartilage and collagen fibres glowing softly as the knee bends.", "Collagen video"),
];

// "supplements2": more visuals for the same series (mass gainer, pre-workout, carnitine,
// vitamins, omega-3, magnesium, label checks). Same style and rules.
export const SUPPLEMENT2_IMAGE_PROMPTS: VisualPrompt[] = [
  A("milk-banana-peanut-shake", "Photograph of a tall glass of homemade banana milkshake beside a ripe banana and a small bowl of roasted peanuts on a wooden kitchen counter.", "Mass gainer swap"),
  A("oats-banana-bowl", "Top-down photograph of a bowl of oats porridge with sliced banana, peanuts and a drizzle of honey.", "Mass gainer swap"),
  A("weighing-scale-feet", "Photograph of bare feet standing on a simple bathroom weighing scale, seen from above, display blank, face out of frame.", "Weight gain video"),
  A("green-tea-cup", "Photograph of a glass cup of light green tea with a few loose green tea leaves beside it, soft morning light.", "Green tea drink vs extract"),
  A("liver-amber", "3D medical render of a human liver with a soft amber glow inside a translucent torso, medical visualisation.", "Green tea extract and the liver"),
  A("caffeine-molecule", "3D render of a caffeine molecule as glowing spheres and bonds floating above a cup of black coffee.", "Pre-workout video"),
  A("heart-3d", "3D medical render of a human heart with visible coronary vessels, soft red glow, dark background.", "Pre-workout video: heartbeat"),
  A("dark-bedroom-sleep", "Photograph of a person sleeping in a dark bedroom, seen from behind under a blanket, blue night light, face hidden.", "Sleep matters more"),
  A("colourful-thali", "Top-down photograph of a colourful Indian thali with dal, palak sabzi, carrot and beetroot salad, curd, roti and rice.", "Multivitamin video: eat the rainbow"),
  A("blood-test-vial", "Close-up photograph of a gloved hand holding a blood sample vial with a blank label in a clean clinic.", "Test first"),
  A("window-sunlight-room", "Photograph of bright sunlight streaming through a closed glass window into a quiet room, dust visible in the light beam.", "Vitamin D: glass blocks UVB"),
  A("morning-terrace-sun", "Photograph of a person stretching on a rooftop terrace in morning sun in an Indian city, seen from behind, arms bare.", "Vitamin D: real sunlight"),
  A("chicken-fish-plate", "Photograph of grilled chicken pieces and a grilled fish fillet on a plate with lemon wedges and salad.", "Carnitine in food"),
  A("mitochondria-3d", "3D medical render of mitochondria inside a muscle cell with glowing fat droplets nearby, educational.", "Carnitine: fat to energy"),
  A("pumpkin-seeds-spinach", "Top-down photograph of pumpkin seeds, a bowl of rajma, fresh spinach leaves and a handful of almonds on a dark table.", "Magnesium foods"),
  A("fish-oil-softgels", "Macro photograph of golden fish oil softgel capsules on a dark surface, light shining through them.", "Omega-3 video"),
  A("vitamin-c-fruits", "Photograph of guava halves, oranges, amla and lemons arranged on a dark wooden board.", "Collagen needs vitamin C"),
  A("pill-organiser", "Photograph of a weekly pill organiser box full of assorted plain capsules on a kitchen table.", "Too many pills"),
  A("shaker-gym-bench", "Photograph of a plain clear shaker bottle with milky drink on a gym bench, dumbbells soft in the background.", "Whey video"),
  A("doctor-desk-consult", "Photograph of a doctor's desk with a stethoscope, a blank report sheet and a pen, hands of the doctor only.", "See a doctor"),
];

export const SUPPLEMENT2_VIDEO_PROMPTS: VisualPrompt[] = [
  A("carnitine-shuttle-anim", "3D medical animation: glowing fat molecules are carried through the membrane into a mitochondrion inside a muscle cell, which brightens with energy. Slow orbit.", "Carnitine video"),
  A("caffeine-brain-anim", "3D medical animation of caffeine molecules drifting into the brain and blocking tiny receptors on nerve cells, soft blue glow, slow push-in.", "Pre-workout video"),
  A("b12-absorb-anim", "3D medical animation of glowing red vitamin molecules being absorbed through the lining of the small intestine into a blood vessel.", "B12 video"),
  A("window-uv-anim", "Educational animation: sunlight rays hit a glass window, the short ultraviolet rays stop at the glass while visible light passes into the room.", "Vitamin D video"),
  A("omega-vessel-anim", "3D medical animation of golden oil droplets flowing smoothly through a red blood vessel, slow tracking camera.", "Omega-3 video"),
  A("liver-rotate-anim", "3D medical animation of a translucent human liver slowly rotating with a soft amber glow, dark background.", "Green tea extract video"),
  A("shake-blend-anim", "Slow motion of banana slices, milk and peanuts being blended in a mixer jar in an Indian kitchen.", "Mass gainer swap"),
  A("thali-pan-anim", "Slow overhead camera pan across a colourful Indian thali with dal, sabzi, salad, curd, roti and rice.", "Multivitamin video"),
];

// "egg": cinematic 3D science-explainer visuals for the "Anda khaate hi body ke andar kya hota hai"
// Reel (dark lab, glowing holographic look). Same no-text, no-faces rules.
export const EGG_IMAGE_PROMPTS: VisualPrompt[] = [
  A("egg-pedestal-dark", "Cinematic 3D render of a single glossy white hen's egg standing on a black reflective pedestal in a dark futuristic laboratory, teal rim light, floating dust particles.", "Egg Reel hook"),
  A("egg-hologram-xray", "3D render of a translucent glass-like egg glowing teal, the golden yolk visible inside, thin holographic scan rings around it, dark sci-fi lab, no text or numbers.", "Egg Reel: inside the egg"),
  A("boiled-egg-halves", "Macro photograph of a boiled egg cut in half on a dark slate board, bright golden yolk, soft studio light.", "Egg Reel: boiled egg"),
  A("protein-folded-glow", "3D medical visualisation of a folded protein molecule as a glowing coiled ribbon floating in dark space, teal and gold light.", "Egg Reel: protein shape"),
  A("protein-unfolded-heat", "3D visualisation of a protein ribbon unravelling into a long loose strand while warm orange heat waves pass through it, dark background.", "Egg Reel: cooking unfolds protein"),
  A("raw-egg-glass", "Photograph of a raw egg cracked into a clear glass, the yolk floating in the white, dark moody background.", "Egg Reel: raw egg myth"),
  A("stomach-3d-glow", "3D medical render of a human stomach inside a translucent torso, a warm orange glow of digestive acid inside, dark background.", "Egg Reel: stomach"),
  A("protein-chain-cut", "3D medical visualisation of a long chain of glowing beads being snipped into shorter pieces by tiny bright enzyme shapes, dark background.", "Egg Reel: pepsin cuts protein"),
  A("amino-blood-flow", "3D medical render of glowing golden amino acid beads flowing with red blood cells through a blood vessel.", "Egg Reel: amino acids in blood"),
  A("leucine-switch-cell", "3D medical visualisation of a single glowing gold molecule touching the surface of a muscle cell and lighting up a bright signal path inside it, dark background.", "Egg Reel: leucine signal"),
  A("muscle-fibre-bundle", "3D medical render of a bundle of red skeletal muscle fibres in cross section with glowing gold particles attaching to them, cinematic light.", "Egg Reel: building muscle"),
  A("yolk-nutrient-orbs", "3D render of a golden egg yolk sphere floating in dark space with small glowing orbs of different colours circling it, no text.", "Egg Reel: yolk nutrients"),
  A("egg-white-vs-whole", "Photograph of two white bowls on a dark table: one with only cooked egg whites, one with whole scrambled eggs, soft side light.", "Egg Reel: whole egg vs white"),
  A("desi-protein-day", "Top-down photograph of an Indian day of protein on a dark table: boiled eggs, a bowl of dal, paneer cubes, a bowl of curd and roasted chana.", "Egg Reel: whole day protein"),
];

export const EGG_VIDEO_PROMPTS: VisualPrompt[] = [
  A("egg-orbit-reveal-anim", "Cinematic 3D animation: the camera slowly orbits a glossy white egg on a black reflective pedestal in a dark lab, then the shell turns translucent, revealing the glowing golden yolk inside.", "Egg Reel hook"),
  A("egg-crack-slowmo-anim", "Extreme slow motion of a white egg cracking on the edge of a steel bowl, the yolk and white falling out, dark background, dramatic light.", "Egg Reel: cracking"),
  A("protein-unfold-anim", "3D animation: a coiled glowing protein ribbon slowly unravels into a long straight strand as warm orange heat waves pass through it, dark background.", "Egg Reel: cooking"),
  A("stomach-cut-anim", "3D medical animation inside a glowing stomach: long chains of glowing beads drift in orange acid and are snipped into shorter pieces by tiny bright enzymes.", "Egg Reel: stomach digestion"),
  A("leucine-signal-anim", "3D medical animation: a glowing gold molecule reaches a muscle cell, a bright signal ripples through the cell and tiny new protein strands start forming. Slow push-in.", "Egg Reel: leucine switch"),
  A("yolk-orbit-anim", "3D animation: a golden egg yolk sphere floats and slowly rotates in dark space while small glowing coloured orbs circle it like a tiny solar system.", "Egg Reel: yolk"),
];

// "bloodlab": cinematic 3D lab visuals for the "Blood test ke baad khoon lab mein kahan jaata hai"
// Reel (dark modern lab, teal and gold light). Same no-text, no-faces rules.
export const BLOODLAB_IMAGE_PROMPTS: VisualPrompt[] = [
  A("blood-vial-lab-dark", "Cinematic 3D render of a single small blood collection tube with a purple cap standing on a black reflective surface in a dark modern laboratory, teal rim light, floating dust particles.", "Blood lab Reel hook"),
  A("tube-caps-rack", "Photograph of a rack of blood collection tubes with purple, grey, gold and light blue caps in a clean modern lab, shallow depth of field, cool light.", "Blood lab Reel: coloured caps"),
  A("tube-caps-closeup", "Macro photograph of four blood collection tubes side by side with purple, grey, gold and red caps, dark background, soft studio light.", "Blood lab Reel: which cap for which test"),
  A("centrifuge-open", "Photograph looking down into an open laboratory centrifuge with blood tubes loaded in the rotor, clean white machine, cool light.", "Blood lab Reel: centrifuge"),
  A("centrifuge-spin", "Photograph of a laboratory centrifuge rotor spinning with motion blur, blood tubes inside, cool blue light.", "Blood lab Reel: spinning"),
  A("tube-layers-macro", "Macro photograph of a single clear test tube of centrifuged blood: dark red layer at the bottom, a very thin white layer in the middle, clear straw-yellow liquid on top, dark background.", "Blood lab Reel: three layers"),
  A("plasma-golden-molecules", "3D visualisation of glowing golden liquid with tiny floating molecules of different shapes and colours suspended in it, dark background.", "Blood lab Reel: what is in plasma"),
  A("cells-laser-channel", "3D medical visualisation of red blood cells and a few white blood cells passing one by one through a narrow glass channel crossed by a thin blue laser beam, dark sci-fi lab.", "Blood lab Reel: cell counter"),
  A("analyzer-pipette-drop", "Macro photograph of a robotic laboratory pipette tip releasing a single drop of straw-yellow serum into a small clear cuvette, dark modern analyser, cool light.", "Blood lab Reel: chemistry analyser"),
  A("cuvette-color-change", "Macro photograph of a row of small clear cuvettes with liquid in a gradient from pale pink to deep purple, dark background, studio light.", "Blood lab Reel: colour reaction"),
  A("light-through-cuvette", "Cinematic photograph of a thin beam of light passing through a small cuvette of coloured liquid onto a sensor in a dark laboratory instrument.", "Blood lab Reel: light gives the number"),
  A("lab-report-hologram", "3D render of a glowing holographic medical report panel with abstract bar graphs and lines floating above a lab bench, dark room, teal light, no readable text or numbers.", "Blood lab Reel: quality check and report"),
  A("dumbbell-blood-tube", "Photograph of a black dumbbell on a gym floor next to a single blood collection tube with a gold cap, dramatic side light, dark background.", "Blood lab Reel: gym tip"),
  A("report-doctor-desk", "Photograph of a doctor's hands holding a printed blood test report over a desk with a stethoscope, soft light, face not visible, no readable text.", "Blood lab Reel: show your doctor"),
];

export const BLOODLAB_VIDEO_PROMPTS: VisualPrompt[] = [
  A("vial-orbit-reveal-anim", "Cinematic 3D animation: the camera slowly orbits a small blood collection tube with a purple cap on a black reflective surface in a dark lab, teal light sweeping across the glass.", "Blood lab Reel hook"),
  A("centrifuge-spin-anim", "Close-up of a laboratory centrifuge rotor holding blood tubes as it starts spinning faster and faster into a blur, cool blue light.", "Blood lab Reel: centrifuge"),
  A("layers-separate-anim", "Macro animation of a clear tube of dark red blood slowly separating into layers: red cells sinking to the bottom and clear straw-yellow liquid rising to the top, dark background.", "Blood lab Reel: layers form"),
  A("cell-counter-laser-anim", "3D medical animation: red and white blood cells flow one by one through a narrow glowing glass channel, each cell flashing as it crosses a thin blue laser beam. Slow push-in.", "Blood lab Reel: counting cells"),
  A("color-reaction-anim", "Macro animation: a drop of clear reagent falls into a cuvette of pale yellow liquid and the liquid slowly turns deep purple, dark background.", "Blood lab Reel: colour reaction"),
  A("light-beam-anim", "Cinematic animation: a thin bright beam of light passes through a small cuvette of purple liquid, dimming as it exits onto a glowing sensor, dark laboratory instrument.", "Blood lab Reel: light reading"),
];

// "labseries": "Lab Ke Andar" EP 2-4 (CBC, blood sugar, lipid profile). Same no-text, no-faces rules.
export const LABSERIES_IMAGE_PROMPTS: VisualPrompt[] = [
  A("cbc-three-cells", "3D medical render of a red blood cell, a white blood cell and a few small platelets floating together in dark space, soft teal and gold light.", "Lab series EP2 hook: three cell types"),
  A("rbc-oxygen-carry", "3D medical visualisation of red blood cells flowing through a blood vessel with tiny glowing blue oxygen bubbles attached to them.", "Lab series EP2: haemoglobin carries oxygen"),
  A("rbc-size-compare", "3D medical render of three red blood cells side by side in dark space: one small and pale, one normal, one large, clean studio light.", "Lab series EP2: MCV cell size"),
  A("wbc-soldiers", "3D medical visualisation of white blood cells surrounding and engulfing small green bacteria inside a blood vessel, dramatic light.", "Lab series EP2: WBC fight infection"),
  A("platelets-clot", "3D medical render of small platelets and fine fibrin threads sealing a tiny tear in a blood vessel wall, dark background.", "Lab series EP2: platelets"),
  A("tired-runner-silhouette", "Dark silhouette of a person bent over with hands on knees next to a gym treadmill, out of breath, moody back light, face not visible.", "Lab series EP2: fatigue in the gym"),
  A("iron-foods-desi", "Top-down photograph on a dark table of Indian iron-rich foods: spinach, a bowl of chana, a bowl of rajma, jaggery pieces, boiled eggs, and lemon and amla halves.", "Lab series EP2: desi iron plate"),
  A("glucose-cube-dark", "Cinematic 3D render of a single glowing sugar cube floating above a black reflective surface in a dark laboratory, teal rim light, sparkling particles.", "Lab series EP3 hook"),
  A("glucose-meter-drop", "Macro photograph of a single drop of blood on a fingertip next to a glucose test strip, dark background, soft light, no readable numbers.", "Lab series EP3: sugar tests"),
  A("clock-water-glass", "Photograph of a simple wall clock and a glass of water on an empty dark table at dawn, calm light.", "Lab series EP3/EP4: fasting"),
  A("rbc-sugar-coat", "3D medical visualisation of red blood cells with tiny glowing golden sugar particles sticking to their surface, dark background.", "Lab series EP3: HbA1c"),
  A("two-reports-hologram", "3D render of two glowing holographic medical report panels side by side with abstract charts, linked by a light beam, dark lab, no readable text or numbers.", "Lab series EP3/EP4: read reports together"),
  A("muscle-glucose-pull", "3D medical visualisation of a red muscle fibre pulling glowing golden glucose particles in from a nearby blood vessel, dark background.", "Lab series EP3: muscle uses sugar"),
  A("city-crowd-blur", "Photograph of a busy Indian city street crowd in motion blur at dusk, warm lights, no identifiable faces.", "Lab series EP3/EP4: India numbers"),
  A("lipoprotein-spheres", "3D medical render of round lipoprotein particles carrying glowing yellow cholesterol inside, floating in a blood vessel.", "Lab series EP4: lipoproteins"),
  A("artery-plaque", "3D medical cross-section of an artery with a yellow fatty plaque narrowing the inside, educational, not gory, dark background.", "Lab series EP4: LDL"),
  A("hdl-cleanup", "3D medical visualisation of small bright particles collecting yellow cholesterol from an artery wall and carrying it away, dark background.", "Lab series EP4: HDL"),
  A("fried-snacks-dark", "Photograph of Indian fried snacks, sweets and white bread on a dark table, moody side light.", "Lab series EP4: triglycerides"),
  A("runner-heart-glow", "3D render of a glowing anatomical heart inside a translucent running figure seen from the side, dark background, teal light.", "Lab series EP4: exercise and the heart"),
  A("heart-healthy-thali", "Top-down photograph of an Indian thali on a dark table: dal, green sabzi, salad, a small bowl of oats and a handful of almonds and walnuts.", "Lab series EP4: heart-friendly plate"),
];

export const LABSERIES_VIDEO_PROMPTS: VisualPrompt[] = [
  A("cbc-cells-float-anim", "3D medical animation: red blood cells, white blood cells and small platelets drift slowly past the camera in dark space, soft teal and gold light. Slow push-in.", "Lab series EP2 hook"),
  A("rbc-oxygen-anim", "3D medical animation of red blood cells flowing through a blood vessel, tiny glowing blue oxygen bubbles attaching to them as they pass.", "Lab series EP2: haemoglobin"),
  A("wbc-attack-anim", "3D medical animation: a white blood cell moves toward small green bacteria inside a blood vessel and engulfs them.", "Lab series EP2: WBC"),
  A("glucose-spike-anim", "3D animation of a glowing golden line graph rising in a sharp peak and then slowly falling back down, floating in a dark lab, no numbers or text.", "Lab series EP3: after-meal test"),
  A("rbc-sugar-coat-anim", "3D medical animation: red blood cells slowly rotate as tiny glowing golden sugar particles drift in and stick to their surface.", "Lab series EP3: HbA1c"),
  A("muscle-glucose-anim", "3D medical animation: a muscle fibre contracts and glowing golden glucose particles stream into it from a nearby blood vessel.", "Lab series EP3: exercise"),
  A("lipid-flow-anim", "3D medical animation of round lipoprotein particles carrying glowing yellow cholesterol flowing through a blood vessel with red blood cells.", "Lab series EP4 hook"),
  A("plaque-build-anim", "3D medical animation of an artery cross-section where yellow fatty deposits slowly build up on the inner wall, narrowing it, educational, not gory.", "Lab series EP4: LDL"),
  A("hdl-carry-anim", "3D medical animation: small bright particles pick up yellow cholesterol from an artery wall and carry it away down the vessel.", "Lab series EP4: HDL"),
  A("heart-pump-anim", "3D animation of a glowing anatomical heart beating steadily in dark space, blood flow lines pulsing out from it, teal light.", "Lab series EP4: exercise and the heart"),
];

// "hormones": "Steroid aur Peptide Ka Sach" education series (EP 1-4 first: what a steroid is, the
// class map, natural limits, heart). Education only: no syringes, needles, vials, pills being taken,
// powders or bodies-as-results. Molecules, anatomy and doctors instead. Same no-text, no-faces rules.
export const HORMONES_IMAGE_PROMPTS: VisualPrompt[] = [
  A("four-ring-molecule", "Cinematic 3D render of a glowing molecular model made of four connected carbon rings floating in dark space, gold and teal light, floating particles.", "Hormone series hook: the four-ring family"),
  A("two-paths-molecules", "3D render of two similar glowing molecules floating apart in dark space, one lit cool blue on the left and one lit warm red on the right, a thin line of light dividing them.", "Hormone series EP1: two different families"),
  A("adrenal-gland-glow", "3D medical visualisation of a kidney with the small adrenal gland on top glowing soft gold, dark background.", "Hormone series EP1: cortisol from the adrenal gland"),
  A("inflamed-joint-calm", "3D medical visualisation of a knee joint with a red glowing area of inflammation fading to a calm blue, dark background.", "Hormone series EP1: corticosteroids calm swelling"),
  A("inhaler-tablet-strip", "Photograph of an asthma inhaler and a sealed blister strip of white tablets beside a stethoscope on a clean white doctor's desk, soft daylight, no readable text.", "Hormone series EP1: medicines doctors prescribe"),
  A("hormone-receptor-cell", "3D medical visualisation of glowing hormone molecules entering a muscle cell and docking onto receptors inside the nucleus, dark background.", "Hormone series EP1: how a hormone signals"),
  A("muscle-fibre-glow", "3D medical render of red skeletal muscle fibres bundled together with soft gold rim light, dark background.", "Hormone series: muscle tissue"),
  A("blood-test-morning", "Photograph of a phlebotomist's gloved hands placing a small bandage on a person's inner elbow at a blood test, morning light, face not visible.", "Hormone series EP1: morning blood test confirms low hormone"),
  A("doctor-explaining-chart", "Photograph of a doctor's hands pointing with a pen at an abstract chart on a tablet screen on a desk, a patient's hands across the table, faces not visible, no readable text.", "Hormone series: talk to a doctor"),
  A("gym-silhouette-dark", "Moody photograph of a gym at night: a lone person seen from behind in silhouette standing in front of a loaded barbell rack, dramatic back light, face not visible.", "Hormone series: the gym shortcut question"),
  A("class-map-hologram", "3D render of a glowing holographic tree diagram with branching nodes floating above a dark lab bench, teal and gold light, no readable text or numbers.", "Hormone series EP2: the class map"),
  A("liver-amber-glow", "3D medical visualisation of a human liver glowing amber with a few darker stressed patches, dark background.", "Hormone series: liver strain"),
  A("heart-wall-thick", "3D medical cross-section of a heart showing a thickened left ventricle wall, educational, not gory, dark background, teal light.", "Hormone series EP4: heart muscle thickens"),
  A("brain-mood-glow", "3D medical render of a human brain glowing with flickering red and blue areas, dark background.", "Hormone series: mood and dependence"),
  A("hpg-axis-glow", "3D medical visualisation of a translucent human figure with a glowing line of light running from the brain down to the lower abdomen, a small glowing gland at the base of the brain, dark background.", "Hormone series: the body's hormone control loop"),
  A("scale-balance-dark", "Cinematic photograph of an old brass balance scale on a black table in dramatic side light, one pan slightly lower, dust in the light.", "Hormone series: risk versus reward"),
  A("myth-shatter-glass", "Cinematic photograph of a pane of glass shattering into pieces against a black background, frozen in mid-air, gold rim light.", "Hormone series: myth busted"),
  A("lab-research-mice", "Photograph of a clean research laboratory bench with a microscope, petri dishes and a notebook, cool light, no animals visible, no readable text.", "Hormone series: lab-only evidence"),
  A("desi-protein-plate", "Top-down photograph on a dark table of Indian protein foods: paneer cubes, a bowl of dal, boiled eggs, chana, curd and soya chunks.", "Hormone series: food, training and sleep do the work"),
  A("sleep-recovery-dark", "Photograph of a tidy dim bedroom at night with moonlight through a window and a pair of gym shoes by the bed, calm mood.", "Hormone series: recovery"),
];

export const HORMONES_VIDEO_PROMPTS: VisualPrompt[] = [
  A("four-ring-orbit-anim", "Cinematic 3D animation: the camera slowly orbits a glowing molecular model made of four connected carbon rings in dark space, gold and teal light sweeping across it.", "Hormone series hook"),
  A("molecules-split-anim", "3D animation: one glowing molecule in dark space splits into two similar molecules that drift apart, one turning cool blue and the other warm red.", "Hormone series EP1: two families"),
  A("inflammation-calm-anim", "3D medical animation of a knee joint where a red glowing area of inflammation slowly fades and cools to calm blue.", "Hormone series EP1: corticosteroid action"),
  A("receptor-dock-anim", "3D medical animation: glowing gold hormone molecules drift into a muscle cell, pass into the nucleus and dock onto receptors, which light up one by one. Slow push-in.", "Hormone series EP1: hormone signal"),
  A("muscle-fibre-anim", "3D medical animation of red skeletal muscle fibres contracting and relaxing with soft gold rim light, dark background.", "Hormone series: muscle"),
  A("hpg-loop-anim", "3D medical animation of a translucent human figure: a pulse of light travels from a small gland at the base of the brain down to the lower abdomen and back up in a loop, then the loop dims and goes dark.", "Hormone series: natural hormone shuts down"),
  A("heart-strain-anim", "3D animation of a glowing anatomical heart beating in dark space, its glow shifting from teal to warning red as the beat becomes strained.", "Hormone series EP4: heart"),
  A("liver-stress-anim", "3D medical animation of a human liver slowly rotating while amber stress patches spread across its surface, dark background.", "Hormone series: liver"),
  A("class-tree-grow-anim", "3D animation of a glowing holographic tree diagram growing branch by branch above a dark lab bench, teal and gold light, no readable text.", "Hormone series EP2: class map"),
  A("glass-shatter-anim", "Slow-motion cinematic animation of a pane of glass shattering against a black background, gold rim light catching the pieces.", "Hormone series: myth busted"),
];

const SETS: Record<string, { image: VisualPrompt[]; video: VisualPrompt[] }> = {
  anatomy: { image: ANATOMY_IMAGE_PROMPTS, video: ANATOMY_VIDEO_PROMPTS },
  habits: { image: HABITS_IMAGE_PROMPTS, video: HABITS_VIDEO_PROMPTS },
  supplements: { image: SUPPLEMENT_IMAGE_PROMPTS, video: SUPPLEMENT_VIDEO_PROMPTS },
  supplements2: { image: SUPPLEMENT2_IMAGE_PROMPTS, video: SUPPLEMENT2_VIDEO_PROMPTS },
  egg: { image: EGG_IMAGE_PROMPTS, video: EGG_VIDEO_PROMPTS },
  bloodlab: { image: BLOODLAB_IMAGE_PROMPTS, video: BLOODLAB_VIDEO_PROMPTS },
  labseries: { image: LABSERIES_IMAGE_PROMPTS, video: LABSERIES_VIDEO_PROMPTS },
  hormones: { image: HORMONES_IMAGE_PROMPTS, video: HORMONES_VIDEO_PROMPTS },
};

/** The prompt list for a workflow run. Unknown or empty set names give the default gym stock set. */
export const promptSet = (set: string | undefined, kind: "image" | "video") => (set && SETS[set] ? SETS[set][kind] : kind === "video" ? VIDEO_PROMPTS : IMAGE_PROMPTS);

/** Sets made for vertical Reels only, so one 9:16 still per prompt. */
export const reelOnlySet = (set: string | undefined) => Boolean(set && SETS[set]);

export const fullPrompt = (p: VisualPrompt) => `${p.prompt} ${p.style === "anatomy" ? ANATOMY_STYLE : STYLE}`;

/** Words that would turn a stock scene into a claim about real people or results. */
const BANNED = /\b(before|after|transformation|member|client|result|lost \d|kg in|six[- ]pack|steroid|selfie|logo|brand)\b/i;
export const promptProblems = (p: VisualPrompt) => (BANNED.test(p.prompt) ? [`${p.id}: "${p.prompt.match(BANNED)?.[0]}"`] : []);
