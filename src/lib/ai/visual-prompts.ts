// Prompts for the one-time Imagen / Veo job (scripts/gemini/visuals.ts), paid from the Google
// Cloud credit. Plain module so the GitHub Action script and the tests can both use it.
//
// House rules for AI visuals: stock-style scenes only. No identifiable faces, no "members", no
// before/after or body results, no text, logos or brands. Every file is labelled AI when posted
// (Meta "AI info" label, YouTube "altered or synthetic content").

export type VisualPrompt = { id: string; prompt: string; use: string };

const STYLE = "Photorealistic, natural light, warm tones, shallow depth of field, Indian setting. No text, no logos, no brand names, no watermarks. No identifiable faces: faces out of frame, turned away or in silhouette.";

export const IMAGE_PROMPTS: VisualPrompt[] = [
  { id: "dumbbell-rack", prompt: "A neat rack of black hex dumbbells in a small, clean neighbourhood gym in India, early morning light through a window.", use: "Gym posts, ad backgrounds" },
  { id: "chalk-hands", prompt: "Close-up of hands rubbing gym chalk next to a barbell, chalk dust in the light.", use: "Strength tips Reels cover" },
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

export const fullPrompt = (p: VisualPrompt) => `${p.prompt} ${STYLE}`;

/** Words that would turn a stock scene into a claim about real people or results. */
const BANNED = /\b(before|after|transformation|member|client|result|lost \d|kg in|six[- ]pack|steroid|selfie|logo|brand)\b/i;
export const promptProblems = (p: VisualPrompt) => (BANNED.test(p.prompt) ? [`${p.id}: "${p.prompt.match(BANNED)?.[0]}"`] : []);
