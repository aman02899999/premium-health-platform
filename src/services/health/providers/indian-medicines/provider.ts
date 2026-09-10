import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

type IndianMedicine = {
  id: string;
  name: string;
  genericComposition?: string;
  dosageForm?: string;
  manufacturer?: string;
  pharmacologicalInfo?: string;
  provenance: DataProvenance;
};

export class IndianMedicineProvider extends BaseHealthProvider<IndianMedicine> {
  name = "indian-medicines";
  displayName = "Indian Medicines (EKA)";
  status: ProviderStatus = "LICENSE_REVIEW";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_INDIAN_MEDICINE === "true",
    baseUrl: process.env.INDIAN_MEDICINE_API_URL || "https://eka.care/api",
    requiresKey: true,
    keyEnvVar: "INDIAN_MEDICINE_API_KEY",
    ttlMs: TTL.drugSearch,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<IndianMedicine>> {
    if (!this.config.enabled) {
      return {
        data: [],
        total: 0,
        limit: params.limit ?? 20,
        offset: 0,
        hasMore: false,
        source: this.displayName,
        live: false,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    }
    // Stub — real EKA API requires partnership and license review
    return {
      data: [],
      total: 0,
      limit: params.limit ?? 20,
      offset: 0,
      hasMore: false,
      source: this.displayName,
      live: false,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getById(id: string) {
    return null;
  }

  async healthCheck() {
    return {
      provider: this.name,
      status: this.status,
      enabled: this.config.enabled,
      lastCheck: new Date().toISOString(),
      message: "LICENSE_REVIEW_REQUIRED: EKA APIs require commercial partnership and license verification. See docs/API_PROVIDERS.md",
    };
  }
}

export const indianMedicineProvider = new IndianMedicineProvider();
