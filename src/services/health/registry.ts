/**
 * Provider registry — central place to register all health providers
 * Supports enable/disable, health monitoring, fallback
 */

import { HealthProvider, ProviderHealth } from "./types";
import { wgerProvider } from "./providers/wger/provider";
import { openFoodFactsProvider } from "./providers/openfoodfacts/provider";
import { usdaProvider } from "./providers/usda/provider";
import { openFDAProvider } from "./providers/openfda/provider";
import { rxNormProvider } from "./providers/rxnorm/provider";
import { pubChemProvider } from "./providers/pubchem/provider";
import { pubMedProvider } from "./providers/pubmed/provider";
import { clinicalTrialsProvider } from "./providers/clinicaltrials/provider";
import { icd10Provider } from "./providers/icd10/provider";
import { snomedProvider } from "./providers/snomed/provider";
import { ayurvedaProvider } from "./providers/ayurveda/provider";
import { homeopathyProvider } from "./providers/homeopathy/provider";
import { indianMedicineProvider } from "./providers/indian-medicines/provider";
import { worldBankProvider } from "./providers/worldbank/provider";
import { openMeteoProvider } from "./providers/openmeteo/provider";
import { europePmcProvider } from "./providers/europepmc/provider";
import { openAlexProvider } from "./providers/openalex/provider";
import { fruityviceProvider } from "./providers/fruityvice/provider";
import { openMeteoAirProvider } from "./providers/openmeteo-air/provider";

export const providers: Record<string, HealthProvider> = {
  wger: wgerProvider,
  openfoodfacts: openFoodFactsProvider,
  usda: usdaProvider,
  openfda: openFDAProvider,
  rxnorm: rxNormProvider,
  pubchem: pubChemProvider,
  pubmed: pubMedProvider,
  clinicaltrials: clinicalTrialsProvider,
  icd10: icd10Provider,
  snomed: snomedProvider,
  ayurveda: ayurvedaProvider,
  homeopathy: homeopathyProvider,
  "indian-medicines": indianMedicineProvider,
  worldbank: worldBankProvider,
  openmeteo: openMeteoProvider,
  // Added for the developer API surface (all keyless, open-licensed)
  europepmc: europePmcProvider,
  openalex: openAlexProvider,
  fruityvice: fruityviceProvider,
  "openmeteo-air": openMeteoAirProvider,
};

export function getProvider(name: string): HealthProvider | null {
  return providers[name] ?? null;
}

export function listProviders(): HealthProvider[] {
  return Object.values(providers);
}

export function enabledProviders(): HealthProvider[] {
  return Object.values(providers).filter((p) => p.config.enabled);
}

export async function healthCheckAll(): Promise<ProviderHealth[]> {
  const checks = await Promise.allSettled(listProviders().map((p) => p.healthCheck()));
  return checks.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const p = listProviders()[i];
    return {
      provider: p.name,
      status: p.status,
      enabled: p.config.enabled,
      lastCheck: new Date().toISOString(),
      lastError: r.reason instanceof Error ? r.reason.message : String(r.reason),
      message: "Health check failed",
    } as ProviderHealth;
  });
}

export function getProviderByCategory(category: string): HealthProvider[] {
  const map: Record<string, string[]> = {
    fitness: ["wger"],
    nutrition: ["openfoodfacts", "usda"],
    medical: ["openfda", "rxnorm", "pubchem"],
    terminology: ["icd10", "snomed"],
    research: ["pubmed", "clinicaltrials"],
    ayurveda: ["ayurveda"],
    homeopathy: ["homeopathy"],
    indian: ["indian-medicines"],
    health: ["worldbank", "openmeteo"],
  };
  const names = map[category] ?? [];
  return names.map((n) => providers[n]).filter(Boolean);
}
