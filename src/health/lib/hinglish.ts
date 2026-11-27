import { searchAll, type SearchItem } from "./search-index";

/** Hindi / Hinglish words people type, mapped to the English term the site's pages use. */
export const HINGLISH_ALIASES: Record<string, string[]> = {
  diabetes: ["madhumeh", "sugar ki bimari", "cheeni ki bimari", "sugar", "मधुमेह", "शुगर"],
  hypertension: ["high bp", "bp badhna", "ucch raktchaap", "blood pressure", "bp", "हाई बीपी"],
  thyroid: ["thyroid", "gale ki granthi", "hypothyroid", "थायराइड"],
  anemia: ["khoon ki kami", "anaemia", "khoon kam", "खून की कमी"],
  obesity: ["motapa", "wazan badhna", "मोटापा"],
  "fatty liver": ["fatty liver", "liver mein charbi"],
  acidity: ["acidity", "gas", "pet mein jalan", "एसिडिटी"],
  ashwagandha: ["ashvagandha", "asgandh", "अश्वगंधा"],
  turmeric: ["haldi", "haridra", "हल्दी"],
  fenugreek: ["methi", "मेथी"],
  "bitter gourd": ["karela", "करेला"],
  garlic: ["lehsun", "lahsun", "लहसुन"],
  ginger: ["adrak", "अदरक"],
  ragi: ["ragi", "nachni", "mandua", "finger millet"],
  tulsi: ["tulsi", "holy basil"],
};

export function expandHinglish(q: string): { term: string | null; aliases: string[] } {
  const lower = q.toLowerCase();
  for (const [en, aliases] of Object.entries(HINGLISH_ALIASES)) {
    if (lower.includes(en) || aliases.some((a) => new RegExp(`(^|\\s)${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(lower))) return { term: en, aliases };
  }
  return { term: null, aliases: [] };
}

/** Search the site's own guides (diseases, herbs, foods, articles…) with the Hinglish words translated. */
export function hinglishSearch(q: string, limit = 12): SearchItem[] {
  const { term } = expandHinglish(q);
  if (term) {
    const hits = searchAll(term, limit);
    if (hits.length) return hits;
  }
  return searchAll(q, limit);
}
