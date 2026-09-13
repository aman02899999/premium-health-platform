/**
 * API key authentication + quota gate for /api/v1/*.
 *
 * Every keyed route calls `authenticateApiRequest(req)` and returns the failure
 * response untouched, so error shapes, rate-limit headers and status codes stay
 * identical across the whole surface:
 *
 *   401  missing_api_key   no key supplied
 *   401  invalid_api_key   key unknown, revoked (or the owner was revoked)
 *   429  quota_exceeded    daily plan quota used up  (+ Retry-After until UTC midnight)
 *   429  rate_limited      per-minute burst limit     (+ Retry-After seconds)
 *
 * Success returns the key, its plan and the standard rate-limit headers.
 */

import { NextResponse } from "next/server";
import { findKeyByRaw, planForKey, touchApiKey, type ApiKeyRecord } from "./keys";
import { checkDailyQuota, checkMinuteLimit, recordUsage, type UsageSnapshot } from "./metering";
import { isUnlimited, type ApiPlan } from "./plans";
import { SITE } from "@/lib/site";

export const API_VERSION = "v1";
export const DOCS_PATH = "/developers/docs";

export type ApiErrorCode =
  | "missing_api_key"
  | "invalid_api_key"
  | "quota_exceeded"
  | "rate_limited"
  | "invalid_request"
  | "not_found"
  | "upstream_unavailable"
  | "internal_error";

export type ApiErrorBody = {
  ok: false;
  error: { code: ApiErrorCode; message: string; docs: string; status: number };
};

export type ApiSuccessMeta = {
  plan: ApiPlan["id"];
  requestId?: string;
};

export type AuthSuccess = {
  ok: true;
  key: ApiKeyRecord;
  plan: ApiPlan;
  usage: UsageSnapshot;
  headers: Record<string, string>;
  /** Call after the handler has produced a response — never before. */
  record: (endpoint: string, ok?: boolean) => Promise<void>;
};

export type AuthFailure = { ok: false; response: NextResponse };

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extraHeaders: Record<string, string> = {}
): NextResponse {
  const body: ApiErrorBody = {
    ok: false,
    error: { code, message, docs: SITE.url + DOCS_PATH, status },
  };
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
}

/** Extracts an API key from `x-api-key` or `Authorization: Bearer …`. */
export function extractApiKey(req: Request): string | null {
  const header = req.headers.get("x-api-key");
  if (header && header.trim()) return header.trim();

  const auth = req.headers.get("authorization");
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (match?.[1]) return match[1].trim();
  }

  // Optional query fallback, for quick browser smoke tests only.
  try {
    const fromQuery = new URL(req.url).searchParams.get("api_key");
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
  } catch {
    /* ignore */
  }
  return null;
}

function rateLimitHeaders(plan: ApiPlan, usage: UsageSnapshot, minuteRemaining: number): Record<string, string> {
  return {
    "X-API-Version": API_VERSION,
    "X-Plan": plan.id,
    "X-RateLimit-Limit-Day": isUnlimited(plan.requestsPerDay) ? "unlimited" : String(plan.requestsPerDay),
    "X-RateLimit-Remaining-Day": usage.unlimited ? "unlimited" : String(usage.remaining),
    "X-RateLimit-Limit-Minute": isUnlimited(plan.requestsPerMinute) ? "unlimited" : String(plan.requestsPerMinute),
    "X-RateLimit-Remaining-Minute": minuteRemaining < 0 ? "unlimited" : String(minuteRemaining),
    "X-RateLimit-Reset": usage.resetAt,
  };
}

/**
 * Verifies the request's API key, enforces plan quotas and records usage.
 * Returns either a ready-to-send error response or the authenticated context.
 */
export async function authenticateApiRequest(req: Request): Promise<AuthSuccess | AuthFailure> {
  const raw = extractApiKey(req);
  if (!raw) {
    return {
      ok: false,
      response: apiError(401, "missing_api_key", "Provide your API key in the x-api-key header or as an Authorization: Bearer token."),
    };
  }

  let record: ApiKeyRecord | null = null;
  try {
    record = await findKeyByRaw(raw);
  } catch {
    return { ok: false, response: apiError(500, "internal_error", "Key verification failed. Please retry.") };
  }

  if (!record) {
    return { ok: false, response: apiError(401, "invalid_api_key", "This API key is not recognised. Check the key or create a new one in the developer dashboard.") };
  }
  if (record.status === "revoked") {
    return { ok: false, response: apiError(401, "invalid_api_key", "This API key has been revoked.") };
  }

  const plan = planForKey(record);

  const daily = await checkDailyQuota(record.keyId, plan);
  if (!daily.allowed) {
    return {
      ok: false,
      response: apiError(
        429,
        "quota_exceeded",
        `Daily quota reached for the ${plan.name} plan (${plan.requestsPerDay.toLocaleString("en-IN")} requests/day). Quota resets at ${daily.usage.resetAt}. Upgrade your plan for a higher limit.`,
        {
          "Retry-After": String(daily.retryAfterSeconds),
          ...rateLimitHeaders(plan, daily.usage, 0),
        }
      ),
    };
  }

  const minute = checkMinuteLimit(record.keyId, plan);
  if (!minute.allowed) {
    return {
      ok: false,
      response: apiError(
        429,
        "rate_limited",
        `Burst limit reached for the ${plan.name} plan (${plan.requestsPerMinute} requests/minute). Retry shortly.`,
        {
          "Retry-After": String(minute.retryAfterSeconds),
          ...rateLimitHeaders(plan, daily.usage, 0),
        }
      ),
    };
  }

  const endpoint = safePath(req);

  return {
    ok: true,
    key: record,
    plan,
    usage: daily.usage,
    headers: rateLimitHeaders(plan, daily.usage, minute.remaining),
    record: async (endpointLabel: string = endpoint, ok = true) => {
      await Promise.allSettled([recordUsage(record!.keyId, endpointLabel, ok), touchApiKey(record!.keyId)]);
    },
  };
}

export function safePath(req: Request): string {
  try {
    return new URL(req.url).pathname;
  } catch {
    return "unknown";
  }
}

/** JSON success envelope — consistent `ok`, `meta` and rate-limit headers. */
export function apiSuccess(
  data: unknown,
  auth: AuthSuccess,
  extra: Record<string, unknown> = {},
  cacheSeconds = 0
): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      meta: {
        plan: auth.plan.id,
        quota: {
          day: auth.usage.day,
          requestsToday: auth.usage.requests,
          remainingToday: auth.usage.unlimited ? "unlimited" : auth.usage.remaining,
          resetsAt: auth.usage.resetAt,
        },
        attribution: auth.plan.attributionRequired ? "Data by Bharat Health Guide (https://bharathealthguide.in)" : undefined,
        generatedAt: new Date().toISOString(),
      },
      data,
      ...extra,
    },
    {
      headers: {
        ...auth.headers,
        "Cache-Control": cacheSeconds > 0 ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=600` : "no-store",
      },
    }
  );
}
