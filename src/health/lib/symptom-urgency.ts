/** Educational triage for the symptom checker. Never a diagnosis. */
export const EMERGENCY_PATTERNS = [
  "chest", "breathless", "breathing difficulty", "faint", "collapse", "stroke",
  "bleeding", "suicide", "self-harm", "seizure", "unconscious", "blue lips",
];

export type UrgencyInput = { symptom: string; extra: string[]; severity: string; duration: string; age: string };

export function symptomUrgency({ symptom, extra, severity, duration, age }: UrgencyInput): { emergency: boolean; text: string } {
  const t = `${symptom} ${extra.join(" ")} ${severity}`.toLowerCase();
  const emergency = EMERGENCY_PATTERNS.some((k) => t.includes(k)) || severity.startsWith("Severe");
  const childOrSenior = age.startsWith("Child") || age.startsWith("Senior");
  // Fever with a rash or vomiting can be dengue, malaria or another infection that worsens fast in India.
  const feverFlag = symptom === "Fever" && extra.some((e) => e === "Rash" || e === "Vomiting");
  const text = emergency
    ? "Urgent — same-hour evaluation at emergency / casualty."
    : feverFlag
      ? "Prompt — see a doctor today. Fever with rash or vomiting needs a check, and your doctor may ask for a dengue or malaria test."
      : childOrSenior && (severity.startsWith("Moderate") || duration !== "<24 hours")
        ? "Prompt — same-day doctor visit (children and seniors decompensate faster)."
        : severity.startsWith("Moderate") || duration === ">2 weeks"
          ? "Prompt — same-week doctor visit with basic tests."
          : "Routine — home care + watch for 48–72 hours; visit if not improving or any red flag appears.";
  return { emergency, text };
}
