import { describe, expect, it, vi } from "vitest";
import { PostService } from "@/backend/services/post.service";
import { PostRepository } from "@/backend/repositories/post.repository";
import {
  PUBLIC_CACHE_CONTROL,
  jsonWithPublicCache,
} from "@/backend/lib/cache-headers";

describe("PostRepository published reads", () => {
  it("findPublishedBySlug requires published and due published_at", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const repo = new PostRepository({ query });

    await repo.findPublishedBySlug("hello", { query });

    const sql = query.mock.calls[0][0];
    expect(sql).toMatch(/status\s*=\s*'published'/i);
    expect(sql).toMatch(/published_at\s*<=\s*NOW\(\)/i);
    expect(sql).toMatch(/p\.slug\s*=\s*\$1/i);
  });

  it("findPublishedAll orders by published_at desc", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const repo = new PostRepository({ query });

    await repo.findPublishedAll({ limit: 10, offset: 0 });

    const sql = query.mock.calls[0][0];
    expect(sql).toMatch(/status\s*=\s*'published'/i);
    expect(sql).toMatch(/ORDER BY p\.published_at DESC/i);
  });
});

describe("PostService published reads", () => {
  it("getPublishedPostBySlug throws when missing", async () => {
    const postRepository = {
      findPublishedBySlug: vi.fn().mockResolvedValue(null),
    };
    const service = new PostService(postRepository, {}, {}, {});

    await expect(service.getPublishedPostBySlug("missing")).rejects.toMatchObject(
      { statusCode: 404 }
    );
  });

  it("listPublishedPosts forwards pagination", async () => {
    const posts = [{ id: "1", slug: "a", status: "published" }];
    const postRepository = {
      findPublishedAll: vi.fn().mockResolvedValue(posts),
      countPublished: vi.fn().mockResolvedValue(1),
    };
    const service = new PostService(postRepository, {}, {}, {});

    const result = await service.listPublishedPosts({ page: 1, limit: 12 });

    expect(postRepository.findPublishedAll).toHaveBeenCalledWith({
      limit: 12,
      offset: 0,
      search: "",
    });
    expect(result.posts).toEqual(posts);
    expect(result.pagination.total).toBe(1);
  });
});

describe("public cache headers", () => {
  it("jsonWithPublicCache sets public Cache-Control", async () => {
    const response = jsonWithPublicCache({ success: true, data: [] });
    expect(response.headers.get("Cache-Control")).toBe(PUBLIC_CACHE_CONTROL);
  });
});
