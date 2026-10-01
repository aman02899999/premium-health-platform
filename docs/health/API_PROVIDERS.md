# API Providers

See `api-providers.json` for machine-readable metadata.

## Summary

| Provider | Status | Key Required | License | Use |
|----------|--------|--------------|---------|-----|
| wger | AVAILABLE | No | AGPL-3.0 | Fitness exercises |
| Open Food Facts | AVAILABLE | No | ODbL + DBCL | Nutrition |
| USDA | REQUIRES_API_KEY | Yes (free) | Public Domain | Nutrition |
| openFDA | AVAILABLE | No (optional) | Public Domain | Drugs |
| RxNorm | AVAILABLE | No | UMLS | Drug normalization |
| PubChem | AVAILABLE | No | Public Domain | Chemical |
| PubMed | AVAILABLE | No | Varies | Medical literature |
| ClinicalTrials.gov | AVAILABLE | No | Public Domain | Trials |
| ICD-10 | AVAILABLE (local) | No | WHO CC BY-ND | Terminology |
| SNOMED CT | SELF_HOST_REQUIRED | No (license) | SNOMED License | Terminology |
| Ayurveda | AVAILABLE (local) | No | Traditional + CC BY-SA | Herbs |
| Homeopathy | AVAILABLE (local) | No | Public domain | Remedies |
| Indian Medicines (EKA) | LICENSE_REVIEW | Yes (commercial) | Commercial | Indian drugs |
| World Bank | AVAILABLE | No | CC BY 4.0 | India indicators |
| Open-Meteo | AVAILABLE | No | CC BY 4.0 | Weather/AQI/UV |

## Activation

For REQUIRES_API_KEY providers:
1. Get key from provider signup URL in api-providers.json
2. Set env var (e.g., USDA_API_KEY)
3. Set ENABLE_<PROVIDER>=true
4. Restart

For SELF_HOST_REQUIRED (SNOMED):
- Self-host Snowstorm: https://github.com/snomedct/snowstorm
- Requires SNOMED CT license from https://www.snomed.org/
- Set SNOMED_API_URL and ENABLE_SNOMED=true

For LICENSE_REVIEW (EKA):
- Contact EKA Care for partnership
- Do not use without license verification
