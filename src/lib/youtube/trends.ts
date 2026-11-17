// Trend fact-check Shorts: once a day the site reads Google Trends' daily searches for India and
// keeps only fitness, diet and health-habit trends (most days there are none, and then nothing is
// made). For a match, the AI writes a SACH / JHOOTH / DEPENDS fact-check that must cite WHO,
// ICMR-NIN, NHS, CDC, NIH or similar; it waits in Admin like every queued Short. Pure: parsing
// and filtering are tested without the network.

export const TRENDS_URL = "https://trends.google.com/trending/rss?geo=IN";
// Only Google Trends: it is what India is searching today. News search was tried (17 Nov 2026) and
// returned mostly foreign shopping and celebrity headlines, so it is not used. Trends lists ~10
// searches a day and fitness is rarely one of them, so most days nothing is made, by design.
export const TREND_FEEDS = [TRENDS_URL];

export type Trend = { title: string; traffic: number; news: { title: string; url: string; source: string }[] };

const unescape = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();
const tag = (xml: string, name: string) => unescape(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml)?.[1] ?? "");

/** The RSS items as plain data. "2000+" becomes 2000. */
export function parseTrends(xml: string): Trend[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    // News headlines end with " - Publisher"; Trends titles don't.
    title: tag(item, "title").replace(/\s+-\s+[^-]{2,60}$/, "").slice(0, 160),
    traffic: Number(tag(item, "ht:approx_traffic").replace(/[^\d]/g, "")) || 0,
    news: [...item.matchAll(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/g)].slice(0, 3).map(([, n]) => ({ title: tag(n, "ht:news_item_title"), url: tag(n, "ht:news_item_url"), source: tag(n, "ht:news_item_source") })),
  })).filter((t) => t.title);
}

// Words that make a trend ours. Kept narrow on purpose: a cricket score or an exam result never
// becomes a fitness Short. Medical news (a disease outbreak, a drug) is left to doctors.
const FITNESS = /\b(diet|dieting|weight ?loss|fat ?loss|belly fat|calorie|calories|protein|workout|gym|fitness|exercise|yoga|walking|steps|running|marathon|detox|fasting|keto|vegan|superfood|creatine|whey|supplement|transformation|abs|biceps|sugar ?free|jaggery|ghee|millet|ragi|smoothie|juice ?cleanse|cold plunge|ice bath|challenge)\b/i;
const NOT_OURS = /\b(ozempic|mounjaro|wegovy|semaglutide|tirzepatide|death|died|dies|murder|accident|arrest|neet|exam|result|admit card|counselling|ipl|match|vs|score|election|stock|share price|box office|trailer|sale|deal|deals|discount|amazon|flipkart|off)\b/i;

/** Trends a gym coach can honestly talk about, biggest first. */
export function fitnessTrends(trends: Trend[]): Trend[] {
  return trends
    .filter((t) => {
      const text = `${t.title} ${t.news.map((n) => n.title).join(" ")}`;
      return FITNESS.test(text) && !NOT_OURS.test(t.title);
    })
    .sort((a, b) => b.traffic - a.traffic);
}

/** A stable key so the same trend is drafted once, even if it trends for days. */
export const trendKey = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// Sources a fact-check may cite. Anything else and the draft is held back.
const TRUSTED = /^https:\/\/([a-z0-9-]+\.)*(who\.int|icmr\.gov\.in|nin\.res\.in|nhs\.uk|cdc\.gov|nih\.gov|fssai\.gov\.in|mohfw\.gov\.in|heart\.org|diabetes\.org|eatright\.org|hsph\.harvard\.edu|mayoclinic\.org|fda\.gov)(\/|$)/i;
export const isTrustedSource = (url: string) => TRUSTED.test(url.trim());
