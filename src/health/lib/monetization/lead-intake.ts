// The /health consultation, partner and advertise forms: what the visitor sent, cleaned into a row
// for public.leads, so it shows up in Admin → Leads next to the gym's enquiries.

const SERVICES = {
  "diet-consultation": { goal: "Diet consultation", interest: "diet" },
  "fitness-consultation": { goal: "Fitness consultation", interest: "pt" },
  "wellness-consultation": { goal: "Wellness consultation", interest: "other" },
  "health-package": { goal: "Health package", interest: "other" },
  "clinic-inquiry": { goal: "Clinic enquiry", interest: "other" },
  "corporate-wellness": { goal: "Corporate wellness", interest: "other" },
  general: { goal: "General enquiry", interest: "other" },
} as const;

export type HealthLead = { name: string; phone: string; email: string | null; goal: string; interest: string; source: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** A clean lead, or a message for the visitor. */
export function parseHealthLead(body: unknown): HealthLead | string {
  if (!body || typeof body !== "object") return "Invalid request";
  const b = body as Record<string, unknown>;
  const name = str(b.name).slice(0, 80);
  if (name.length < 2) return "Please enter your name.";
  // Indian mobile: the last 10 digits, starting 6-9 (drops +91 or a leading 0).
  const phone = str(b.phone).replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(phone)) return "Please enter a valid 10-digit mobile number so we can call you back.";
  const email = str(b.email).toLowerCase().slice(0, 120);
  if (email && !EMAIL_RE.test(email)) return "Please enter a valid email, or leave it blank.";
  if (b.consent !== true) return "Please tick the box so we can contact you.";
  const key = (str(b.service) in SERVICES ? str(b.service) : "general") as keyof typeof SERVICES;
  const page = str(b.page).slice(0, 120);
  const message = [str(b.message), page ? `from ${page}` : ""].filter(Boolean).join(" · ").slice(0, 600);
  return { name, phone, email: email || null, goal: SERVICES[key].goal, interest: SERVICES[key].interest, source: `health-${key}`, message };
}
