import { describe, expect, it } from "vitest";
import {
  assertSafeStorageKey,
  buildMediaStorageKey,
  publicUrlForKey,
  STORAGE_KEY_PATTERN,
} from "@/backend/adapters/storage/storage-key";

describe("storage-key", () => {
  it("builds keys matching the allowlist pattern", () => {
    const key = buildMediaStorageKey("jpg");
    expect(STORAGE_KEY_PATTERN.test(key)).toBe(true);
    expect(key.startsWith("media/")).toBe(true);
  });

  it("emits nested public URLs matching current Hostinger disk layout", () => {
    const url = publicUrlForKey(
      "https://cdn.example.com",
      "media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp",
    );
    expect(url).toBe(
      "https://cdn.example.com/media/media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp",
    );
  });

  it("rejects path traversal", () => {
    expect(() => assertSafeStorageKey("../etc/passwd")).toThrow();
    expect(() => assertSafeStorageKey("/media/x.jpg")).toThrow();
    expect(() =>
      assertSafeStorageKey("media/2026/10/../evil.jpg"),
    ).toThrow();
    expect(() =>
      assertSafeStorageKey("media/2026/10/not-a-ulid.jpg"),
    ).toThrow();
  });

  it("rejects null bytes", () => {
    expect(() =>
      assertSafeStorageKey("media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.jpg\0"),
    ).toThrow();
  });
});
