// "Indian Health Weekly": the Sunday email promised on the /health sign-up forms. Three articles
// from the health library each week, rotating so nothing repeats until the whole library has gone
// out. Pure: the daily automation queues these on Sundays and the outbox sends them with an
// unsubscribe link (kind "nurture-*").
import type { Draft } from "./messages";

/** marketing_contacts.source values that mean "signed up for the health newsletter". */
export const NEWSLETTER_SOURCES = ["newsletter", "thali-popup"];

export type NewsletterArticle = { slug: string; title: string; excerpt: string };

const DAY_MS = 86_400_000;
const weekNumber = (date: string) => Math.floor(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / DAY_MS / 7);

/** True for a Sunday (date is YYYY-MM-DD, India time). */
export const isSunday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay() === 0;

/** This week's articles: consecutive slices of the library, wrapping around. */
export function weeklyPicks<T>(date: string, articles: T[], n = 3): T[] {
  if (!articles.length) return [];
  const start = (weekNumber(date) * n) % articles.length;
  return Array.from({ length: Math.min(n, articles.length) }, (_, i) => articles[(start + i) % articles.length]);
}

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

export function weeklyNewsletter(date: string, to: string, articles: NewsletterArticle[], siteUrl: string): Draft | null {
  const picks = weeklyPicks(date, articles);
  if (!picks.length) return null;
  const utm = `utm_source=newsletter&utm_medium=email&utm_campaign=weekly-${date}`;
  const items = picks.map((a, i) => `${i + 1}. ${a.title}\n${clip(a.excerpt, 170)}\n${siteUrl}/health/blog/${a.slug}?${utm}`);
  return {
    channel: "email",
    to: to.toLowerCase(),
    toName: "",
    kind: "nurture-weekly",
    subject: clip(`Indian Health Weekly: ${picks[0].title}`, 120),
    body: [
      "Hi,",
      "This week's Indian Health Weekly: three short reads from our health library.",
      ...items,
      "This is general health information, not medical advice. Please check any change to your diet, exercise or medicines with your doctor.",
      `[[CTA:Read more on the health hub|${siteUrl}/health/blog?${utm}]]`,
    ].join("\n\n"),
    template: "",
    params: [],
    dedupeKey: `weekly:${date}:${to.toLowerCase()}`,
  };
}
