import { defineConfig } from "drizzle-kit";

// Premium Health Platform tables live in the "health" Postgres schema of the
// shared Supabase database. Generate migrations with:
//   DATABASE_URL=... npx drizzle-kit generate --config drizzle.health.config.ts
export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/health/db/schema.ts",
    "./src/health/db/health-schema.ts",
    "./src/health/db/monetization-schema.ts",
    "./src/health/db/saas-schema.ts",
  ],
  schemaFilter: ["health"],
  out: "./supabase/health-drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
