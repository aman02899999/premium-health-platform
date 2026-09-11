// Lightweight, privacy-conscious client-side A/B testing engine.
//
// Design goals:
//  - Sticky variants: a visitor always sees the same variant (localStorage `bhg-ab-{experimentId}`).
//  - Deterministic traffic split via weighted random assignment.
//  - Zero hydration risk: every helper is SSR-safe and returns a stable default on the server.
//  - No personal data: events store only experiment/variant/type/timestamp.
//
// Events are capped at MAX_EVENTS per experiment and are also forwarded to gtag (if present).

export type ABVariant = "A" | "B" | "C";

/** How the CTA list should be ordered for a given variant. */
export type ABOrder = "default" | "product-first" | "guide-first" | "premium-first";

/** What a tracked interaction represents. */
export type ABEventType = "impression" | "click" | "conversion";

export interface ABVariantConfig {
  id: ABVariant;
  label: string;
  /** Share of traffic in percentage points. Shares of one experiment should total 100. */
  weight: number;
  order: ABOrder;
  headline: string;
}

export interface ABExperiment {
  id: string;
  name: string;
  /** Surface the experiment runs on — mirrors MonetizationCTA `pageType`. */
  pageType: "disease" | "nutrition" | "blog";
  variants: ABVariantConfig[];
  /** Explicit traffic split, e.g. { A: 34, B: 33, C: 33 }. */
  trafficSplit: Record<ABVariant, number>;
}

export interface ABEvent {
  id: string;
  experimentId: string;
  variant: ABVariant;
  type: ABEventType;
  page?: string;
  label?: string;
  timestamp: string;
}

export interface ABVariantStats {
  variant: ABVariant;
  label: string;
  headline: string;
  order: ABOrder;
  impressions: number;
  clicks: number;
  conversions: number;
  /** clicks / impressions × 100 */
  ctr: number;
  /** conversions / clicks × 100 */
  convRate: number;
}

export interface ABExperimentStats {
  experimentId: string;
  name: string;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  variants: ABVariantStats[];
  /** Variant with the highest conversion rate, or null when there is not enough signal. */
  winner: ABVariant | null;
  /** True only once the experiment has enough volume to be actionable. */
  significant: boolean;
}

const MAX_EVENTS = 500;
const MIN_IMPRESSIONS_FOR_WINNER = 10;

const VARIANT_KEY = (experimentId: string) => `bhg-ab-${experimentId}`;
const EVENTS_KEY = (experimentId: string) => `bhg-ab-events-${experimentId}`;

/**
 * The three live CTA experiments. Each targets a different content surface and
 * tests CTA ordering + framing rather than medical claims.
 */
export const CTA_EXPERIMENTS: ABExperiment[] = [
  {
    id: "cta-disease",
    name: "Disease page CTA ordering",
    pageType: "disease",
    trafficSplit: { A: 34, B: 33, C: 33 },
    variants: [
      { id: "A", label: "Control", weight: 34, order: "default", headline: "Continue Your Health Journey" },
      { id: "B", label: "Product first", weight: 33, order: "product-first", headline: "Recommended For This Condition" },
      { id: "C", label: "Guide first", weight: 33, order: "guide-first", headline: "Download The Complete Guide" },
    ],
  },
  {
    id: "cta-nutrition",
    name: "Nutrition page CTA ordering",
    pageType: "nutrition",
    trafficSplit: { A: 34, B: 33, C: 33 },
    variants: [
      { id: "A", label: "Control", weight: 34, order: "default", headline: "Continue Your Health Journey" },
      { id: "B", label: "Diet plan first", weight: 33, order: "guide-first", headline: "Get Your Personalised Diet Plan" },
      { id: "C", label: "Premium first", weight: 33, order: "premium-first", headline: "Go Premium — Unlock Everything" },
    ],
  },
  {
    id: "cta-blog",
    name: "Blog article CTA ordering",
    pageType: "blog",
    trafficSplit: { A: 34, B: 33, C: 33 },
    variants: [
      { id: "A", label: "Control", weight: 34, order: "default", headline: "Continue Your Health Journey" },
      { id: "B", label: "Product first", weight: 33, order: "product-first", headline: "Products Mentioned In This Article" },
      { id: "C", label: "Guide first", weight: 33, order: "guide-first", headline: "Download The Complete Guide" },
    ],
  },
];

export function getExperiment(experimentId: string): ABExperiment | undefined {
  return CTA_EXPERIMENTS.find((e) => e.id === experimentId);
}

export function getExperimentForPageType(pageType: string): ABExperiment | undefined {
  return CTA_EXPERIMENTS.find((e) => e.pageType === pageType);
}

function readStore(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked — assignment stays in-memory for this session */
  }
}

function isVariant(value: unknown): value is ABVariant {
  return value === "A" || value === "B" || value === "C";
}

/**
 * Returns the sticky variant for a visitor, assigning one on first visit using a
 * weighted random draw against the experiment's traffic split.
 *
 * Safe to call during render on the client, but callers should render variant "A"
 * on the server and apply the real variant after mount to avoid hydration mismatches.
 */
export function assignVariant(experimentId: string): ABVariant {
  const experiment = getExperiment(experimentId);
  if (!experiment) return "A";

  const stored = readStore(VARIANT_KEY(experimentId));
  if (isVariant(stored)) return stored;

  const total = experiment.variants.reduce((sum, v) => sum + v.weight, 0) || 100;
  let roll = Math.random() * total;
  let assigned: ABVariant = experiment.variants[0]?.id ?? "A";

  for (const variant of experiment.variants) {
    roll -= variant.weight;
    if (roll <= 0) {
      assigned = variant.id;
      break;
    }
  }

  writeStore(VARIANT_KEY(experimentId), assigned);
  return assigned;
}

export function getVariantConfig(experimentId: string, variant: ABVariant): ABVariantConfig | undefined {
  return getExperiment(experimentId)?.variants.find((v) => v.id === variant);
}

function readEvents(experimentId: string): ABEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = readStore(EVENTS_KEY(experimentId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ABEvent[]) : [];
  } catch {
    return [];
  }
}

/**
 * Records an experiment interaction. Keeps only the most recent MAX_EVENTS entries
 * so localStorage never grows unbounded.
 */
export function trackABEvent(params: {
  experimentId: string;
  variant: ABVariant;
  type: ABEventType;
  page?: string;
  label?: string;
}): void {
  if (typeof window === "undefined") return;

  const event: ABEvent = {
    id: `ab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    experimentId: params.experimentId,
    variant: params.variant,
    type: params.type,
    page: params.page,
    label: params.label,
    timestamp: new Date().toISOString(),
  };

  try {
    const events = readEvents(params.experimentId);
    events.push(event);
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }
    writeStore(EVENTS_KEY(params.experimentId), JSON.stringify(events));
  } catch {
    /* ignore quota errors — tracking must never break the page */
  }

  try {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag("event", `ab_${params.type}`, {
        experiment_id: params.experimentId,
        variant: params.variant,
        page: params.page,
        label: params.label,
      });
    }
  } catch {
    /* analytics unavailable */
  }
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Aggregates stored events into per-variant performance, including CTR and
 * conversion rate. Returns null for unknown experiments.
 */
export function getABStats(experimentId: string): ABExperimentStats | null {
  const experiment = getExperiment(experimentId);
  if (!experiment) return null;

  const events = readEvents(experimentId);

  const variants: ABVariantStats[] = experiment.variants.map((variant) => {
    const mine = events.filter((e) => e.variant === variant.id);
    const impressions = mine.filter((e) => e.type === "impression").length;
    const clicks = mine.filter((e) => e.type === "click").length;
    const conversions = mine.filter((e) => e.type === "conversion").length;

    return {
      variant: variant.id,
      label: variant.label,
      headline: variant.headline,
      order: variant.order,
      impressions,
      clicks,
      conversions,
      ctr: round(impressions ? (clicks / impressions) * 100 : 0),
      convRate: round(clicks ? (conversions / clicks) * 100 : 0),
    };
  });

  const totalImpressions = variants.reduce((s, v) => s + v.impressions, 0);
  const totalClicks = variants.reduce((s, v) => s + v.clicks, 0);
  const totalConversions = variants.reduce((s, v) => s + v.conversions, 0);

  const significant = totalImpressions >= MIN_IMPRESSIONS_FOR_WINNER;
  const ranked = [...variants].sort((a, b) => b.convRate - a.convRate || b.ctr - a.ctr);
  const best = ranked[0];
  const winner = significant && best && best.ctr + best.convRate > 0 ? best.variant : null;

  return {
    experimentId,
    name: experiment.name,
    totalImpressions,
    totalClicks,
    totalConversions,
    variants,
    winner,
    significant,
  };
}

/** Stats for every experiment — used by the earning dashboard. */
export function getAllABStats(): ABExperimentStats[] {
  return CTA_EXPERIMENTS.map((e) => getABStats(e.id)).filter((s): s is ABExperimentStats => s !== null);
}
