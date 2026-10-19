// Everything the admin panel can edit lives in one SiteContent document.
// Pages read it server-side; the admin saves it back as a whole.

export type Business = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  foundedYear: number;
  phone: string;
  altPhone: string;
  whatsapp: string; // digits only, with country code, e.g. 918851830081
  email: string;
  instagram: string; // handle without @
  googleMapsUrl: string;
  googleReviewUrl: string;
  mapEmbedUrl: string;
  address: {
    street: string;
    locality: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  geo: { lat: number; lng: number };
  // label is a display name like "Morning"; days feeds Google opening-hours markup.
  hours: { label: string; days: string; open: string; close: string }[];
  rating: { value: number; count: number; source: string };
  priceRange: string;
};

export type Hero = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  image: string;
};

export type Stat = { value: number; suffix: string; label: string };

export type Program = {
  id: string;
  title: string;
  icon: string; // lucide icon name from the allow-list in components/Icon.tsx
  summary: string;
  points: string[];
  image: string;
};

export type Plan = {
  id: string;
  name: string;
  duration: string;
  price: number; // single person
  couplePrice: number; // two people joining together; 0 hides the couple option
  originalPrice: number;
  perks: string[];
  featured: boolean;
};

export type Trainer = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  specialties: string[];
  instagram: string;
  /** Certifications and qualifications, one per line, e.g. "ACE Certified Personal Trainer (2016)". */
  credentials?: string[];
  /** Photo or scan of a certificate, shown as evidence on the Why Royal Fitness page. */
  certificateImage?: string;
};

/**
 * A member's real before/after numbers, entered by the admin from the gym's own records and
 * published only with the member's consent. 0 means "not recorded".
 */
export type CaseStudy = {
  id: string;
  name: string; // first name + initial, e.g. "Rahul S."
  program: string;
  weeks: number;
  startWeight: number;
  endWeight: number;
  startWaist: number;
  endWaist: number;
  liftName: string;
  startLift: number;
  endLift: number;
  story: string;
  beforeImage: string;
  afterImage: string;
  verifiedOn: string; // ISO date the end measurements were taken
  consent: boolean;
};

export type GalleryItem = { id: string; title: string; caption: string; image: string };

export type Testimonial = { id: string; name: string; text: string; rating: number; result: string };

export type Faq = { id: string; q: string; a: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  cover: string;
  author: string;
  published: string; // ISO date
  updated: string; // ISO date
  draft: boolean;
  seoTitle: string;
  seoDescription: string;
  body: string; // lightweight markdown, see lib/markdown.ts
};

export type Seo = {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  googleVerification: string;
};

// primary = logo red (buttons, highlights), secondary = logo navy (surfaces).
export type Theme = { primary: string; secondary: string };

export type SiteContent = {
  business: Business;
  hero: Hero;
  stats: Stat[];
  programs: Program[];
  plans: Plan[];
  planNote: string;
  trainers: Trainer[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  caseStudies: CaseStudy[];
  faqs: Faq[];
  posts: BlogPost[];
  seo: Seo;
  theme: Theme;
  announcement: string;
};

export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  goal: string;
  message: string;
  source: string;
};
