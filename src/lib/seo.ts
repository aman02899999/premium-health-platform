import { SITE } from "./site";

export function absoluteUrl(path = "/") {
  const base = SITE.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  slug: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.slug),
    inLanguage: "en-IN",
    datePublished: input.datePublished || "2026-01-15",
    dateModified: input.dateModified || "2026-08-20",
    about: input.category || "Health",
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
    },
    medicalAudience: { "@type": "PeopleAudience", audienceType: "Patient" },
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.tagline,
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    slogan: SITE.tagline,
    logo: absoluteUrl("/logo.svg"),
    sameAs: [
      // Add real social profiles when available — placeholders for SEO
      "https://twitter.com/bharathealthguide",
      "https://www.instagram.com/bharathealthguide",
      "https://www.youtube.com/@bharathealthguide",
    ],
  };
}

export function blogPostingJsonLd(input: {
  title: string;
  description: string;
  slug: string;
  image: string;
  imageAlt: string;
  datePublished: string;
  dateModified: string;
  category: string;
  author: string;
  tags: string[];
  readMinutes: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    image: [input.image],
    url: absoluteUrl(input.slug),
    inLanguage: "en-IN",
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { "@type": "Organization", name: input.author, url: absoluteUrl("/") },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
    },
    articleSection: input.category,
    keywords: input.tags.join(", "),
    timeRequired: `PT${input.readMinutes}M`,
    isAccessibleForFree: true,
    about: { "@type": "MedicalCondition", name: input.category },
    mainEntityOfPage: absoluteUrl(input.slug),
  };
}

export function itemListJsonLd(items: { name: string; path: string; image?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.path),
      ...(it.image ? { image: it.image } : {}),
    })),
  };
}

export function productJsonLd(input: {
  name: string;
  description: string;
  slug: string;
  image: string;
  category: string;
  price?: string;
  rating?: string;
  brand?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: [input.image],
    url: absoluteUrl(input.slug),
    category: input.category,
    brand: { "@type": "Brand", name: input.brand || SITE.name },
    offers: {
      "@type": "Offer",
      price: input.price?.replace(/[^\d.]/g, "") || "999",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(input.slug),
    },
    aggregateRating: input.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: input.rating.split("/")[0],
          bestRating: "5",
          ratingCount: "127",
        }
      : undefined,
  };
}

export function collectionPageJsonLd(input: { title: string; description: string; slug: string; items: { name: string; path: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.slug),
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    mainEntity: itemListJsonLd(input.items),
  };
}

export function howToJsonLd(input: { name: string; description: string; steps: { name: string; text: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function readingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

export function canonical(path: string) {
  return absoluteUrl(path);
}

// SEO meta helpers — for pro optimization
export function seoTitle(title: string, includeBrand = true) {
  const suffix = ` | ${SITE.name}`;
  const full = includeBrand ? `${title}${suffix}` : title;
  return full.length > 60 ? `${title.slice(0, 55)}...${suffix}` : full;
}

export function seoDescription(desc: string, max = 155) {
  if (desc.length <= max) return desc;
  return desc.slice(0, max - 3).trim() + "...";
}

export function openGraphImage(title: string) {
  // Use OG default for now — can be replaced with dynamic OG generation
  return {
    url: "/og-default.jpg",
    width: 1200,
    height: 630,
    alt: title,
  };
}

// Keywords helper — merges base + specific
export function seoKeywords(base: string[], extra: string[] = []) {
  return Array.from(new Set([...base, ...extra])).slice(0, 20);
}

// Hreflang for India — EN, HI, Hinglish
export function hreflangLinks(path: string) {
  const url = absoluteUrl(path);
  return [
    { lang: "en-IN", href: url },
    { lang: "en", href: url },
    { lang: "x-default", href: url },
  ];
}
