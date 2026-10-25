import { SITE } from "./site";

export function absoluteUrl(path = "/health") {
  const base = SITE.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The publisher of every /health page. It is run by the gym, and saying so (parentOrganization →
 * the gym's LocalBusiness node) lets search engines and AI assistants tie the health guides to
 * Royal Fitness Club instead of treating them as an unknown, anonymous publisher.
 */
export const HEALTH_ORG_ID = `${SITE.url}/health#organization`;
const GYM = { "@type": "HealthClub", "@id": `${SITE.url}/#gym`, name: "Royal Fitness Club", url: SITE.url };

export function healthPublisher() {
  return {
    "@type": "Organization",
    "@id": HEALTH_ORG_ID,
    name: SITE.name,
    url: `${SITE.url}/health`,
    logo: { "@type": "ImageObject", url: absoluteUrl("/health/logo.svg") },
    parentOrganization: GYM,
  };
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
    // Only real dates: these pages used to claim fixed 2026-01-15 / 2026-08-20 dates they never had.
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    about: input.category || "Health",
    publisher: healthPublisher(),
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

/** BreadcrumbList from visible crumbs; the current page (no link) is listed without a URL, which Google allows. */
export function breadcrumbItemsJsonLd(items: { label: string; href?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: absoluteUrl(it.href) } : {}),
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/health#website`,
    name: SITE.name,
    url: `${SITE.url}/health`,
    description: SITE.tagline,
    inLanguage: "en-IN",
    publisher: { "@id": HEALTH_ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/health/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    ...healthPublisher(),
    slogan: SITE.tagline,
    telephone: SITE.contactPhone,
    sameAs: ["https://www.instagram.com/royalfitness93_/"],
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
    author: { "@type": "Organization", name: input.author, url: absoluteUrl("/health/blog/author"), parentOrganization: { "@id": HEALTH_ORG_ID } },
    publisher: healthPublisher(),
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
  };
}

export function collectionPageJsonLd(input: { title: string; description: string; slug: string; items: { name: string; path: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.slug),
    isPartOf: { "@type": "WebSite", name: SITE.name, url: `${SITE.url}/health` },
    mainEntity: itemListJsonLd(input.items),
  };
}


export function readingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

export function canonical(path: string) {
  return absoluteUrl(path);
}

/**
 * A page title for metadata.title. The /health layout's title template already appends
 * " | Bharat Health Guide", so this never adds the brand itself (it used to, which printed the
 * brand twice). Long titles are cut at a word boundary so title + brand stays near 60 characters.
 */
export function seoTitle(title: string, max = 60 - ` | ${SITE.name}`.length) {
  const t = title.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  return cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : max).replace(/[\s—–|:,-]+$/, "");
}

/** A meta description of at most `max` characters, cut at a word boundary. */
export function seoDescription(desc: string, max = 155) {
  const d = desc.trim().replace(/\s+/g, " ");
  if (d.length <= max) return d;
  const cut = d.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : max - 1).replace(/[\s,;:—–-]+$/, "")}…`;
}

/**
 * Reference pages (diseases, herbs, tests…) use a one-line summary as their description, often
 * 40–70 characters: too short for Google to show a useful snippet. Short ones get a plain line
 * about what the page covers; long ones are left alone apart from the length cap.
 */
export function entityDescription(short: string, covers: string) {
  const s = short.trim();
  return seoDescription(s.length >= 110 ? s : `${s.replace(/\.?$/, ".")} ${covers}`);
}

export function openGraphImage(title: string) {
  // Use OG default for now — can be replaced with dynamic OG generation
  return {
    url: "/health/og-default.jpg",
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
