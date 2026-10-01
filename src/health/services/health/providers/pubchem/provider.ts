import { BaseHealthProvider } from "../base";
import { SearchParams, PaginatedResult, ProviderStatus, ProviderCapability, DataProvenance } from "../../types";
import { TTL } from "../../cache";

type PubChemCompound = {
  id: string;
  formula?: string;
  molecularWeight?: number;
  smiles?: string;
  iupacName?: string;
  title?: string;
};

export class PubChemProvider extends BaseHealthProvider<PubChemCompound> {
  name = "pubchem";
  displayName = "PubChem";
  status: ProviderStatus = "AVAILABLE";
  capabilities: ProviderCapability = { search: true, getById: true, getDetails: true, healthCheck: true };
  config = {
    enabled: process.env.ENABLE_PUBCHEM !== "false",
    baseUrl: process.env.PUBCHEM_API_URL || "https://pubchem.ncbi.nlm.nih.gov/rest/pug",
    requiresKey: false,
    ttlMs: TTL.drugDetails,
    timeoutMs: 8000,
  };

  async search(params: SearchParams): Promise<PaginatedResult<PubChemCompound>> {
    const key = `pubchem-search-${params.query.toLowerCase()}-${params.limit ?? 10}`;
    return this.cachedSearch(key, this.config.ttlMs, async () => {
      // Search by name -> get CID list
      const url = `${this.config.baseUrl}/compound/name/${encodeURIComponent(params.query)}/cids/JSON?name_type=word`;
      const json = (await this.fetchJson(url)) as { IdentifierList?: { CID?: number[] } } | null;
      const cids = json?.IdentifierList?.CID?.slice(0, params.limit ?? 10) ?? [];
      if (cids.length === 0) {
        return {
          data: [],
          total: 0,
          limit: params.limit ?? 10,
          offset: 0,
          hasMore: false,
          source: this.displayName,
          live: false,
          cached: false,
          fetchedAt: new Date().toISOString(),
        };
      }
      const data = await Promise.all(cids.map((cid) => this.fetchCompound(String(cid))));
      const filtered = data.filter(Boolean) as PubChemCompound[];
      return {
        data: filtered as (PubChemCompound & { provenance: DataProvenance })[],
        total: cids.length,
        limit: params.limit ?? 10,
        offset: 0,
        hasMore: false,
        source: this.displayName,
        live: true,
        cached: false,
        fetchedAt: new Date().toISOString(),
      };
    });
  }

  async getById(id: string) {
    const compound = await this.fetchCompound(id);
    return compound as PubChemCompound & { provenance: DataProvenance };
  }

  private async fetchCompound(cid: string): Promise<(PubChemCompound & { provenance: DataProvenance }) | null> {
    const url = `${this.config.baseUrl}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName,Title/JSON`;
    const json = (await this.fetchJson(url)) as { PropertyTable?: { Properties?: { CID: number; MolecularFormula?: string; MolecularWeight?: number; CanonicalSMILES?: string; IUPACName?: string; Title?: string }[] } } | null;
    const prop = json?.PropertyTable?.Properties?.[0];
    if (!prop) return null;
    return {
      id: String(prop.CID),
      formula: prop.MolecularFormula,
      molecularWeight: prop.MolecularWeight,
      smiles: prop.CanonicalSMILES,
      iupacName: prop.IUPACName,
      title: prop.Title,
      provenance: {
        source: this.displayName,
        source_id: String(prop.CID),
        source_url: `https://pubchem.ncbi.nlm.nih.gov/compound/${prop.CID}`,
        license: "Public Domain",
        attribution: "National Center for Biotechnology Information",
        retrieved_at: new Date().toISOString(),
        reliability_level: "high",
      },
    };
  }
}

export const pubChemProvider = new PubChemProvider();
