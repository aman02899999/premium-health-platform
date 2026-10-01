import "server-only";
import { createClient } from "@supabase/supabase-js";

// The "library" bucket is private. Buyers are not admins, so issuing their download
// links needs the service-role key (set by the Supabase–Vercel integration, server only).

export const LIBRARY_BUCKET = "library";
export const bookPath = (slug: string) => `books/${slug}.pdf`;

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

export const librarySigningConfigured = () => Boolean(url() && serviceKey());

function serviceClient() {
  return createClient(url(), serviceKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** A 60-second signed link that downloads the book with a friendly filename. */
export async function signedBookUrl(slug: string, filename: string): Promise<string> {
  const { data, error } = await serviceClient()
    .storage.from(LIBRARY_BUCKET)
    .createSignedUrl(bookPath(slug), 60, { download: filename });
  if (error || !data?.signedUrl) throw new Error(error?.message || "Could not sign the download");
  return data.signedUrl;
}
