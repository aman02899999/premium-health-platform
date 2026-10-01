import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Never throw at import time: the site must boot and serve pages even if the
// database is temporarily unreachable (news feed falls back to seed content).
//
// POSTGRES_URL comes first: the Supabase <-> Vercel integration writes it and
// rewrites it whenever the database password changes, so it can't drift the
// way a hand-pasted DATABASE_URL can. (Order matters: a wrong password makes
// Supabase's pooler block this server's IP for a while, for every URL.)
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

/**
 * Supabase URLs carry `sslmode=require`, which node-postgres treats as full
 * certificate verification against public CAs, and Supabase's pooler cert is
 * signed by Supabase's own CA. Keep TLS on but drop that check, and remove
 * the integration's `supa=` hint, which isn't a Postgres parameter.
 */
function poolConfig(url: string) {
  try {
    const u = new URL(url);
    const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    u.searchParams.delete("sslmode");
    u.searchParams.delete("supa");
    return { connectionString: u.toString(), ssl: local ? undefined : { rejectUnauthorized: false } };
  } catch {
    return { connectionString: url };
  }
}

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
    ...poolConfig(databaseUrl ?? "postgresql://127.0.0.1:1/postgres"),
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
