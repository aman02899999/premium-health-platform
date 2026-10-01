# Medical Data Policy

## Principles

1. **Educational Only**: This website provides general educational information, not personalized medical diagnosis or treatment.
2. **Source Attribution**: Every record preserves source, license, retrieved_at.
3. **Evidence Grading**: strong / moderate / limited / mixed / insufficient / traditional
4. **No Conflicting Merge**: When two sources disagree, preserve both, mark conflict, prefer authoritative per priority.
5. **No Unsafe Claims**: Forbidden phrases (cure cancer, guaranteed, 100% effective, stop medicine) are blocked.

## Display Rules

### Drugs
- generic name, brand names, active ingredients, drug class
- indications, contraindications, warnings, adverse reactions
- source, last updated
- Disclaimer: "Educational only — not medical advice"

### Ayurveda
- Label as "Traditional Ayurvedic information"
- Show Rasa, Guna, Virya, Vipaka, Dosha Karma as traditional properties
- Never imply clinical evidence where only traditional use exists
- Disclaimer: "Traditional Ayurvedic information — not a substitute for modern medical diagnosis"

### Homeopathy
- Label as "Traditional homeopathic information"
- Evidence: insufficient for most conditions
- Disclaimer: "Traditional homeopathic information — evidence for efficacy is limited/insufficient"

### Nutrition & Fitness
- General information, not personalized
- Disclaimer for nutrition/fitness

## Provenance

Every imported record must have:
- source
- source_id
- source_url
- license
- retrieved_at
- last_updated
- data_version where available

## Conflict Handling

1. Preserve both source records
2. Mark conflict in logs
3. Prefer authoritative: FDA > WHO > PubMed > traditional
4. Display source/reference to user
