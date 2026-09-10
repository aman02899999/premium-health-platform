/**
 * Simple in-memory rate limiting
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limitPerMinute: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + 60_000;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limitPerMinute - 1, resetAt };
  }
  if (bucket.count >= limitPerMinute) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count++;
  return { allowed: true, remaining: limitPerMinute - bucket.count, resetAt: bucket.resetAt };
}

export function rateLimitFromRequest(req: Request, limit = 60): { allowed: boolean; remaining: number } {
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anon").split(",")[0].trim();
  const key = `rl:${ip}:${new URL(req.url).pathname}`;
  const result = rateLimit(key, limit);
  return { allowed: result.allowed, remaining: result.remaining };
}
