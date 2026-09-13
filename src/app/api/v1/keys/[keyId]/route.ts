import { NextRequest, NextResponse } from "next/server";
import { revokeOwnedApiKey } from "@/lib/saas/keys";
import { readSessionIdentity } from "@/lib/saas/session";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/keys/{keyId} — revoke a key owned by the signed-in account.
 * Revocation is immediate and permanent; usage history is retained.
 *
 * Ownership is enforced inside revokeOwnedApiKey(), and a key belonging to
 * another account is reported as 404 — identical to a key that does not exist —
 * so this endpoint cannot be used to enumerate other accounts' key ids.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ keyId: string }> }) {
  const identity = readSessionIdentity(req);
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorised", message: "Sign in to manage API keys.", status: 401 } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { keyId } = await params;
  const outcome = await revokeOwnedApiKey(keyId, identity);

  if (outcome === "not_found") {
    return NextResponse.json(
      { ok: false, error: { code: "not_found", message: "No such API key on this account.", status: 404 } },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: {
        keyId,
        revoked: outcome === "revoked",
        note: outcome === "revoked" ? "Revoked — this key stops working immediately." : "This key was already revoked.",
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
