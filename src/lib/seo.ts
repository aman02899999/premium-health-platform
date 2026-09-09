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
    sameSite: [],
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

export function readingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

export function canonical(path: string) {
  return absoluteUrl(path);
}
