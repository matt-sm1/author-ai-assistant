import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Compare secrets without leaking length via timingSafeEqual throws.
 */
export function secretsEqual(expected, supplied) {
  if (typeof expected !== "string" || typeof supplied !== "string") {
    return false;
  }

  const key = "cms-secret-compare";
  const a = createHmac("sha256", key).update(expected).digest();
  const b = createHmac("sha256", key).update(supplied).digest();
  return timingSafeEqual(a, b);
}
