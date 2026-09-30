import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, AyurvedicHerb, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

// Local Ayurvedic dataset compiled from open sources: Amidha, Ayurveda Herb Explorer, classical texts (traditional knowledge)
// This is traditional information, not clinical evidence — must be labeled as such
const LOCAL_AYURVEDA: Omit<AyurvedicHerb, "provenance">[] = [
  {
    id: "ashwagandha",
    name: "Ashwagandha",
    sanskritName: "अश्वगंधा",
    botanicalName: "Withania somnifera",
    englishName: "Indian Ginseng",
    hindiName: "अश्वगंधा",
    plantParts: ["Root", "Leaves"],
    rasa: ["Tikta", "Katu", "Madhura"],
    guna: ["Laghu", "Snigdha"],
    virya: "Ushna",
    vipaka: "Madhura",
    doshaKarma: ["Vata Shamaka", "Kapha Shamaka"],
    traditionalUses: ["Balya (strength)", "Rasayana (rejuvenation)", "Nidra (sleep support) in traditional use"],
    formulations: ["Ashwagandharishta", "Ashwagandha Churna", "Ashwagandha Ghrita"],
    evidenceLevel: "traditional",
  },
  {
    id: "turmeric",
    name: "Turmeric",
    sanskritName: "हरिद्रा",
    botanicalName: "Curcuma longa",
    englishName: "Turmeric",
    hindiName: "हल्दी",
    plantParts: ["Rhizome"],
    rasa: ["Tikta", "Katu"],
    guna: ["Laghu", "Ruksha"],
    virya: "Ushna",
    vipaka: "Katu",
    doshaKarma: ["Kapha Shamaka", "Vata Shamaka"],
    traditionalUses: ["Varnya (complexion)", "Krimighna (traditional)", "Vranaropana (wound healing traditional)"],
    formulations: ["Haridra Khanda", "Haridra Churna"],
    evidenceLevel: "traditional",
  },
  {
    id: "giloy",
    name: "Giloy",
    sanskritName: "गुडूची",
    botanicalName: "Tinospora cordifolia",
    englishName: "Heart-leaved Moonseed",
    hindiName: "गिलोय",
    plantParts: ["Stem", "Root"],
    rasa: ["Tikta", "Kashaya"],
    guna: ["Guru", "Snigdha"],
    virya: "Ushna",
    vipaka: "Madhura",
    doshaKarma: ["Tridosha Shamaka"],
    traditionalUses: ["Rasayana", "Jwara traditional management", "Rakta shodhana traditional"],
    formulations: ["Guduchi Satva", "Guduchi Ghanavati"],
    evidenceLevel: "traditional",
  },
  {
    id: "triphala",
    name: "Triphala",
    sanskritName: "त्रिफला",
    botanicalName: "Emblica officinalis + Terminalia chebula + Terminalia bellirica",
    englishName: "Three fruits",
    hindiName: "त्रिफला",
    plantParts: ["Fruit"],
    rasa: ["Pancha Rasa (except Lavana)"],
    guna: ["Laghu", "Ruksha"],
    virya: "Anushna",
    vipaka: "Madhura",
    doshaKarma: ["Tridosha Shamaka"],
    traditionalUses: ["Anulomana (traditional)", "Rasayana", "Chakshushya traditional"],
    formulations: ["Triphala Churna", "Triphala Guggulu"],
    evidenceLevel: "traditional",
  },
  {
    id: "brahmi",
    name: "Brahmi",
    sanskritName: "ब्राह्मी",
    botanicalName: "Bacopa monnieri",
    englishName: "Water Hyssop",
    hindiName: "ब्राह्मी",
    plantParts: ["Whole plant", "Leaves"],
    rasa: ["Tikta", "Kashaya", "Madhura"],
    guna: ["Laghu"],
    virya: "Shita",
    vipaka: "Madhura",
    doshaKarma: ["Vata Shamaka", "Pitta Shamaka"],
    traditionalUses: ["Medhya (traditional cognitive support)", "Ayushya", "Rasayana"],
    formulations: ["Brahmi Ghrita", "Brahmi Vati"],
    evidenceLevel: "traditional",
  },
];

export class AyurvedaProvider extends BaseHealthProvider<AyurvedicHerb> {
  name = "ayurveda";
  displayName = "Ayurveda (Traditional)";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_AYURVEDA !== "false",
    baseUrl: process.env.AYURVEDA_API_URL || "local-dataset",
    requiresKey: false,
    ttlMs: TTL.herb,
    timeoutMs: 5000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<AyurvedicHerb>> {
    const q = params.query.toLowerCase();
    const limit = params.limit ?? 20;
    const filtered = LOCAL_AYURVEDA.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.sanskritName?.toLowerCase().includes(q) ||
        h.botanicalName?.toLowerCase().includes(q) ||
        h.hindiName?.toLowerCase().includes(q) ||
        h.traditionalUses?.some((u) => u.toLowerCase().includes(q))
    ).slice(0, limit);
    const data = filtered.map((h) => ({
      ...h,
      provenance: {
        source: this.displayName,
        source_id: h.id,
        source_url: "https://en.wikipedia.org/wiki/Ayurveda + classical texts",
        license: "Traditional knowledge + CC BY-SA (Wikipedia) + open Ayurveda datasets (Amidha, etc.)",
        attribution: "Traditional Ayurvedic texts, Amidha, Ayurveda Herb Explorer (open), community contributions",
        retrieved_at: new Date().toISOString(),
        reliability_level: "traditional" as const,
      },
    }));
    return {
      data: data as (AyurvedicHerb & { provenance: DataProvenance })[],
      total: filtered.length,
      limit,
      offset: 0,
      hasMore: false,
      source: this.displayName,
      live: false,
      cached: true,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getById(id: string) {
    const found = LOCAL_AYURVEDA.find((h) => h.id === id.toLowerCase() || h.name.toLowerCase() === id.toLowerCase());
    if (!found) return null;
    return {
      ...found,
      provenance: {
        source: this.displayName,
        source_id: found.id,
        source_url: "local-dataset",
        license: "Traditional knowledge",
        attribution: "Classical Ayurvedic texts + open datasets",
        retrieved_at: new Date().toISOString(),
        reliability_level: "traditional",
      },
    } as AyurvedicHerb & { provenance: DataProvenance };
  }
}

export const ayurvedaProvider = new AyurvedaProvider();
