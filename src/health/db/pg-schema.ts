import { pgSchema } from "drizzle-orm/pg-core";

// All Premium Health Platform tables live in the "health" Postgres schema so they can
// share one Supabase database with the Royal Fitness Club site (public schema)
// without name clashes (both apps have e.g. "leads" and "users").
export const healthSchema = pgSchema("health");
