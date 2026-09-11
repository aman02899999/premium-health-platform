/**
 * Monetization Platform — normalized schema (13 tables)
 *
 * Covers the full earning stack: premium subscriptions, affiliate tracking,
 * orders, digital-product delivery, download tokens + audit, lead generation,
 * monetization events, coupons and ad events.
 *
 * Design rules:
 *  - Money is stored in paise (integer) — never floats.
 *  - Every affiliate click keeps its UTM attribution and timestamp.
 *  - Download tokens are single-purpose, expiring, and audited (limit 3 per purchase).
 *  - No health/PHI is ever stored alongside monetization records.
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============ 1. Premium subscriptions ============

export const premiumSubscriptions = pgTable(
  "premium_subscriptions",
  {
    id: serial("id").primaryKey(),
    /** Signed-in user id when available, otherwise the checkout email. */
    userId: varchar("user_id", { length: 120 }),
    email: varchar("email", { length: 255 }).notNull(),
    plan: varchar("plan", { length: 60 }).notNull().default("monthly"),
    /** Amount in paise (₹199/mo => 19900). */
    amountPaise: integer("amount_paise").notNull().default(19900),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    status: varchar("status", { length: 40 }).notNull().default("pending"), // pending | active | cancelled | expired | failed
    provider: varchar("provider", { length: 40 }).notNull().default("razorpay"),
    providerSubscriptionId: varchar("provider_subscription_id", { length: 255 }),
    providerCustomerId: varchar("provider_customer_id", { length: 255 }),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelledAt: timestamp("cancelled_at"),
    attribution: jsonb("attribution"), // page, source, campaign, cta, utm
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    emailIdx: index("premium_subscriptions_email_idx").on(t.email),
    statusIdx: index("premium_subscriptions_status_idx").on(t.status),
    providerSubIdx: uniqueIndex("premium_subscriptions_provider_sub_idx").on(t.providerSubscriptionId),
  })
);

// ============ 2. Affiliate products (merchant catalogue mirror) ============

export const affiliateProducts = pgTable(
  "affiliate_products",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull(),
    productId: varchar("product_id", { length: 120 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    merchant: varchar("merchant", { length: 120 }),
    network: varchar("network", { length: 80 }), // amazon | flipkart | clickbank | direct
    category: varchar("category", { length: 120 }),
    imageUrl: text("image_url"),
    /** Commission rate in basis points (800 = 8.00%). */
    commissionBps: integer("commission_bps").notNull().default(800),
    pricePaise: integer("price_paise"),
    currency: varchar("currency", { length: 8 }).default("INR"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("affiliate_products_slug_idx").on(t.slug),
    activeIdx: index("affiliate_products_active_idx").on(t.active),
  })
);

// ============ 3. Affiliate clicks ============

export const affiliateClicks = pgTable(
  "affiliate_clicks",
  {
    id: serial("id").primaryKey(),
    productId: varchar("product_id", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 255 }),
    /** Outbound URL with affiliate tag, stored for audit/debug. */
    destinationUrl: text("destination_url"),
    page: varchar("page", { length: 500 }),
    utmSource: varchar("utm_source", { length: 120 }),
    utmMedium: varchar("utm_medium", { length: 120 }),
    utmCampaign: varchar("utm_campaign", { length: 160 }),
    utmContent: varchar("utm_content", { length: 160 }),
    utmTerm: varchar("utm_term", { length: 160 }),
    referrer: text("referrer"),
    /** Hashed, non-identifying visitor id — never a raw IP. */
    visitorHash: varchar("visitor_hash", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    productIdx: index("affiliate_clicks_product_idx").on(t.productId),
    createdAtIdx: index("affiliate_clicks_created_at_idx").on(t.createdAt),
    campaignIdx: index("affiliate_clicks_campaign_idx").on(t.utmCampaign),
  })
);

// ============ 4. Affiliate conversions ============

export const affiliateConversions = pgTable(
  "affiliate_conversions",
  {
    id: serial("id").primaryKey(),
    clickId: integer("click_id"),
    productId: varchar("product_id", { length: 120 }).notNull(),
    network: varchar("network", { length: 80 }),
    /** Sale amount in paise. */
    orderValuePaise: integer("order_value_paise"),
    /** Commission earned in paise. */
    commissionPaise: integer("commission_paise").notNull().default(0),
    currency: varchar("currency", { length: 8 }).default("INR"),
    status: varchar("status", { length: 40 }).notNull().default("reported"), // reported | confirmed | reversed
    reportedAt: timestamp("reported_at").defaultNow(),
    confirmedAt: timestamp("confirmed_at"),
  },
  (t) => ({
    productIdx: index("affiliate_conversions_product_idx").on(t.productId),
    statusIdx: index("affiliate_conversions_status_idx").on(t.status),
  })
);

// ============ 5. Orders ============

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    /** Public order id used in checkout + download tokens. */
    orderId: varchar("order_id", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 120 }),
    status: varchar("status", { length: 40 }).notNull().default("created"), // created | pending | paid | failed | refunded
    provider: varchar("provider", { length: 40 }).notNull().default("razorpay"),
    providerOrderId: varchar("provider_order_id", { length: 255 }),
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    /** Total in paise. */
    amountPaise: integer("amount_paise").notNull().default(0),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    couponCode: varchar("coupon_code", { length: 80 }),
    discountPaise: integer("discount_paise").notNull().default(0),
    attribution: jsonb("attribution"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    orderIdIdx: uniqueIndex("orders_order_id_idx").on(t.orderId),
    emailIdx: index("orders_email_idx").on(t.email),
    statusIdx: index("orders_status_idx").on(t.status),
  })
);

// ============ 6. Order items ============

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: varchar("order_id", { length: 120 }).notNull(),
    productId: varchar("product_id", { length: 120 }).notNull(),
    productSlug: varchar("product_slug", { length: 255 }),
    title: varchar("title", { length: 500 }),
    productType: varchar("product_type", { length: 40 }).notNull().default("digital"), // digital | report | plan | premium
    quantity: integer("quantity").notNull().default(1),
    unitPricePaise: integer("unit_price_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    orderIdx: index("order_items_order_idx").on(t.orderId),
    productIdx: index("order_items_product_idx").on(t.productId),
  })
);

// ============ 7. Digital products (deliverable file metadata) ============

export const digitalProducts = pgTable(
  "digital_products",
  {
    id: serial("id").primaryKey(),
    productId: varchar("product_id", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    /** Private storage object key — never exposed to the browser. */
    storageKey: text("storage_key").notNull(),
    storageDriver: varchar("storage_driver", { length: 20 }).notNull().default("local"), // s3 | r2 | local
    fileName: varchar("file_name", { length: 255 }),
    fileSize: varchar("file_size", { length: 40 }),
    format: varchar("format", { length: 20 }).default("PDF"),
    /** Max successful downloads per purchase. */
    downloadLimit: integer("download_limit").notNull().default(3),
    /** Download link lifetime in hours. */
    expiresInHours: integer("expires_in_hours").notNull().default(72),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    productIdx: uniqueIndex("digital_products_product_idx").on(t.productId),
    slugIdx: index("digital_products_slug_idx").on(t.slug),
  })
);

// ============ 8. Download tokens ============

export const downloadTokens = pgTable(
  "download_tokens",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 255 }).notNull(),
    orderId: varchar("order_id", { length: 120 }).notNull(),
    productId: varchar("product_id", { length: 120 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    /** Successful download count against this token. */
    downloadCount: integer("download_count").notNull().default(0),
    maxDownloads: integer("max_downloads").notNull().default(3),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("download_tokens_token_idx").on(t.token),
    orderIdx: index("download_tokens_order_idx").on(t.orderId),
  })
);

// ============ 9. Download audit trail ============

export const downloadAudit = pgTable(
  "download_audit",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 255 }).notNull(),
    orderId: varchar("order_id", { length: 120 }).notNull(),
    productId: varchar("product_id", { length: 120 }).notNull(),
    outcome: varchar("outcome", { length: 20 }).notNull(), // granted | denied_limit | denied_expired | denied_invalid
    /** Hashed, non-identifying client reference — never a raw IP. */
    actorHash: varchar("actor_hash", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    orderIdx: index("download_audit_order_idx").on(t.orderId),
    tokenIdx: index("download_audit_token_idx").on(t.token),
    createdAtIdx: index("download_audit_created_at_idx").on(t.createdAt),
  })
);

// ============ 10. Leads (rate limited: 5/min) ============

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    formType: varchar("form_type", { length: 80 }).notNull().default("diet-consultation"),
    message: text("message"),
    city: varchar("city", { length: 120 }),
    /** Estimated lead value in paise (₹250 avg => 25000). */
    valuePaise: integer("value_paise").default(25000),
    status: varchar("status", { length: 40 }).notNull().default("new"), // new | contacted | qualified | converted | rejected
    consent: boolean("consent").notNull().default(false),
    page: varchar("page", { length: 500 }),
    attribution: jsonb("attribution"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    emailIdx: index("leads_email_idx").on(t.email),
    formIdx: index("leads_form_idx").on(t.formType),
    createdAtIdx: index("leads_created_at_idx").on(t.createdAt),
  })
);

// ============ 11. Monetization events ============

export const monetizationEvents = pgTable(
  "monetization_events",
  {
    id: serial("id").primaryKey(),
    eventId: varchar("event_id", { length: 120 }),
    type: varchar("type", { length: 60 }).notNull(), // cta_click | affiliate_product_click | purchase_completed | ...
    page: varchar("page", { length: 500 }),
    productId: varchar("product_id", { length: 120 }),
    campaign: varchar("campaign", { length: 160 }),
    source: varchar("source", { length: 160 }),
    cta: varchar("cta", { length: 255 }),
    /** A/B experiment context, e.g. { experimentId, variant, type }. */
    ab: jsonb("ab"),
    utm: jsonb("utm"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    typeIdx: index("monetization_events_type_idx").on(t.type),
    createdAtIdx: index("monetization_events_created_at_idx").on(t.createdAt),
    pageIdx: index("monetization_events_page_idx").on(t.page),
  })
);

// ============ 12. Coupons ============

export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 80 }).notNull(),
    description: text("description"),
    discountType: varchar("discount_type", { length: 20 }).notNull().default("percent"), // percent | flat
    /** percent: basis points (1000 = 10%) · flat: paise */
    discountValue: integer("discount_value").notNull().default(0),
    maxRedemptions: integer("max_redemptions"),
    redemptionCount: integer("redemption_count").notNull().default(0),
    minOrderPaise: integer("min_order_paise").default(0),
    active: boolean("active").notNull().default(true),
    validFrom: timestamp("valid_from"),
    validUntil: timestamp("valid_until"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    codeIdx: uniqueIndex("coupons_code_idx").on(t.code),
    activeIdx: index("coupons_active_idx").on(t.active),
  })
);

// ============ 13. Ad events (AdSense / direct slots) ============

export const adEvents = pgTable(
  "ad_events",
  {
    id: serial("id").primaryKey(),
    slotId: varchar("slot_id", { length: 120 }).notNull(),
    type: varchar("type", { length: 20 }).notNull().default("impression"), // impression | click
    page: varchar("page", { length: 500 }),
    network: varchar("network", { length: 60 }).default("adsense"),
    /** Estimated revenue in paise. */
    revenuePaise: integer("revenue_paise").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    slotIdx: index("ad_events_slot_idx").on(t.slotId),
    typeIdx: index("ad_events_type_idx").on(t.type),
    createdAtIdx: index("ad_events_created_at_idx").on(t.createdAt),
  })
);
