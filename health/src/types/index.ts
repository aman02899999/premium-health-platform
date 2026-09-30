export type ContentStatus =
  | "draft"
  | "ai-draft"
  | "editorial-review"
  | "medical-review"
  | "approved"
  | "published"
  | "needs-update";

export type NewsCategory =
  | "Outbreak Advisory"
  | "Seasonal Care"
  | "Research Digest"
  | "Government Health"
  | "AYUSH Update"
  | "Nutrition Science"
  | "Hospital & Policy"
  | "Drug Safety";

export type NewsItem = {
  slug: string;
  title: string;
  summary: string;
  category: NewsCategory;
  /** ISO string — set at request time so the feed always looks current */
  publishedAt: string;
  updatedAt: string;
  sourceName: string;
  sourceUrl: string;
  /** "briefing" = our own daily digest; "advisory" = pointer to official guidance */
  kind: "briefing" | "advisory" | "digest";
  status: "draft" | "published";
  body: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
  keyTakeaways: string[];
  tags: string[];
  relatedDiseases: string[];
  relatedLabs: string[];
  relatedHerbs: string[];
  author: string;
  reviewer: string;
  factCheckNote: string;
  imagePrompt: string;
};

export type DiseaseSummary = {
  slug: string;
  name: string;
  hindiName?: string;
  short: string;
  system: string;
  category: string;
  chronic: boolean;
  common: boolean;
  gender: "all" | "female" | "male";
  ageGroups: string[];
  symptoms: string[];
  riskFactors: string[];
  severity: "low" | "moderate" | "high" | "emergency-aware";
  ayurvedaCategory?: string;
  nutritionRelevance: "high" | "medium" | "low";
  pillar?: boolean;
};

export type Faq = { q: string; a: string };

export type Reference = { title: string; source: string; year?: string; url?: string };

export type DiseaseDetail = DiseaseSummary & {
  definition: string;
  quickFacts: { label: string; value: string }[];
  causes: string[];
  types?: { name: string; desc: string }[];
  diagnosis: string[];
  investigations: { test: string; purpose: string; slug?: string }[];
  modernTreatment: string[];
  ayurvedaView: string[];
  herbsUsed: { name: string; slug: string; note: string }[];
  nutrition: string[];
  lifestyle: string[];
  yogaActivity: string[];
  homeopathyNote: string[];
  evidenceNotes: string[];
  shouldNotDo: string[];
  medicationSafety: string[];
  complications: string[];
  emergencySigns: string[];
  whenToSeeDoctor: string[];
  faqs: Faq[];
  references: Reference[];
  relatedDiseases: string[];
  relatedMedicines: string[];
  relatedHerbs: string[];
  relatedLabs: string[];
  updatedAt: string;
  imagePrompt: string;
};

export type Herb = {
  slug: string;
  name: string;
  botanicalName: string;
  hindiName: string;
  sanskritName?: string;
  otherNames: string[];
  short: string;
  traditionalUses: string[];
  preparations: string[];
  mechanisms: string[];
  evidenceSummary: string;
  evidenceLevel: "strong" | "moderate" | "limited" | "mixed" | "insufficient";
  benefits: string[];
  safety: string[];
  sideEffects: string[];
  interactions: string[];
  pregnancy: string;
  organCaution: string;
  avoidBy: string[];
  quality: string[];
  whenToConsult: string[];
  relatedDiseases: string[];
  faqs: Faq[];
  references: Reference[];
  updatedAt: string;
  imagePrompt: string;
};

export type Medicine = {
  slug: string;
  genericName: string;
  brandExamples: string[];
  drugClass: string;
  short: string;
  indications: string[];
  mechanism: string;
  commonSideEffects: string[];
  seriousEffects: string[];
  contraindications: string[];
  interactions: string[];
  foodInteractions: string[];
  monitoring: string[];
  pregnancy: string;
  organCaution: string;
  warnings: string[];
  misconceptions: { myth: string; fact: string }[];
  relatedDiseases: string[];
  relatedLabs: string[];
  faqs: Faq[];
  references: Reference[];
  updatedAt: string;
  imagePrompt: string;
};

export type Food = {
  slug: string;
  name: string;
  hindiName?: string;
  category: string;
  short: string;
  nutrients: { nutrient: string; amount: string; note?: string }[];
  benefits: string[];
  limitations: string[];
  serving: string;
  cookingMethods: string[];
  caution: string[];
  relatedDiseases: string[];
  recipes: { name: string; desc: string }[];
  faqs: Faq[];
  references: Reference[];
  updatedAt: string;
  imagePrompt: string;
};

export type LabTest = {
  slug: string;
  name: string;
  shortName?: string;
  short: string;
  measures: string;
  whyOrdered: string[];
  preparation: string[];
  normalRange: string;
  abnormalMeaning: string[];
  limitations: string[];
  questionsToAsk: string[];
  relatedDiseases: string[];
  faqs: Faq[];
  references: Reference[];
  updatedAt: string;
  imagePrompt: string;
};

export type Article = {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  excerpt: string;
  body: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  keyTakeaways: string[];
  faqs: Faq[];
  references: Reference[];
  author: string;
  authorRole?: string;
  reviewer: string;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  featured?: boolean;
  trending?: boolean;
  imagePrompt: string;
  heroImage?: string;
  heroImageAlt?: string;
  heroImageCredit?: string;
  inlineImage?: string;
  inlineImageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  short: string;
  description: string;
  benefits: string[];
  limitations: string[];
  pricePlaceholder: string;
  ratingPlaceholder: string;
  merchant: string;
  affiliateUrl: string;
  cta: string;
  relatedTopics: string[];
  imagePrompt: string;
};

export type Symptom = {
  slug: string;
  name: string;
  short: string;
  categories: string[];
  urgency: "self-care" | "routine" | "prompt" | "emergency";
  questions: string[];
  possibleCategories: string[];
  careGuidance: string[];
  emergencySigns: string[];
  relatedDiseases: string[];
  faqs: Faq[];
  updatedAt: string;
};

export type DietPlan = {
  slug: string;
  title: string;
  audience: string;
  short: string;
  principles: string[];
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snacks: string[];
  beverages: string[];
  shoppingList: string[];
  portionGuidance: string[];
  cautions: string[];
  relatedDiseases: string[];
};
