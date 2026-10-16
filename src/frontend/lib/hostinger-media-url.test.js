import { describe, expect, it } from "vitest";
import {
  rewriteHostingerMediaUrlsInHtml,
  toNestedHostingerMediaUrl,
} from "@/frontend/lib/hostinger-media-url";

describe("hostinger-media-url", () => {
  it("nests flat Hostinger media paths", () => {
    expect(
      toNestedHostingerMediaUrl(
        "https://cdn.example.hostingersite.com/media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp",
      ),
    ).toBe(
      "https://cdn.example.hostingersite.com/media/media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp",
    );
  });

  it("leaves already-nested URLs alone", () => {
    const nested =
      "https://cdn.example.hostingersite.com/media/media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp";
    expect(toNestedHostingerMediaUrl(nested)).toBe(nested);
  });

  it("rewrites img src inside HTML", () => {
    const html =
      '<p><img src="https://x.hostingersite.com/media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp" alt="a" /></p>';
    expect(rewriteHostingerMediaUrlsInHtml(html)).toContain(
      "/media/media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp",
    );
  });
});
