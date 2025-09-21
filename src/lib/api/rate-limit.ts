import { NextRequest, NextResponse } from "next/server";

// Lightweight in-memory sliding window rate limiter (per-process)
// Suitable for single-instance deployments. For distributed setups, replace with Redis.

const store = new Map<string, number[]>();

export type RateLimitOptions = {
  limit: number; // max requests in window
  windowMs: number; // window size in ms
  keyPrefix?: string; // optional namespace
};

export function getClientId(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    // @ts-expect-error ip may exist in some runtimes
    (req as any).ip ||
    "unknown"
  );
}

export function checkRateLimit(req: NextRequest, opts: RateLimitOptions) {
  const { limit, windowMs, keyPrefix = "rl" } = opts;
  const key = `${keyPrefix}:${getClientId(req)}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = store.get(key) ?? [];
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    const oldest = recent[0];
    const retryAfterMs = windowMs - (now - oldest);
    const headers = new Headers({
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
    });
    return { allowed: false as const, headers, retryAfterMs };
  }

  recent.push(now);
  store.set(key, recent);
  const headers = new Headers({
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(limit - recent.length),
  });
  return { allowed: true as const, headers, retryAfterMs: 0 };
}

export function tooManyRequests(message = "Too Many Requests", headers?: Headers) {
  const init: ResponseInit = { status: 429 };
  if (headers) init.headers = headers;
  return new NextResponse(
    JSON.stringify({ success: false, error: { message } }),
    init
  );
}