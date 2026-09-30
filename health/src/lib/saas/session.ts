/**
 * Server-side identity for developer-account routes (API keys, billing).
 * Uses the verified Supabase session shared with the rest of the app — the old
 * client-written `bhg_session` cookie is no longer trusted anywhere.
 */

import { currentUser } from "@/lib/auth/server";

export type SessionIdentity = {
  /** Stable owner id (Supabase user id). */
  ownerId: string;
  ownerEmail: string | null;
  name: string | null;
};

export async function readSessionIdentity(): Promise<SessionIdentity | null> {
  const user = await currentUser();
  if (!user) return null;
  return { ownerId: user.id, ownerEmail: user.email, name: user.name };
}
