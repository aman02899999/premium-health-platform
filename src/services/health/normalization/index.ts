/**
 * Normalization layer — converts provider-specific data to common types
 * Handles multilingual aliases, medical terminology normalization
 */

export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
}

export function normalizeDiseaseName(name: string): string {
  const map: Record<string, string> = {
    "मधुमेह": "diabetes",
    "diabetes / sugar": "diabetes",
    "sugar": "diabetes",
    "उच्च रक्तचाप": "hypertension",
    "bp": "hypertension",
    "high bp": "hypertension",
    "अश्वगंधा": "ashwagandha",
  };
  const lower = name.toLowerCase().trim();
  return map[lower] ?? lower;
}

export function normalizeFoodName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

export function buildAliases(canonical: string, hindi?: string, hinglish?: string[]): string[] {
  const aliases = new Set<string>();
  aliases.add(canonical.toLowerCase());
  if (hindi) aliases.add(hindi.toLowerCase());
  if (hinglish) hinglish.forEach((h) => aliases.add(h.toLowerCase()));
  // Add slug version
  aliases.add(canonical.toLowerCase().replace(/\s+/g, "-"));
  aliases.add(canonical.toLowerCase().replace(/\s+/g, "_"));
  return Array.from(aliases);
}

export function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").slice(0, 5000);
}

export function extractNutrientsFromOpenFoodFacts(nutriments: Record<string, number>) {
  return {
    calories: nutriments["energy-kcal_100g"],
    protein: nutriments.proteins_100g,
    carbs: nutriments.carbohydrates_100g,
    fat: nutriments.fat_100g,
    fiber: nutriments.fiber_100g,
    sugar: nutriments.sugars_100g,
    sodium: nutriments.sodium_100g,
    saturatedFat: nutriments["saturated-fat_100g"],
  };
}

export function mapWgerMuscleToCommon(muscle: string): string {
  const map: Record<string, string> = {
    "Biceps brachii": "Biceps",
    "Triceps brachii": "Triceps",
    "Pectoralis major": "Chest",
    "Latissimus dorsi": "Lats",
    "Quadriceps femoris": "Quads",
  };
  return map[muscle] ?? muscle;
}
