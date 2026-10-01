import type { Metadata } from "next";
import type { BlogPost, SiteContent } from "./content/types";
import { AREAS_SERVED, SITE_URL, absoluteUrl } from "./site";

// Day-name expansion for opening hours like "Monday – Friday".
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export function expandDays(label: string): string[] {
  const parts = label.split(/\s*[–-]\s*|\s+to\s+/i).map((s) => s.trim());
  const idx = (s: string) => DAYS.findIndex((d) => d.toLowerCase().startsWith(s.toLowerCase().slice(0, 3)));
  if (parts.length === 2 && idx(parts[0]) >= 0 && idx(parts[1]) >= 0) {
    const out: string[] = [];
    for (let i = idx(parts[0]); ; i = (i + 1) % 7) {
      out.push(DAYS[i]);
      if (i === idx(parts[1])) break;
    }
    return out;
  }
  return label
    .split(/[,&]/)
    .map((s) => DAYS[idx(s.trim())])
    .filter(Boolean);
}

export function pageMeta(c: SiteContent, opts: { title: string; description: string; path: string; image?: string | null; type?: "website" | "article" }): Metadata {
  const url = absoluteUrl(opts.path);
  // image: null → leave images unset so a route's own opengraph-image file is used.
  const images = opts.image === null ? undefined : [{ url: opts.image || c.seo.ogImage || "/opengraph-image", width: 1200, height: 630, alt: opts.title }];
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: opts.type ?? "website",
      url,
      title: opts.title,
      description: opts.description,
      siteName: c.business.name,
      locale: "en_IN",
      images,
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: images?.map((i) => i.url) },
  };
}

export function localBusinessJsonLd(c: SiteContent) {
  const b = c.business;
  return {
    "@context": "https://schema.org",
    "@type": ["HealthClub", "ExerciseGym", "LocalBusiness"],
    "@id": `${SITE_URL}/#gym`,
    name: b.name,
    description: b.description,
    url: SITE_URL,
    telephone: b.phone,
    ...(b.email ? { email: b.email } : {}),
    image: absoluteUrl(c.seo.ogImage || "/opengraph-image"),
    logo: absoluteUrl("/brand/logo-full.png"),
    priceRange: b.priceRange,
    foundingDate: String(b.foundedYear),
    hasMap: b.googleMapsUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${b.address.street}, ${b.address.locality}`,
      addressLocality: b.address.city,
      addressRegion: b.address.region,
      postalCode: b.address.postalCode,
      addressCountry: b.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: b.geo.lat, longitude: b.geo.lng },
    areaServed: [...AREAS_SERVED, "Noida"].map((name) => ({ "@type": "Place", name })),
    openingHoursSpecification: b.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: expandDays(h.days),
      opens: h.open,
      closes: h.close,
    })),
    aggregateRating: b.rating.count
      ? { "@type": "AggregateRating", ratingValue: b.rating.value, reviewCount: b.rating.count, bestRating: 5 }
      : undefined,
    sameAs: [`https://www.instagram.com/${b.instagram}/`, b.googleMapsUrl].filter(Boolean),
    amenityFeature: ["Air conditioning", "CCTV", "Certified trainers", "Emergency exit", "Lockers"].map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    makesOffer: c.plans.flatMap((p) => [
      { "@type": "Offer", name: `${p.name} membership (${p.duration})`, price: p.price, priceCurrency: "INR" },
      ...(p.couplePrice ? [{ "@type": "Offer", name: `${p.name} couple membership (${p.duration})`, price: p.couplePrice, priceCurrency: "INR" }] : []),
    ]),
  };
}

export function websiteJsonLd(c: SiteContent) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: c.business.name,
    publisher: { "@id": `${SITE_URL}/#gym` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function articleJsonLd(c: SiteContent, post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: absoluteUrl(post.cover || c.seo.ogImage || "/opengraph-image"),
    datePublished: post.published,
    dateModified: post.updated || post.published,
    author: { "@type": "Organization", name: post.author || c.business.name, url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#gym`, "@type": "Organization", name: c.business.name, logo: { "@type": "ImageObject", url: absoluteUrl("/brand/logo-full.png") } },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    keywords: post.tags.join(", "),
    articleSection: post.category,
  };
}
