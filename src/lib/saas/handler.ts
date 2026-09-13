/**
 * Shared plumbing for /api/v1/* routes: one wrapper applies authentication,
 * quota enforcement, usage metering and a consistent error envelope, so no
 * individual route can accidentally ship without them.
 */

import { NextResponse } from "next/server";
import { authenticateApiRequest, apiError, safePath, type AuthSuccess } from "./auth";

export type KeyedContext = { auth: AuthSuccess; url: URL };

/**
 * Wraps a handler that requires a valid API key.
 * Usage is recorded after the handler settles, including failures.
 */
export function keyedRoute(
  handler: (req: Request, ctx: KeyedContext) => Promise<NextResponse> | NextResponse
) {
  return async function route(req: Request): Promise<NextResponse> {
    const auth = await authenticateApiRequest(req);
    if (!auth.ok) return auth.response;

    const endpoint = safePath(req);
    const url = new URL(req.url);

    try {
      const response = await handler(req, { auth, url });
      await auth.record(endpoint, response.status < 400);
      return response;
    } catch (error) {
      await auth.record(endpoint, false);
      const message = error instanceof Error ? error.message : "Unexpected error";
      return apiError(500, "internal_error", `Request failed: ${message}`);
    }
  };
}

/** Parses a bounded integer query parameter. */
export function intParam(url: URL, name: string, fallback: number, min: number, max: number): number {
  const raw = url.searchParams.get(name);
  const value = raw === null ? Number.NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

/** Parses a bounded float query parameter. */
export function floatParam(url: URL, name: string, fallback: number, min: number, max: number): number {
  const raw = url.searchParams.get(name);
  const value = raw === null ? Number.NaN : Number.parseFloat(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

/**
 * Wraps a handler that proxies a health provider and returns its paginated
 * result. Guards against providers being disabled via env flags.
 */
export function requireQuery(url: URL, name = "q"): string | null {
  const value = (url.searchParams.get(name) ?? "").trim();
  return value.length === 0 ? null : value.slice(0, 200);
}
