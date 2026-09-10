/**
 * Core types for Health Data Integration Layer
 */

export type ProviderStatus =
  | "AVAILABLE"
  | "REQUIRES_API_KEY"
  | "LICENSE_REVIEW"
  | "EXPERIMENTAL"
  | "UNAVAILABLE"
  | "SELF_HOST_REQUIRED"
  | "DISABLED";

export type ProviderCapability = {
  search: boolean;
  getById: boolean;
  getDetails: boolean;
  barcode?: boolean;
  healthCheck: boolean;
};

export type ProviderHealth = {
  provider: string;
  status: ProviderStatus;
  enabled: boolean;
  lastCheck?: string;
  lastSuccess?: string;
  lastError?: string;
  responseTimeMs?: number;
  recordsImported?: number;
  rateLimitRemaining?: number;
  message?: string;
};

export type SearchParams = {
  query: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, string>;
  language?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  source: string;
  live: boolean;
  cached: boolean;
  fetchedAt: string;
};

export type DataProvenance = {
  source: string;
  source_id: string;
  source_url?: string;
  license?: string;
  attribution?: string;
  retrieved_at: string;
  last_updated?: string;
  data_version?: string;
  reliability_level?: "high" | "medium" | "low" | "traditional";
};

export interface HealthProvider<T = unknown, D = unknown> {
  name: string;
  displayName: string;
  status: ProviderStatus;
  capabilities: ProviderCapability;
  config: {
    enabled: boolean;
    baseUrl: string;
    requiresKey: boolean;
    keyEnvVar?: string;
    ttlMs: number;
    timeoutMs: number;
    rateLimitPerMinute?: number;
  };

  search(params: SearchParams): Promise<PaginatedResult<T>>;
  getById(id: string): Promise<(T & { provenance: DataProvenance }) | null>;
  getDetails?(id: string): Promise<D | null>;
  healthCheck(): Promise<ProviderHealth>;
  getCapabilities(): ProviderCapability;
}

// Common domain types
export type Food = {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  nutrients: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    saturatedFat?: number;
  };
  ingredients?: string[];
  allergens?: string[];
  servingSize?: string;
  image?: string;
  nutriScore?: string;
  novaGroup?: number;
  provenance: DataProvenance;
};

export type Exercise = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  muscles: string[];
  secondaryMuscles?: string[];
  equipment: string[];
  images?: string[];
  difficulty?: string;
  provenance: DataProvenance;
};

export type Drug = {
  id: string;
  genericName: string;
  brandNames: string[];
  activeIngredients: string[];
  drugClass?: string;
  indications?: string[];
  contraindications?: string[];
  warnings?: string[];
  adverseReactions?: string[];
  dosage?: string;
  chemicalInfo?: {
    formula?: string;
    molecularWeight?: number;
    smiles?: string;
  };
  provenance: DataProvenance;
};

export type AyurvedicHerb = {
  id: string;
  name: string;
  sanskritName?: string;
  botanicalName?: string;
  englishName?: string;
  hindiName?: string;
  plantParts?: string[];
  rasa?: string[]; // taste
  guna?: string[]; // qualities
  virya?: string; // potency
  vipaka?: string; // post-digestive
  doshaKarma?: string[]; // dosha action
  traditionalUses?: string[];
  formulations?: string[];
  evidenceLevel?: "traditional" | "limited" | "moderate" | "strong";
  provenance: DataProvenance;
};

export type HomeopathicRemedy = {
  id: string;
  name: string;
  commonNames?: string[];
  scientificName?: string;
  materiaMedicaRef?: string;
  traditionalIndications?: string[];
  potencyInfo?: string;
  provenance: DataProvenance;
};

export type MedicalArticle = {
  id: string;
  title: string;
  authors?: string[];
  journal?: string;
  pubDate?: string;
  abstract?: string;
  url?: string;
  doi?: string;
  provenance: DataProvenance;
};

export type ClinicalTrial = {
  id: string;
  nctId: string;
  title: string;
  status: string;
  phase?: string[];
  conditions?: string[];
  locations?: string[];
  url?: string;
  provenance: DataProvenance;
};

export type DiseaseCode = {
  code: string;
  system: "ICD-10" | "SNOMED" | "CUSTOM";
  display: string;
  definition?: string;
  provenance: DataProvenance;
};

export type UserHealthProfile = {
  userId: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  goals?: string[];
  conditions?: string[];
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
};
