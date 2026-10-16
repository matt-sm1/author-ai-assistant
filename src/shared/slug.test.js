import { describe, expect, it } from "vitest";
import { generateSlug } from "@/shared/slug";
import { slugify } from "@/frontend/lib/format";

describe("shared slug", () => {
  it("matches frontend slugify alias", () => {
    const samples = ["Hello World!", "café latte", "foo_bar", "A  B---C"];
    for (const sample of samples) {
      expect(slugify(sample)).toBe(generateSlug(sample));
    }
  });

  it("keeps unicode letters", () => {
    expect(generateSlug("café latte")).toBe("café-latte");
    expect(generateSlug("日本語 post")).toBe("日本語-post");
  });
});
