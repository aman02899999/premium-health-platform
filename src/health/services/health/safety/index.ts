/**
 * Medical safety layer
 * Ensures no unsafe claims, preserves source attribution, evidence grading
 */

export type EvidenceLevel = "strong" | "moderate" | "limited" | "mixed" | "insufficient" | "traditional";

export const SAFETY_RULES = {
  forbiddenPhrases: [
    /cures?\s+(cancer|diabetes|aids|hiv)/i,
    /guaranteed\s+cure/i,
    /100%\s+effective/i,
    /miracle\s+cure/i,
    /stop\s+your\s+.*medicine/i,
    /replace\s+your\s+doctor/i,
  ],
  requiredDisclaimers: {
    drug: "Educational only — not medical advice. Consult your clinician before starting/stopping any medicine.",
    ayurveda: "Traditional Ayurvedic information — not a substitute for modern medical diagnosis or treatment. Consult qualified practitioners.",
    homeopathy: "Traditional homeopathic information — evidence for efficacy is limited/insufficient for most conditions. Not a replacement for proven care.",
    nutrition: "General nutrition information — not personalized diet advice. Consult dietitian/clinician for medical conditions.",
    fitness: "General fitness information — consult clinician before starting new exercise, especially with medical conditions.",
  },
};

export function checkSafety(text: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  for (const pattern of SAFETY_RULES.forbiddenPhrases) {
    if (pattern.test(text)) {
      issues.push(`Contains forbidden claim matching ${pattern}`);
    }
  }
  return { safe: issues.length === 0, issues };
}

export function addDisclaimer(type: keyof typeof SAFETY_RULES.requiredDisclaimers, content: string): string {
  const disclaimer = SAFETY_RULES.requiredDisclaimers[type];
  return `${content}\n\n[Disclaimer: ${disclaimer}]`;
}

export function gradeEvidence(source: string, type: string): EvidenceLevel {
  if (type === "ayurveda" || type === "homeopathy") return "traditional";
  if (source.includes("PubMed") || source.includes("ClinicalTrials")) return "moderate";
  if (source.includes("FDA") || source.includes("WHO") || source.includes("World Bank")) return "strong";
  if (source.includes("Open Food Facts") || source.includes("wger")) return "moderate";
  return "limited";
}

export const MEDICAL_DISCLAIMER =
  "Educational only — not medical advice. Traditional use ≠ proven efficacy. Consult qualified clinician before starting/stopping medicines, herbs, or diets. In emergency, seek immediate care.";

export function formatWithProvenance<T extends { provenance?: { source?: string; license?: string } }>(
  data: T,
  options?: { includeLicense?: boolean }
): T & { _safety: { disclaimer: string; evidenceLevel: EvidenceLevel } } {
  const source = data.provenance?.source ?? "Unknown";
  const evidence = gradeEvidence(source, "general");
  return {
    ...data,
    _safety: {
      disclaimer: SAFETY_RULES.requiredDisclaimers.drug,
      evidenceLevel: evidence,
    },
  };
}
