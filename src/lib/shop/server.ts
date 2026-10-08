import "server-only";
import { isDbConfigured } from "@/health/db";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS } from "./defaults";
import { loadCatalog, type Catalog } from "./store";

/** The storefront catalogue; an empty store (not an error page) if the database is unreachable. */
export async function getCatalog(): Promise<Catalog & { offline: boolean }> {
  if (!isDbConfigured) return { ...emptyCatalog(), offline: true };
  try {
    return { ...(await loadCatalog(true)), offline: false };
  } catch (err) {
    console.error("[shop] catalogue load failed:", (err as Error).message);
    return { ...emptyCatalog(), offline: true };
  }
}

function emptyCatalog(): Catalog {
  return { settings: DEFAULT_SETTINGS, categories: [], products: [], combos: [], productById: new Map(), comboById: new Map() };
}

/** The signed-in customer (Google or email OTP), verified from the session JWT. */
export async function currentCustomer(): Promise<{ id: string; email: string; name: string } | null> {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub || !c.email) return null;
  const meta = (c.user_metadata ?? {}) as Record<string, string>;
  return { id: String(c.sub), email: String(c.email).toLowerCase(), name: meta.full_name || meta.name || "" };
}
