import { describe, expect, it } from "vitest";
import { secretsEqual } from "@/backend/lib/secure-compare";

describe("secretsEqual", () => {
  it("returns true for equal secrets of different lengths vs false without throw", () => {
    expect(secretsEqual("abc", "abc")).toBe(true);
    expect(secretsEqual("short", "longer-secret")).toBe(false);
    expect(secretsEqual("abc", "abd")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(secretsEqual(null, "x")).toBe(false);
    expect(secretsEqual("x", undefined)).toBe(false);
  });
});
