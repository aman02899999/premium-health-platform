// Review form validation — shared by the buyer's form and the review API.

export type ReviewInput = { rating: number; body: string; displayName: string; city: string; country: string };

export const REVIEW_COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Oman",
  "Singapore", "Malaysia", "New Zealand", "Germany", "Nepal", "Bangladesh", "Sri Lanka", "South Africa", "Other",
] as const;

export function parseReviewForm(body: Record<string, unknown>): ReviewInput | string {
  const rating = Number(body.rating);
  const text = typeof body.body === "string" ? body.body.trim().replace(/\s+\n/g, "\n") : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return "Please choose a star rating.";
  if (text.length < 20) return "Please write at least a sentence or two (20+ characters).";
  if (text.length > 1500) return "Please keep your review under 1,500 characters.";
  if (/https?:\/\/|www\./i.test(text)) return "Please remove links from your review.";
  if (displayName.length < 2 || displayName.length > 40) return "Please add the name to show with your review.";
  if (city.length > 60) return "City name is too long.";
  if (!(REVIEW_COUNTRIES as readonly string[]).includes(country)) return "Please choose your country.";
  return { rating, body: text, displayName, city, country };
}
