"use client";

import Link from "next/link";
import { ShoppingBag, BookOpen, Calculator, Users, Tag, Mail, Crown, FileText } from "lucide-react";
import { trackMonetizationEvent, getAttributionFromUrl } from "@/lib/monetization/analytics";

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

export function MonetizationCTA({ pageType = "general", page = "/", customCTAs }: { pageType?: PageType; page?: string; customCTAs?: CTAItem[] }) {
  const ctas = customCTAs || CTA_MAP[pageType] || CTA_MAP.general;

  const handleClick = (label: string, href: string) => {
    trackMonetizationEvent({ type: "cta_click", page, cta: label, source: href, utm: getAttributionFromUrl() });
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-900">
      <h3 className="text-sm font-bold">Continue Your Health Journey — Monetization CTA Engine</h3>
      <p className="mt-1 text-[11px] text-stone-500">Auto-selects relevant actions based on page category — {pageType}. Privacy-conscious tracking, no aggressive medical marketing.</p>
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
