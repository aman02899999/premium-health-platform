# Unique India-First Features — Bharat Health Guide

This document lists **unique** functionality that goes beyond generic health platforms, built specifically for Indian users.

## Why unique?

Generic health apps use USDA + wger. India needs:
- Millets (ragi, kangni, samak) not quinoa
- Thali (half veg, quarter grain, quarter dal/protein + curd) not western plate
- IDRS (Indian Diabetes Risk Score) validated for Indians, not generic ADA risk
- Hinglish search (madhumeh, high bp, haldi)
- Seasonal Ritucharya + live dengue/heat advisory
- Herb-drug safety (ashwagandha + sedatives, guggul + blood thinners)
- Fasting (Ekadashi, Navratri) + IF safety
- Barcode 890… India prefix
- Child growth with Anganwadi / MCP context
- Yoga / Pranayama timer with traditional breathing
- Dosha-based meals mapped to modern fibre/protein/GI
- Live Health Advisory using Open-Meteo free API (no key)

All educational only, with safety disclaimers, citations, no unsafe claims.

## Feature matrix

| Feature | Page | Unique insight | Data source | Safety |
|---|---|---|---|---|
| Thali Builder | /thali-builder | Half veg, quarter millet, quarter dal/protein + curd; salad first → lower sugar spikes | Local curated, OFF, USDA | Educational, not diet prescription |
| Millet Swap Engine | /millet-swap | GI: foxtail 50-55, barnyard 42-45 vs white rice 70-80; 50:50 start | FAO, ICMR-NIN, OFF | Kidney disease caution (K) |
| IDRS + Anemia | /india-risk | IDRS validated CURES: age, waist, activity, family; <30 low, 30-50 mod, ≥60 high; Anemia: tea with meals, veg, heavy periods | Mohan et al JAPI 2005, NFHS | Screening only, confirm labs |
| Yoga Timer | /yoga-timer | Pranayama 4-2-4, Surya Namaskar 30s/round, meditation | Traditional + modern timer | Stop if dizzy, not for severe cardio/pulmonary without clinician |
| Ritucharya | /ritucharya | Pathya/apathya per season + live Open-Meteo pulse (season, sunrise, UV) | Ayurveda classics + Open-Meteo free | Adapt for diabetes/kidney/heart |
| Herb-Drug Checker | /herb-interaction | Ashwagandha + sedatives/thyroid, Guggul + anticoag, Giloy + immunosuppressants, Licorice + diuretics | MSKCC, Natural Medicines, case reports | Disclosure to clinician mandatory |
| Barcode Scanner | /barcode-scanner | 890… India prefix → OFF free API, fallback USDA | Open Food Facts (ODbL) | Label may be inaccurate |
| Child Growth | /child-growth | WHO median simplified + MCP card, Anganwadi, IAP context | WHO Anthro concept | Use official WHO Anthro for clinical |
| Health Q&A RAG | /health-qa | Retrieval-first: PubMed, ClinicalTrials, FDA, Ayurveda, ICD-10, WorldBank; citations mandatory, no hallucinations | Unified search + local | Educational, confidence low/mod |
| Live Advisory | /live-advisory | Monsoon dengue/malaria, summer heat, winter smog, high UV >7 | Open-Meteo + public health calendar | Emergency guidance included |
| Dosha Meals | /dosha-meals | Vata/pitta/kapha → modern: warm regular + healthy fats, cooling less chilli, light fibre + activity | Ayurveda + modern nutrition | Not biomarker, adapt for conditions |
| Fasting Planner | /fasting-planner | Ekadashi, Navratri, IF 14:10 Indian adapted; millet samak best low GI, protein focus | Traditional + ICMR | Not for T1D, pregnancy, eating disorders without clinician |
| Hinglish Search | /hinglish-search | Alias map: madhumeh→diabetes, high bp→hypertension, haldi→turmeric, ragi→finger millet | Local alias + unified search | Future: Indic NLP |
| Nutrition Tracker | /nutrition-tracker | OFF + USDA search, local log, macro totals | OFF, USDA | Educational |
| Workout Builder | /workout-builder | wger exercises + sets/reps/rest builder | wger | Clinician before new exercise |

## API: /api/health/qa

POST { question, lang }
Returns { answer, citations[], sources, confidence, durationMs, disclaimer }

Example:
```json
{
  "question": "diabetes diet millets Indian",
  "lang": "en"
}
```

Response includes citations with url, snippet, source — retrieval-first, no generation without citations.

## Live data: /api/realtime/pulse

Free Open-Meteo, no key, caches 15 min. Returns season (Ritucharya mapping), cities (Delhi, Mumbai, Bangalore, Hyderabad) with temp, sunrise, sunset, UV.

Used by Ritucharya + Live Advisory.

## Safety layer

All unique features include:
- Educational only banner
- Distinguish evidence vs traditional (gradeEvidence)
- Forbidden phrases blocked (cures cancer, guaranteed cure, stop medicine)
- Herb-drug checker shows risk HIGH/MOD/LOW + source + advice to disclose to clinician
- Fasting + yoga + IDRS + anemia + child growth all warn when to see clinician, not self-medicate

## Future unique ideas

- FSSAI label OCR (photo → OFF + nutrient parse)
- Anganwadi growth chart plotter with WHO z-scores
- Monsoon water quality + AQI integration (CPCB)
- Regional language TTS for health advice (HI, Hinglish)
- Millet price + availability via ONDC (if public API)
- Ayurveda herb traceability (geolocation + season)

## Testing

- Unit: provider metadata, search, IDRS calc, anemia risk
- Integration: /api/health/qa returns citations, /api/health/search handles Hinglish aliases
- Build: 290+ pages including all unique pages

## Attribution

- Open-Meteo: free, no key, attribution required (docs)
- Open Food Facts: ODbL, source preserved
- wger: AGPL, source preserved
- PubMed, ClinicalTrials, openFDA, RxNorm, PubChem, USDA, WorldBank: public domain / free
- Ayurveda/Herbal: traditional knowledge, marked TRADITIONAL evidence, sources MSKCC, Natural Medicines where applicable
