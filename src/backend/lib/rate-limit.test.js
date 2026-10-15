import { describe, expect, it } from "vitest";
import { rateLimit } from "@/backend/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit and blocks over it", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(false);
  });
});
