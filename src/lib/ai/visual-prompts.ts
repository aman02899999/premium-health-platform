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

export const promptSet = (set: string | undefined, kind: "image" | "video") =>
  set === "anatomy" ? (kind === "video" ? ANATOMY_VIDEO_PROMPTS : ANATOMY_IMAGE_PROMPTS) : kind === "video" ? VIDEO_PROMPTS : IMAGE_PROMPTS;

export const fullPrompt = (p: VisualPrompt) => `${p.prompt} ${p.style === "anatomy" ? ANATOMY_STYLE : STYLE}`;

/** Words that would turn a stock scene into a claim about real people or results. */
const BANNED = /\b(before|after|transformation|member|client|result|lost \d|kg in|six[- ]pack|steroid|selfie|logo|brand)\b/i;
export const promptProblems = (p: VisualPrompt) => (BANNED.test(p.prompt) ? [`${p.id}: "${p.prompt.match(BANNED)?.[0]}"`] : []);
