import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/factories/post.factory", () => ({
  createPostService: vi.fn(),
}));

vi.mock("@/backend/errors/error-handler", () => ({
  handleError: vi.fn((error) =>
    Response.json(
      { success: false, message: error?.message ?? "error" },
      { status: 500 },
    ),
  ),
}));

import { createPostService } from "@/backend/factories/post.factory";
import { publishScheduledPostsController } from "@/backend/controllers/cron.controller";

describe("publishScheduledPostsController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret-value";
  });

  function requestWithAuth(secret) {
    return new Request("https://example.com/api/cron/publish-scheduled", {
      method: "GET",
      headers: secret
        ? { authorization: `Bearer ${secret}` }
        : undefined,
    });
  }

  it("returns 401 without a valid bearer secret", async () => {
    const response = await publishScheduledPostsController(requestWithAuth("wrong"));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("publishes due posts and returns ids", async () => {
    const published = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "hello",
        published_at: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];
    createPostService.mockReturnValue({
      publishScheduledPosts: vi.fn().mockResolvedValue(published),
    });

    const response = await publishScheduledPostsController(
      requestWithAuth("test-cron-secret-value"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.publishedCount).toBe(1);
    expect(body.published).toEqual([
      {
        id: published[0].id,
        slug: "hello",
        published_at: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });
});

