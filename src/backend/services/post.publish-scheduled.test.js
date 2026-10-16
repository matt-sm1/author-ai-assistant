import { describe, expect, it, vi } from "vitest";
import { PostService } from "@/backend/services/post.service";
import { PostRepository } from "@/backend/repositories/post.repository";

describe("PostService.publishScheduledPosts", () => {
  it("forwards repository results", async () => {
    const rows = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "due-post",
        published_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];
    const postRepository = {
      publishScheduledPosts: vi.fn().mockResolvedValue(rows),
    };
    const service = new PostService(postRepository, {}, {}, {});

    const result = await service.publishScheduledPosts();

    expect(postRepository.publishScheduledPosts).toHaveBeenCalledOnce();
    expect(result).toEqual(rows);
  });
});

describe("PostRepository.publishScheduledPosts", () => {
  it("updates due scheduled posts and bumps updated_at", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ id: "1", slug: "a", published_at: new Date() }],
    });
    const repo = new PostRepository({ query });

    const rows = await repo.publishScheduledPosts({ query });

    expect(query).toHaveBeenCalledOnce();
    const sql = query.mock.calls[0][0];
    expect(sql).toMatch(/status\s*=\s*'published'/i);
    expect(sql).toMatch(/updated_at\s*=\s*NOW\(\)/i);
    expect(sql).toMatch(/status\s*=\s*'scheduled'/i);
    expect(sql).toMatch(/published_at\s*<=\s*NOW\(\)/i);
    expect(rows).toHaveLength(1);
  });
});
