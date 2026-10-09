/** Whole rupees in Indian grouping. Plain module so server and client components can both call it. */
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Page title: keeps the "| store" suffix only while the whole title fits a Google result (~65 chars). */
export const fitTitle = (base: string, storeName: string): string | { absolute: string } =>
  `${base} | ${storeName}`.length <= 65 ? base : { absolute: base.length > 65 ? `${base.slice(0, 62).trimEnd()}…` : base };

/** "FSSAI Reg. No." or "FSSAI Lic. No.": a registration must never be shown as a licence. */
export const fssaiLabel = (type: "registration" | "licence") => (type === "licence" ? "FSSAI Lic. No." : "FSSAI Reg. No.");
