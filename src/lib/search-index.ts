import { DISEASES } from "@/data/diseases-index";
import { HERBS } from "@/data/herbs";
import { MEDICINES } from "@/data/medicines";
import { FOODS } from "@/data/nutrition";
import { LAB_TESTS, SYMPTOMS } from "@/data/clinical";
import { ARTICLES, PRODUCTS } from "@/data/editorial";

export type SearchItem = {
  title: string;
  hindi?: string;
  desc: string;
  href: string;
  type: "Disease" | "Symptom" | "Medicine" | "Herb" | "Food" | "Lab Test" | "Article" | "Product";
  keywords: string;
};

let cache: SearchItem[] | null = null;

export function buildIndex(): SearchItem[] {
  if (cache) return cache;
  const items: SearchItem[] = [
    ...DISEASES.map((d) => ({ title: d.name, hindi: d.hindiName, desc: d.short, href: `/diseases/${d.slug}`, type: "Disease" as const, keywords: `${d.name} ${d.hindiName || ""} ${d.symptoms.join(" ")} ${d.system} ${d.category}`.toLowerCase() })),
    ...SYMPTOMS.map((s) => ({ title: s.name, desc: s.short, href: `/symptoms/${s.slug}`, type: "Symptom" as const, keywords: `${s.name} ${s.categories.join(" ")}`.toLowerCase() })),
    ...MEDICINES.map((m) => ({ title: m.genericName, desc: m.short, href: `/medicines/${m.slug}`, type: "Medicine" as const, keywords: `${m.genericName} ${m.brandExamples.join(" ")} ${m.drugClass}`.toLowerCase() })),
    ...HERBS.map((h) => ({ title: `${h.name}`, hindi: h.hindiName, desc: h.short, href: `/herbs/${h.slug}`, type: "Herb" as const, keywords: `${h.name} ${h.hindiName} ${h.botanicalName} ${h.otherNames.join(" ")}`.toLowerCase() })),
    ...FOODS.map((f) => ({ title: f.name, hindi: f.hindiName, desc: f.short, href: `/nutrition/${f.slug}`, type: "Food" as const, keywords: `${f.name} ${f.hindiName || ""} ${f.category}`.toLowerCase() })),
    ...LAB_TESTS.map((l) => ({ title: l.name, desc: l.short, href: `/lab-tests/${l.slug}`, type: "Lab Test" as const, keywords: `${l.name} ${l.shortName || ""}`.toLowerCase() })),
    ...ARTICLES.map((a) => ({ title: a.title, desc: a.excerpt, href: `/blog/${a.slug}`, type: "Article" as const, keywords: `${a.title} ${a.tags.join(" ")} ${a.category}`.toLowerCase() })),
    ...PRODUCTS.map((p) => ({ title: p.name, desc: p.short, href: `/products/${p.slug}`, type: "Product" as const, keywords: `${p.name} ${p.category}`.toLowerCase() })),
  ];
  cache = items;
  return items;
}

export function searchAll(query: string, limit = 12): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const idx = buildIndex();
  const synonyms: Record<string, string[]> = {
    sugar: ["diabetes", "glucose", "hba1c", "metformin", "fenugreek", "karela", "bitter"],
    bp: ["blood pressure", "amlodipine", "losartan"],
    karela: ["bitter-gourd", "bitter gourd"],
    methi: ["fenugreek"],
    haldi: ["turmeric"],
    lehsun: ["garlic"],
    adrak: ["ginger"],
  };
  let expanded = q;
  for (const [k, vals] of Object.entries(synonyms)) {
    if (q.includes(k)) expanded += " " + vals.join(" ");
  }
  const tokens = expanded.split(/\s+/).filter((t) => t.length > 1);
  const scored = idx
    .map((item) => {
      const hay = `${item.title} ${item.desc} ${item.keywords}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (item.title.toLowerCase().includes(t)) score += 5;
        else if (hay.includes(t)) score += 2;
      }
      if (item.title.toLowerCase().startsWith(q)) score += 6;
      return { item, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
  return scored;
}
