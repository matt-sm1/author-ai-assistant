import { describe, expect, it } from "vitest";
import { toPublicPost } from "@/backend/lib/to-public-post";

describe("toPublicPost", () => {
  it("returns null for nullish input", () => {
    expect(toPublicPost(null)).toBeNull();
    expect(toPublicPost(undefined)).toBeNull();
  });

  it("normalizes missing fields and author.avatar_url snake_case", () => {
    const result = toPublicPost({
      id: "1",
      author: { name: "A", avatar_url: "/x.png" },
      tags: null,
    });

    expect(result.title).toBe("");
    expect(result.slug).toBe("");
    expect(result.content).toBe("");
    expect(result.excerpt).toBe("");
    expect(result.featured_image).toBeNull();
    expect(result.author).toEqual({ name: "A", avatarUrl: "/x.png" });
    expect(result.tags).toEqual([]);
  });

  it("keeps only safe tag fields", () => {
    const result = toPublicPost({
      id: "1",
      tags: [{ id: "t", name: "N", slug: "n", created_at: "x" }],
    });

    expect(result.tags).toEqual([{ id: "t", name: "N", slug: "n" }]);
  });
});
