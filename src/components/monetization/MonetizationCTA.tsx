"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag, BookOpen, Calculator, Users, Tag, Mail, Crown, FileText } from "lucide-react";
import { trackMonetizationEvent, getAttributionFromUrl } from "@/lib/monetization/analytics";
import {
  assignVariant,
  getExperimentForPageType,
  trackABEvent,
  type ABOrder,
  type ABVariant,
} from "@/lib/ab-testing";

type PageType = "disease" | "nutrition" | "ayurveda" | "product" | "blog" | "calculator" | "homepage" | "general";

interface CTAItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  type: "product" | "guide" | "diet" | "report" | "professional" | "deals" | "newsletter" | "premium";
}

const CTA_MAP: Record<PageType, CTAItem[]> = {
  disease: [
    { label: "Read Guide", href: "/diseases", icon: <BookOpen className="h-4 w-4" />, type: "guide" },
    { label: "Download Premium Guide", href: "/store", icon: <FileText className="h-4 w-4" />, type: "guide" },
    { label: "View Relevant Products", href: "/products", icon: <ShoppingBag className="h-4 w-4" />, type: "product" },
    { label: "Relevant Calculator", href: "/health-calculators", icon: <Calculator className="h-4 w-4" />, type: "report" },
    { label: "Find a Professional", href: "/providers", icon: <Users className="h-4 w-4" />, type: "professional" },
  ],
  nutrition: [
    { label: "Get the Diet Plan", href: "/store", icon: <BookOpen className="h-4 w-4" />, type: "diet" },
    { label: "Recipe Book", href: "/store", icon: <FileText className="h-4 w-4" />, type: "guide" },
    { label: "View Relevant Products", href: "/products", icon: <ShoppingBag className="h-4 w-4" />, type: "product" },
    { label: "Download Your Report", href: "/health-calculators", icon: <Calculator className="h-4 w-4" />, type: "report" },
  ],
  ayurveda: [
    { label: "Ayurveda Guide", href: "/store", icon: <BookOpen className="h-4 w-4" />, type: "guide" },
    { label: "Relevant Books", href: "/products", icon: <ShoppingBag className="h-4 w-4" />, type: "product" },
    { label: "Find Professional", href: "/providers", icon: <Users className="h-4 w-4" />, type: "professional" },
  ],
  product: [
    { label: "See Today's Deals", href: "/deals", icon: <Tag className="h-4 w-4" />, type: "deals" },
    { label: "Explore Premium Resources", href: "/premium", icon: <Crown className="h-4 w-4" />, type: "premium" },
    { label: "Subscribe to Newsletter", href: "/newsletter", icon: <Mail className="h-4 w-4" />, type: "newsletter" },
  ],
  blog: [
    { label: "Download Complete Guide", href: "/store", icon: <FileText className="h-4 w-4" />, type: "guide" },
    { label: "View Relevant Products", href: "/products", icon: <ShoppingBag className="h-4 w-4" />, type: "product" },
    { label: "Subscribe to Newsletter", href: "/newsletter", icon: <Mail className="h-4 w-4" />, type: "newsletter" },
  ],
  calculator: [
    { label: "Download Your Report", href: "/store", icon: <FileText className="h-4 w-4" />, type: "report" },
    { label: "Get the Diet Plan", href: "/store", icon: <BookOpen className="h-4 w-4" />, type: "diet" },
    { label: "Find a Professional", href: "/providers", icon: <Users className="h-4 w-4" />, type: "professional" },
  ],
  homepage: [
    { label: "Popular Health Products", href: "/products", icon: <ShoppingBag className="h-4 w-4" />, type: "product" },
    { label: "Featured Health Guides", href: "/store", icon: <BookOpen className="h-4 w-4" />, type: "guide" },
    { label: "Free Health Calculators", href: "/health-calculators", icon: <Calculator className="h-4 w-4" />, type: "report" },
    { label: "Today's Health Deals", href: "/deals", icon: <Tag className="h-4 w-4" />, type: "deals" },
  ],
  general: [
    { label: "View Relevant Products", href: "/products", icon: <ShoppingBag className="h-4 w-4" />, type: "product" },
    { label: "Download Complete Guide", href: "/store", icon: <FileText className="h-4 w-4" />, type: "guide" },
    { label: "Subscribe to Newsletter", href: "/newsletter", icon: <Mail className="h-4 w-4" />, type: "newsletter" },
  ],
};

/** Reorders CTAs according to the A/B variant's strategy while keeping the rest of the list stable. */
function orderCTAs(ctas: CTAItem[], order: ABOrder): CTAItem[] {
  if (order === "default") return ctas;
  const priorityType = order === "product-first" ? "product" : order === "guide-first" ? "guide" : "premium";
  const preferred = ctas.filter((c) => c.type === priorityType);
  const rest = ctas.filter((c) => c.type !== priorityType);
  return [...preferred, ...rest];
}

export function MonetizationCTA({ pageType = "general", page = "/", customCTAs }: { pageType?: PageType; page?: string; customCTAs?: CTAItem[] }) {
  const baseCTAs = customCTAs || CTA_MAP[pageType] || CTA_MAP.general;
  const experiment = getExperimentForPageType(pageType);

  // Render variant "A" during SSR/hydration, then apply the sticky variant after mount
  // so the server and client markup always match.
  const [variant, setVariant] = useState<ABVariant>("A");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!experiment) return;
    setVariant(assignVariant(experiment.id));
    setReady(true);
  }, [experiment]);

  const variantConfig = experiment?.variants.find((v) => v.id === variant);
  const order: ABOrder = variantConfig?.order ?? "default";
  const headline = variantConfig?.headline ?? "Continue Your Health Journey";

  const ctas = useMemo(() => orderCTAs(baseCTAs, order), [baseCTAs, order]);

  // One impression per experiment + variant + page.
  useEffect(() => {
    if (!experiment || !ready) return;
    trackABEvent({ experimentId: experiment.id, variant, type: "impression", page });
  }, [experiment, ready, variant, page]);

  const handleClick = (label: string, href: string) => {
    trackMonetizationEvent({ type: "cta_click", page, cta: label, source: href, utm: getAttributionFromUrl() });
    if (experiment && ready) {
      trackABEvent({ experimentId: experiment.id, variant, type: "click", page, label });
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="text-sm font-bold">{headline}</h3>
      <p className="mt-1 text-[11px] text-stone-500">Auto-selects relevant actions based on page category — {pageType}. Privacy-conscious tracking, no aggressive medical marketing.</p>
      {ready && experiment ? (
        <p className="mt-1 text-[10px] font-mono text-stone-400">
          A/B experiment {experiment.id} · variant {variant} · order: {order}
        </p>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ctas.map((cta) => (
          <Link key={cta.label} href={cta.href} onClick={() => handleClick(cta.label, cta.href)} className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold hover:border-emerald-300 hover:bg-emerald-50 dark:border-stone-700 dark:hover:bg-stone-800">
            {cta.icon} {cta.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
