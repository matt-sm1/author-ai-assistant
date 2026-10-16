import { describe, expect, it, vi } from "vitest";
import { generateSlug, isReservedSlug } from "@/shared/slug";
import { slugify } from "@/frontend/lib/format";
import { PostService } from "@/backend/services/post.service";

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

  it("flags reserved route slugs", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("api")).toBe(true);
    expect(isReservedSlug("my-post")).toBe(false);
  });
});

describe("PostService.getUniqueSlug reserved", () => {
  it("skips reserved base slugs", async () => {
    const postRepository = {
      findBySlug: vi.fn().mockResolvedValue(null),
    };
    const service = new PostService(postRepository, {}, {}, {});

    const slug = await service.getUniqueSlug("Admin", {});

    expect(slug).toBe("admin-2");
    expect(postRepository.findBySlug).toHaveBeenCalledWith("admin-2", {});
  });
});
