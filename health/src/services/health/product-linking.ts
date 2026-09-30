/**
 * Product / Affiliate Integration
 * Allows health entities to connect to relevant products
 * Keeps affiliate content clearly separated from medical evidence
 */

import { PRODUCTS } from "@/data/editorial";

type ProductLink = {
  productSlug: string;
  productName: string;
  relevance: string;
  category: string;
  affiliate: boolean;
};

const FOOD_PRODUCT_MAP: Record<string, string[]> = {
  apple: ["cold-pressed-mustard-oil"],
  milk: ["digital-glucometer-combo"],
  atta: ["cold-pressed-mustard-oil"],
  oats: ["cold-pressed-mustard-oil"],
};

const EXERCISE_PRODUCT_MAP: Record<string, string[]> = {
  chest: ["upper-arm-bp-monitor"],
  yoga: ["cold-pressed-mustard-oil"],
  fitness: ["upper-arm-bp-monitor", "digital-glucometer-combo"],
};

const HERB_PRODUCT_MAP: Record<string, string[]> = {
  ashwagandha: ["cold-pressed-mustard-oil"],
  turmeric: ["cold-pressed-mustard-oil"],
};

export function getProductsForFood(foodName: string): ProductLink[] {
  const key = foodName.toLowerCase();
  const slugs = Object.entries(FOOD_PRODUCT_MAP)
    .filter(([k]) => key.includes(k))
    .flatMap(([, v]) => v);
  return slugs
    .map((slug) => PRODUCTS.find((p) => p.slug === slug))
    .filter(Boolean)
    .map((p) => ({
      productSlug: p!.slug,
      productName: p!.name,
      relevance: `Nutrition product relevant to ${foodName}`,
      category: p!.category,
      affiliate: true,
    }));
}

export function getProductsForExercise(exerciseName: string): ProductLink[] {
  const key = exerciseName.toLowerCase();
  const slugs = Object.entries(EXERCISE_PRODUCT_MAP)
    .filter(([k]) => key.includes(k))
    .flatMap(([, v]) => v);
  return slugs
    .map((slug) => PRODUCTS.find((p) => p.slug === slug))
    .filter(Boolean)
    .map((p) => ({
      productSlug: p!.slug,
      productName: p!.name,
      relevance: `Fitness product relevant to ${exerciseName}`,
      category: p!.category,
      affiliate: true,
    }));
}

export function getProductsForHerb(herbName: string): ProductLink[] {
  const key = herbName.toLowerCase();
  const slugs = Object.entries(HERB_PRODUCT_MAP)
    .filter(([k]) => key.includes(k))
    .flatMap(([, v]) => v);
  return slugs
    .map((slug) => PRODUCTS.find((p) => p.slug === slug))
    .filter(Boolean)
    .map((p) => ({
      productSlug: p!.slug,
      productName: p!.name,
      relevance: `Permitted product link for herb ${herbName} — clearly separated from medical evidence`,
      category: p!.category,
      affiliate: true,
    }));
}

export function getProductsForDrug(): ProductLink[] {
  // For medicines, do NOT automatically create unsafe purchase recommendations
  return [];
}
