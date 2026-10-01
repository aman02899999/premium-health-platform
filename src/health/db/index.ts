import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Never throw at import time: the site must boot and serve pages even if the
// database is temporarily unreachable (news feed falls back to seed content).
const databaseUrl = process.env.DATABASE_URL;

export const isDbConfigured = Boolean(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool(): Pool {
  const existing = globalForDb.__arenaNextJsPostgresqlPool;
  if (existing) return existing;
  // Placeholder connection string when unconfigured: queries will fail fast
  // and callers handle it (readDb try/catch, health reports db:down).
  const pool = new Pool({
    connectionString:
      databaseUrl ?? "postgresql://127.0.0.1:1/postgres",
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
    max: 5,
  });
  // Swallow idle-client errors so they never crash the server process.
  pool.on("error", () => {});
  globalForDb.__arenaNextJsPostgresqlPool = pool;
  return pool;
}

export const pool = createPool();

export const db = drizzle(pool);
