/**
 * Live health sources pulled once a day by the cron job (/health/api/cron/daily)
 * and stored in health.news_items, so pages read from our own database and never
 * wait on a third-party API.
 *
 * Every item keeps its real publication date and links to the original. We only
 * reshape the source's own words; nothing here is invented or "medically reviewed".
 *
 *  - WHO Disease Outbreak News  — official outbreak reports (keyless)
 *  - openFDA drug enforcement   — US recalls of medicines made by Indian firms (keyless)
 *  - PubMed (NCBI E-utilities)  — new India-focused trials / reviews on common conditions (keyless)
 */
import type { NewsItem } from "@/health/types";

export type LiveSource = "who" | "fda" | "pubmed";

const UA = { "User-Agent": "PremiumHealthPlatform/1.0 (daily sync)" };
const NOT_REVIEWED = "Not medically reviewed — summary of the linked official source";

async function getJson(url: string, timeoutMs = 12000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: UA, cache: "no-store" });
    if (!res.ok) throw new Error(`${new URL(url).hostname} ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/** Strip tags and collapse whitespace from source HTML. */
export function plainText(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cut at a sentence end near `max` characters. */
export function clip(text: string, max = 320): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
}

const slugPart = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function base(): Pick<NewsItem, "status" | "relatedDiseases" | "relatedLabs" | "relatedHerbs" | "reviewer" | "imagePrompt"> {
  return { status: "published", relatedDiseases: [], relatedLabs: [], relatedHerbs: [], reviewer: NOT_REVIEWED, imagePrompt: "" };
}

// ---------------- WHO Disease Outbreak News ----------------

type WhoDon = { Title?: string; OverrideTitle?: string; UseOverrideTitle?: boolean; PublicationDate?: string; LastModified?: string; UrlName?: string; Summary?: string };

export function parseWho(json: unknown): NewsItem[] {
  const rows = ((json as { value?: WhoDon[] })?.value ?? []).filter((r) => r.UrlName && r.PublicationDate);
  return rows.map((r) => {
    const title = (r.UseOverrideTitle && r.OverrideTitle) || r.Title || "WHO Disease Outbreak News";
    const summary = plainText(r.Summary);
    const url = `https://www.who.int/emergencies/disease-outbreak-news/item/${r.UrlName}`;
    return {
      ...base(),
      slug: `who-${slugPart(r.UrlName!)}`,
      title: `WHO outbreak report: ${title}`,
      summary: clip(summary || "The World Health Organization published a new Disease Outbreak News report."),
      category: "Outbreak Advisory",
      kind: "live",
      publishedAt: new Date(r.PublicationDate!).toISOString(),
      updatedAt: new Date(r.LastModified || r.PublicationDate!).toISOString(),
      sourceName: "World Health Organization — Disease Outbreak News",
      sourceUrl: url,
      body: [
        { heading: "What WHO reported", paragraphs: [clip(summary, 1400) || "See the full report on the WHO website."] },
        {
          heading: "What it means for you in India",
          paragraphs: ["WHO publishes these reports so health systems can prepare. Most do not change what an individual in India needs to do today."],
          bullets: ["Planning travel to the affected area? Check the Ministry of Health and Family Welfare and your airline for advisories.", "Fever or other symptoms after travel? See a doctor and mention where you travelled.", "Read the full report for case numbers, risk assessment and WHO advice."],
        },
      ],
      keyTakeaways: ["Official WHO outbreak report", `Published ${new Date(r.PublicationDate!).toUTCString().slice(5, 16)}`, "Read the original for full figures and advice"],
      tags: ["who", "outbreak"],
      author: "World Health Organization",
      factCheckNote: "Summary of the WHO Disease Outbreak News report linked below. Figures and advice are WHO's own.",
    } satisfies NewsItem;
  });
}

export async function fetchWho(limit = 6): Promise<NewsItem[]> {
  const url = `https://www.who.int/api/news/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=${limit}&$select=Title,OverrideTitle,UseOverrideTitle,PublicationDate,LastModified,UrlName,Summary`;
  return parseWho(await getJson(url));
}

// ---------------- openFDA drug enforcement (Indian manufacturers) ----------------

type FdaRecall = { recall_number?: string; report_date?: string; classification?: string; recalling_firm?: string; product_description?: string; reason_for_recall?: string; status?: string; city?: string; state?: string };

/** "20260923" → ISO date. */
export function fdaDate(d: string | undefined): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(d ?? "");
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toISOString() : null;
}

const CLASS_MEANING: Record<string, string> = {
  "Class I": "Class I — the most serious: use of the product could cause serious harm or death.",
  "Class II": "Class II — use may cause temporary or reversible health problems; serious harm is unlikely.",
  "Class III": "Class III — unlikely to cause harm, but the product breaks FDA rules.",
};

export function parseFda(json: unknown): NewsItem[] {
  const rows = ((json as { results?: FdaRecall[] })?.results ?? []).filter((r) => r.recall_number && fdaDate(r.report_date));
  // One drug often has several strengths with consecutive recall numbers; keep the first per firm + reason + day.
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const k = `${r.recalling_firm}|${r.reason_for_recall}|${r.report_date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.map((r) => {
    const product = clip(plainText(r.product_description), 140).replace(/,\s*$/, "");
    const drug = product.split(/,|\(/)[0].trim();
    const reason = clip(plainText(r.reason_for_recall), 400);
    const date = fdaDate(r.report_date)!;
    return {
      ...base(),
      slug: `fda-recall-${slugPart(r.recall_number!)}`,
      title: `US FDA recall: ${drug} made by ${r.recalling_firm}`,
      summary: clip(`${r.recalling_firm}, an Indian manufacturer, is recalling ${drug} in the United States. Reason given: ${reason}`),
      category: "Drug Safety",
      kind: "live",
      publishedAt: date,
      updatedAt: date,
      sourceName: "US Food and Drug Administration — openFDA enforcement reports",
      sourceUrl: `https://api.fda.gov/drug/enforcement.json?search=recall_number:%22${encodeURIComponent(r.recall_number!)}%22`,
      body: [
        {
          heading: "The recall",
          paragraphs: [`Product: ${product}.`, `Reason: ${reason}`],
          bullets: [`Recall number: ${r.recall_number}`, `Firm: ${r.recalling_firm}${r.city ? `, ${r.city}` : ""}`, `Status: ${r.status ?? "—"}`, CLASS_MEANING[r.classification ?? ""] ?? `Classification: ${r.classification ?? "—"}`],
        },
        {
          heading: "Does this affect medicines sold in India?",
          paragraphs: [
            "This is a US recall of batches made for the US market. It does not by itself mean the same brand sold in India is affected.",
            "Do not stop a prescribed medicine on your own. If you are worried about a medicine you take, ask your pharmacist or doctor, and check CDSCO's monthly drug alerts.",
          ],
        },
      ],
      keyTakeaways: [`${r.classification ?? "FDA"} recall in the US`, "Made by an Indian manufacturer", "Don't stop prescribed medicines without advice"],
      tags: ["fda", "recall", "drug-safety"],
      author: "US FDA (openFDA)",
      factCheckNote: "Taken from the openFDA drug enforcement record linked below. openFDA data is published by the FDA and may be revised.",
    } satisfies NewsItem;
  });
}

export async function fetchFda(limit = 12): Promise<NewsItem[]> {
  return parseFda(await getJson(`https://api.fda.gov/drug/enforcement.json?search=country:%22India%22&sort=report_date:desc&limit=${limit}`));
}

// ---------------- PubMed: new India-focused evidence ----------------

export const PUBMED_QUERY =
  '(diabetes[ti] OR hypertension[ti] OR "blood pressure"[ti] OR obesity[ti] OR PCOS[ti] OR "polycystic ovary"[ti] OR "fatty liver"[ti] OR anaemia[ti] OR anemia[ti] OR thyroid[ti] OR cholesterol[ti] OR "vitamin D"[ti]) AND India[tiab] AND (randomized controlled trial[pt] OR meta-analysis[pt] OR systematic review[pt]) AND hasabstract';

type PubSummary = { uid?: string; title?: string; source?: string; fulljournalname?: string; pubdate?: string; epubdate?: string; sortpubdate?: string; pubtype?: string[]; authors?: { name: string }[] };

export function parsePubmed(json: unknown, fetchedAt: Date = new Date()): NewsItem[] {
  const result = (json as { result?: Record<string, PubSummary> & { uids?: string[] } })?.result;
  const uids = (result?.uids as string[] | undefined) ?? [];
  return uids
    .map((id) => result![id] as PubSummary)
    .filter((p): p is PubSummary => Boolean(p?.uid && p.title))
    .map((p) => {
      const title = plainText(p.title).replace(/\.$/, "");
      const type = (p.pubtype ?? []).find((t) => /meta-analysis|systematic review|randomized controlled trial/i.test(t)) ?? "Study";
      const parsed = Date.parse((p.sortpubdate ?? "").replace(/\//g, "-").replace(" ", "T"));
      // Journals often post-date issues; never show a future date.
      const date = new Date(Math.min(Number.isNaN(parsed) ? fetchedAt.getTime() : parsed, fetchedAt.getTime())).toISOString();
      const journal = p.fulljournalname || p.source || "a peer-reviewed journal";
      const authors = (p.authors ?? []).slice(0, 3).map((a) => a.name).join(", ") + ((p.authors ?? []).length > 3 ? " et al." : "");
      return {
        ...base(),
        slug: `pubmed-${p.uid}`,
        title: `New research: ${title}`,
        summary: clip(`A new ${type.toLowerCase()} from India, published in ${journal}. Read the abstract on PubMed before drawing conclusions — one study rarely changes treatment on its own.`),
        category: "Research Digest",
        kind: "live",
        publishedAt: date,
        updatedAt: date,
        sourceName: `PubMed — ${journal}`,
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${p.uid}/`,
        body: [
          { heading: "The study", paragraphs: [title + "."], bullets: [`Type: ${type}`, `Journal: ${journal}`, `Published: ${p.epubdate || p.pubdate || "—"}`, ...(authors ? [`Authors: ${authors}`] : []), `PubMed ID: ${p.uid}`] },
          { heading: "How to read it", paragraphs: ["We list new trials and reviews from India so you can follow the evidence. We have not summarised the findings — read the abstract, and talk to your doctor before changing any treatment."] },
        ],
        keyTakeaways: [type, "India-focused evidence", "Read the abstract before acting"],
        tags: ["research", "pubmed", "india"],
        author: authors || "PubMed",
        factCheckNote: "Citation details come from PubMed (NCBI). Findings are the authors' own and are not summarised here.",
      } satisfies NewsItem;
    });
}

export async function fetchPubmed(limit = 8, days = 30): Promise<NewsItem[]> {
  const search = (await getJson(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&datetype=edat&reldate=${days}&retmax=${limit}&term=${encodeURIComponent(PUBMED_QUERY)}`,
  )) as { esearchresult?: { idlist?: string[] } };
  const ids = search.esearchresult?.idlist ?? [];
  if (!ids.length) return [];
  return parsePubmed(await getJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`));
}

export const LIVE_FETCHERS: Record<LiveSource, () => Promise<NewsItem[]>> = { who: () => fetchWho(), fda: () => fetchFda(), pubmed: () => fetchPubmed() };
