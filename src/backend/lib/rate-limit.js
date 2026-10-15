/**
 * Simple in-memory sliding window rate limiter (per process).
 * Suitable for single-instance deploys; use Redis/edge limits in multi-instance prod.
 */
const buckets = new Map();

export function rateLimit(key, { limit = 20, windowMs = 60_000 } = {}) {
  const now = Date.now();
  let entry = buckets.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { windowStart: now, count: 0 };
    buckets.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { ok: false, retryAfterMs };
  }

  return { ok: true, retryAfterMs: 0 };
}

export function clientKeyFromRequest(request, suffix = "") {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${ip}:${suffix}`;
}
