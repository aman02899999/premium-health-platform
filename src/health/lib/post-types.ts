// Long-form posts (content/blog/<lang>/<slug>.md). See scripts/build-posts.mjs for the rules.
export type PostLang = "en" | "hi";

export type PostSource = { title: string; publisher: string; year: string; url: string };

export type PostMeta = {
  lang: PostLang;
  slug: string;
  title: string;
  hindiTitle: string;
  description: string;
  category: string;
  tags: string[];
  readingTime: number;
  publishedAt: string;
  lastReviewed: string;
  author: string;
  reviewedBy: string;
  /** "pending-medical-review" until a doctor has signed it off. */
  reviewStatus: "pending-medical-review" | "medically-reviewed";
  heroImage: string;
  heroAlt: string;
  sources: PostSource[];
  /** Internal links to related guides and tools. */
  related: { label: string; href: string }[];
  headings: string[];
  takeaways: string[];
  faqs: { q: string; a: string }[];
  words: number;
  ads: number;
};

/** Where a post lives: English under /health/blog, Hindi under /hi/health/blog. */
export const postPath = (lang: PostLang, slug: string) => (lang === "hi" ? `/hi/health/blog/${slug}` : `/health/blog/${slug}`);
