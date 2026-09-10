"use client";

import { AFFILIATE_PRODUCTS, getAffiliateByCategory } from "@/lib/monetization/config";
import { AffiliateProductCard } from "./ProductCards";
import type { MonetizationCategory } from "@/lib/monetization/types";

interface Props {
  condition?: string; // e.g., "diabetes", "hypertension", "weight-loss"
  category?: MonetizationCategory;
  tags?: string[];
  limit?: number;
  page?: string;
  title?: string;
}

// Contextual product recommendations — most important feature
// Example mapping: Diabetes → Glucometer, strips, books, exercise, healthy foods
// Uses neutral language: "Products that may help with monitoring, education, or lifestyle management."

const CONDITION_MAP: Record<string, { categories: MonetizationCategory[]; tags: string[]; title: string }> = {
  diabetes: {
    categories: ["Diabetes", "Medical Devices", "Healthy Foods", "Books", "Fitness"],
    tags: ["diabetes", "monitoring", "glucometer"],
    title: "Products that may help with monitoring, education, or lifestyle management — Diabetes",
  },
  hypertension: {
    categories: ["Blood Pressure", "Medical Devices", "Fitness", "Healthy Foods"],
    tags: ["hypertension", "bp", "monitoring"],
    title: "Products for monitoring & lifestyle — Blood Pressure",
  },
  "high-blood-pressure": {
    categories: ["Blood Pressure", "Medical Devices"],
    tags: ["hypertension", "bp"],
    title: "Monitoring & education — Hypertension",
  },
  "weight-loss": {
    categories: ["Weight Management", "Fitness", "Healthy Foods", "Books"],
    tags: ["weight", "fitness", "protein"],
    title: "Products that may help with lifestyle management — Weight",
  },
  obesity: {
    categories: ["Weight Management", "Fitness", "Nutrition"],
    tags: ["weight", "fitness"],
    title: "Lifestyle & nutrition — Weight Management",
  },
  yoga: {
    categories: ["Yoga", "Fitness"],
    tags: ["yoga", "fitness"],
    title: "Yoga essentials — mats, blocks, bands",
  },
  ayurveda: {
    categories: ["Ayurveda", "Books", "Healthy Foods"],
    tags: ["ayurveda", "herbs"],
    title: "Ayurveda books & products — educational",
  },
  "heart-disease": {
    categories: ["Heart Health", "Healthy Foods", "Medical Devices"],
    tags: ["heart", "cholesterol"],
    title: "Heart health — monitoring & nutrition",
  },
  pcos: {
    categories: ["Women's Health", "Nutrition", "Fitness"],
    tags: ["pcos", "women"],
    title: "PCOS — nutrition & lifestyle support",
  },
};

export function HealthProductRecommendations({ condition, category, tags = [], limit = 4, page = "/", title }: Props) {
  let products = AFFILIATE_PRODUCTS.filter((p) => p.active);

  if (condition) {
    const key = condition.toLowerCase().replace(/\s+/g, "-");
    const mapping = CONDITION_MAP[key] || CONDITION_MAP[condition.toLowerCase()];
    if (mapping) {
      products = products.filter((p) => mapping.categories.includes(p.category) || p.tags?.some((t) => mapping.tags.includes(t.toLowerCase())));
    } else {
      // fallback: filter by tags
      products = products.filter((p) => p.tags?.some((t) => tags.includes(t) || condition.toLowerCase().includes(t.toLowerCase())));
    }
  }

  if (category) {
    const byCat = getAffiliateByCategory(category, limit);
    if (byCat.length) products = byCat;
    else products = products.filter((p) => p.category === category);
  }

  if (tags.length) {
    const tagLower = tags.map((t) => t.toLowerCase());
    products = products.filter((p) => p.tags?.some((t) => tagLower.includes(t.toLowerCase())) || tagLower.includes(p.category.toLowerCase()));
  }

  products = products.sort((a, b) => b.priority - a.priority).slice(0, limit);

  if (products.length === 0) {
    // fallback to featured
    products = AFFILIATE_PRODUCTS.filter((p) => p.featured && p.active)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  const displayTitle = title || (condition ? CONDITION_MAP[condition.toLowerCase()]?.title || `Recommended for ${condition}` : category ? `Recommended — ${category}` : "Products that may help with monitoring, education, or lifestyle management");

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="text-sm font-bold">{displayTitle}</h3>
      <p className="mt-1 text-[11px] text-stone-500">Neutral, educational — never claims product treats disease. Affiliate disclosure below each product.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {products.map((p) => (
          <AffiliateProductCard key={p.id} product={p} page={page} />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-stone-400">Affiliate link — we may earn a commission at no additional cost to you. Products that may help with monitoring, education, or lifestyle management — not treatment.</p>
    </div>
  );
}
