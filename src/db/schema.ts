import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("reader"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  qualification: varchar("qualification", { length: 255 }),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalReviewers = pgTable("medical_reviewers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  qualification: varchar("qualification", { length: 255 }),
  specialty: varchar("specialty", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const diseases = pgTable("diseases", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  hindiName: varchar("hindi_name", { length: 255 }),
  short: text("short"),
  system: varchar("system", { length: 120 }),
  category: varchar("category", { length: 120 }),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  authorId: integer("author_id"),
  reviewerId: integer("reviewer_id"),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const symptoms = pgTable("symptoms", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  short: text("short"),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  genericName: varchar("generic_name", { length: 255 }).notNull(),
  drugClass: varchar("drug_class", { length: 255 }),
  short: text("short"),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const herbs = pgTable("herbs", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  botanicalName: varchar("botanical_name", { length: 255 }),
  short: text("short"),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nutritionFoods = pgTable("nutrition_foods", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }),
  short: text("short"),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dietPlans = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labTests = pgTable("lab_tests", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  short: text("short"),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  subtitle: text("subtitle"),
  category: varchar("category", { length: 120 }),
  body: jsonb("body"),
  status: varchar("status", { length: 40 }).default("published"),
  featured: boolean("featured").default(false),
  authorId: integer("author_id"),
  reviewerId: integer("reviewer_id"),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }),
  short: text("short"),
  body: jsonb("body"),
  affiliateUrl: text("affiliate_url"),
  merchant: varchar("merchant", { length: 255 }),
  status: varchar("status", { length: 40 }).default("published"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 60 }).notNull(),
  entitySlug: varchar("entity_slug", { length: 200 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
});

export const references = pgTable("references_table", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 60 }).notNull(),
  entitySlug: varchar("entity_slug", { length: 200 }).notNull(),
  title: text("title").notNull(),
  source: varchar("source", { length: 255 }),
  year: varchar("year", { length: 10 }),
  url: text("url"),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
});

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  productId: integer("product_id"),
  url: text("url").notNull(),
  merchant: varchar("merchant", { length: 255 }),
  clicks: integer("clicks").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  slot: varchar("slot", { length: 80 }).notNull(),
  label: varchar("label", { length: 255 }),
  enabled: boolean("enabled").default(true),
  code: text("code"),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  consent: boolean("consent").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 500 }).notNull(),
  views: integer("views").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  title: varchar("title", { length: 320 }).notNull(),
  summary: text("summary"),
  category: varchar("category", { length: 80 }).notNull(),
  kind: varchar("kind", { length: 40 }).default("briefing"),
  body: jsonb("body"),
  sourceName: varchar("source_name", { length: 255 }),
  sourceUrl: text("source_url"),
  status: varchar("status", { length: 40 }).default("draft"),
  author: varchar("author", { length: 255 }),
  reviewer: varchar("reviewer", { length: 255 }),
  publishedAt: timestamp("published_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
