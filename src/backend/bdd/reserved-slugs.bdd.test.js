/**
 * Feature: Reserved post slugs
 *
 * As the platform
 * I reject slugs that collide with app routes
 * So that /admin and /api are never shadowed by /[slug]
 */

import { describe, expect, it, vi } from "vitest";
import {
  generateSlug,
  isReservedSlug,
  RESERVED_SLUGS,
} from "@/shared/slug";
import { PostService } from "@/backend/services/post.service";

describe("Feature: Reserved post slugs", () => {
  describe("Scenario: Reserved segment detection", () => {
    it.each([...RESERVED_SLUGS])(
      "Given slug %s, Then it is reserved",
      (slug) => {
        expect(isReservedSlug(slug)).toBe(true);
        expect(isReservedSlug(slug.toUpperCase())).toBe(true);
      }
    );

    it("Given a normal article slug, Then it is allowed", () => {
      expect(isReservedSlug("how-ai-helps-authors")).toBe(false);
      expect(isReservedSlug(generateSlug("Latest Insights"))).toBe(false);
    });
  });

  describe("Scenario: Unique slug generation skips reserved bases", () => {
    it("Given title Admin, When getUniqueSlug, Then admin-2 is chosen", async () => {
      const findBySlug = vi.fn().mockResolvedValue(null);
      const service = new PostService({ findBySlug }, {}, {}, {});

      const slug = await service.getUniqueSlug("Admin", {});

      expect(slug).toBe("admin-2");
      expect(findBySlug).not.toHaveBeenCalledWith("admin", {});
      expect(findBySlug).toHaveBeenCalledWith("admin-2", {});
    });

    it("Given title API and admin-2 taken, When getUniqueSlug for Admin, Then admin-3", async () => {
      const findBySlug = vi.fn(async (slug) =>
        slug === "admin-2" ? { id: "other" } : null
      );
      const service = new PostService({ findBySlug }, {}, {}, {});

      const slug = await service.getUniqueSlug("Admin", {});

      expect(slug).toBe("admin-3");
    });

    it("Given title Hello World, When getUniqueSlug, Then hello-world without suffix", async () => {
      const findBySlug = vi.fn().mockResolvedValue(null);
      const service = new PostService({ findBySlug }, {}, {}, {});

      const slug = await service.getUniqueSlug("Hello World", {});

      expect(slug).toBe("hello-world");
      expect(findBySlug).toHaveBeenCalledWith("hello-world", {});
    });
  });
});
