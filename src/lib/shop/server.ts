import "server-only";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { isDbConfigured } from "@/health/db";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS } from "./defaults";
import { listPosts, loadCatalog, type Catalog } from "./store";
import type { Post } from "./types";

/** Every cached store read carries this tag; `expireShop()` drops them all at once. */
const SHOP_TAG = "shop";

// Cached between requests (plain arrays: the cache stores JSON), and expired the moment the admin
// saves or an order is paid, so the next visitor sees the change instead of a stale page.
const cachedCatalog = unstable_cache(
  async () => {
    const { settings, categories, products, combos } = await loadCatalog(true);
    return { settings, categories, products, combos };
  },
  ["shop-catalog-v1"],
  { tags: [SHOP_TAG], revalidate: 300 },
);
const cachedPosts = unstable_cache(async (): Promise<Post[]> => listPosts(true), ["shop-posts-v1"], { tags: [SHOP_TAG], revalidate: 300 });

/** Call after any change to the store's data. */
export function expireShop() {
  revalidateTag(SHOP_TAG, { expire: 0 });
  revalidatePath("/shop", "layout");
  revalidatePath("/sitemap.xml");
}

/**
 * The storefront catalogue; an empty store (not an error page) if the database is unreachable.
 * `fresh` skips the cache: checkout prices and stock always come straight from the database.
 */
export async function getCatalog(opts: { fresh?: boolean } = {}): Promise<Catalog & { offline: boolean }> {
  if (!isDbConfigured) return { ...emptyCatalog(), offline: true };
  try {
    if (opts.fresh) return { ...(await loadCatalog(true)), offline: false };
    const c = await cachedCatalog();
    return { ...c, productById: new Map(c.products.map((p) => [p.id, p])), comboById: new Map(c.combos.map((x) => [x.id, x])), offline: false };
  } catch (err) {
    console.error("[shop] catalogue load failed:", (err as Error).message);
    return { ...emptyCatalog(), offline: true };
  }
}

/** Published guides, cached like the catalogue. */
export async function getPosts(): Promise<Post[]> {
  if (!isDbConfigured) return [];
  return cachedPosts().catch(() => []);
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
