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

const SETS: Record<string, { image: VisualPrompt[]; video: VisualPrompt[] }> = {
  anatomy: { image: ANATOMY_IMAGE_PROMPTS, video: ANATOMY_VIDEO_PROMPTS },
  habits: { image: HABITS_IMAGE_PROMPTS, video: HABITS_VIDEO_PROMPTS },
};

/** The prompt list for a workflow run. Unknown or empty set names give the default gym stock set. */
export const promptSet = (set: string | undefined, kind: "image" | "video") => (set && SETS[set] ? SETS[set][kind] : kind === "video" ? VIDEO_PROMPTS : IMAGE_PROMPTS);

/** Sets made for vertical Reels only, so one 9:16 still per prompt. */
export const reelOnlySet = (set: string | undefined) => Boolean(set && SETS[set]);

export const fullPrompt = (p: VisualPrompt) => `${p.prompt} ${p.style === "anatomy" ? ANATOMY_STYLE : STYLE}`;

/** Words that would turn a stock scene into a claim about real people or results. */
const BANNED = /\b(before|after|transformation|member|client|result|lost \d|kg in|six[- ]pack|steroid|selfie|logo|brand)\b/i;
export const promptProblems = (p: VisualPrompt) => (BANNED.test(p.prompt) ? [`${p.id}: "${p.prompt.match(BANNED)?.[0]}"`] : []);
