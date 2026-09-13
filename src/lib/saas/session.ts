/**
 * Server-side session reader for developer-account routes.
 *
 * This reads the same `bhg_session` cookie the rest of the app uses (see
 * src/lib/auth/index.ts). That cookie is a demo, client-written, non-HttpOnly
 * value — it is adequate for gating a dashboard, but it is NOT a trust boundary.
 * Replacing it with a signed, HttpOnly session (the NextAuth migration already
 * planned in the README) is the outstanding item before this can be sold, and is
 * tracked as a residual risk in AUDIT.md.
 */

import type { NextRequest } from "next/server";

export type SessionIdentity = {
  /** Stable owner id — falls back to the email so keys stay attached. */
  ownerId: string;
  ownerEmail: string | null;
  name: string | null;
};

export function readSessionIdentity(req: NextRequest): SessionIdentity | null {
  const cookie = req.cookies.get("bhg_session")?.value;
  if (!cookie) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(cookie)) as {
      id?: string;
      email?: string;
      name?: string;
    };
    const email = typeof parsed.email === "string" && parsed.email.length > 0 ? parsed.email.toLowerCase() : null;
    const ownerId = typeof parsed.id === "string" && parsed.id.length > 0 ? parsed.id : email;
    if (!ownerId) return null;
    return { ownerId, ownerEmail: email, name: parsed.name ?? null };
  } catch {
    return null;
  }
}
