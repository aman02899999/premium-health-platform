/**
 * Developer platform schema — API keys, daily usage and API subscriptions.
 *
 * Design rules (mirroring src/db/monetization-schema.ts):
 *  - Raw API keys are NEVER stored. Only a SHA-256 hash and a display prefix are
 *    persisted, so a database leak cannot be replayed against the API.
 *  - Usage is aggregated per key per calendar day (UTC) — enough for quota
 *    enforcement and dashboards without storing non-aggregated PII.
 *  - No health data or request bodies are stored alongside usage counters.
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

export const apiKeys = pgTable(
  "api_keys",
  {
    id: serial("id").primaryKey(),
    /** Public, non-secret identifier used in the dashboard and audit logs. */
    keyId: varchar("key_id", { length: 64 }).notNull().unique(),
    /** Human label supplied by the developer. */
    name: varchar("name", { length: 120 }).notNull().default("Default key"),
    /** Owner: signed-in user id when available, otherwise the account email. */
    ownerId: varchar("owner_id", { length: 120 }),
    ownerEmail: varchar("owner_email", { length: 255 }),
    plan: varchar("plan", { length: 40 }).notNull().default("free"),
    /** SHA-256 (hex) of the full key. The plaintext key is shown once, never stored. */
    keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
    /** First characters of the key, for display ("bhg_live_ab12…"). */
    keyPrefix: varchar("key_prefix", { length: 24 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active | revoked
    environment: varchar("environment", { length: 12 }).notNull().default("live"), // live | test
    /** Optional path allow-list, e.g. ["/api/v1/food/*"]. Empty = all endpoints. */
    scopes: jsonb("scopes"),
    /** Lifetime request counter (cheap aggregate, also tracked per day). */
    requestCount: integer("request_count").notNull().default(0),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow(),
    revokedAt: timestamp("revoked_at"),
  },
  (t) => ({
    hashIdx: uniqueIndex("api_keys_hash_idx").on(t.keyHash),
    ownerIdx: index("api_keys_owner_idx").on(t.ownerId),
    emailIdx: index("api_keys_email_idx").on(t.ownerEmail),
    statusIdx: index("api_keys_status_idx").on(t.status),
  })
);

export const apiUsageDaily = pgTable(
  "api_usage_daily",
  {
    id: serial("id").primaryKey(),
    keyId: varchar("key_id", { length: 64 }).notNull(),
    /** UTC day, YYYY-MM-DD. */
    day: varchar("day", { length: 10 }).notNull(),
    requests: integer("requests").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    /** Endpoint path -> hit count, for the dashboard's "top endpoints" view. */
    byEndpoint: jsonb("by_endpoint"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    keyDayIdx: uniqueIndex("api_usage_key_day_idx").on(t.keyId, t.day),
    dayIdx: index("api_usage_day_idx").on(t.day),
  })
);

export const apiSubscriptions = pgTable(
  "api_subscriptions",
  {
    id: serial("id").primaryKey(),
    ownerId: varchar("owner_id", { length: 120 }),
    email: varchar("email", { length: 255 }).notNull(),
    plan: varchar("plan", { length: 40 }).notNull().default("free"),
    /** Amount in paise, matching the monetization schema. */
    amountPaise: integer("amount_paise").notNull().default(0),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    status: varchar("status", { length: 40 }).notNull().default("active"), // active | past_due | cancelled
    provider: varchar("provider", { length: 40 }).notNull().default("mock"),
    /** Order id at the payment provider (created at checkout, before settlement). */
    providerOrderId: varchar("provider_order_id", { length: 255 }),
    providerSubscriptionId: varchar("provider_subscription_id", { length: 255 }),
    /**
     * True when the entitlement was granted by a simulated (mock) payment rather
     * than an attested one. Recorded so a demo grant is never mistaken for revenue.
     */
    demo: boolean("demo").notNull().default(false),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    /** Whether the invoice was actually settled in the payment provider. */
    invoicePaid: boolean("invoice_paid").notNull().default(false),
    attribution: jsonb("attribution"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    emailIdx: index("api_subscriptions_email_idx").on(t.email),
    statusIdx: index("api_subscriptions_status_idx").on(t.status),
  })
);

/**
 * Per-endpoint daily counters, kept in their own table so the increment is a
 * single atomic upsert (jsonb read-modify-write on api_usage_daily would race
 * under concurrent requests).
 */
export const apiUsageEndpoints = pgTable(
  "api_usage_endpoints",
  {
    id: serial("id").primaryKey(),
    keyId: varchar("key_id", { length: 64 }).notNull(),
    day: varchar("day", { length: 10 }).notNull(),
    endpoint: varchar("endpoint", { length: 200 }).notNull(),
    requests: integer("requests").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    keyDayEndpointIdx: uniqueIndex("api_usage_endpoint_idx").on(t.keyId, t.day, t.endpoint),
    dayIdx: index("api_usage_endpoint_day_idx").on(t.day),
  })
);
