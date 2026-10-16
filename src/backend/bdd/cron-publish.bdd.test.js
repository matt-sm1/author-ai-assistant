/**
 * Feature: Scheduled post publishing via cron
 *
 * As an ops scheduler (Vercel cron or external pinger)
 * I call GET or POST /api/cron/publish-scheduled with CRON_SECRET
 * So that due scheduled posts become published
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/factories/post.factory", () => ({
  createPostService: vi.fn(),
}));

vi.mock("@/backend/errors/error-handler", () => ({
  handleError: vi.fn((error) =>
    Response.json(
      { success: false, message: error?.message ?? "error" },
      { status: 500 }
    )
  ),
}));

import { createPostService } from "@/backend/factories/post.factory";
import { publishScheduledPostsController } from "@/backend/controllers/cron.controller";
import {
  GET as publishGet,
  POST as publishPost,
} from "@/app/api/cron/publish-scheduled/route";

describe("Feature: Scheduled post publishing via cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-bdd-secret";
  });

  function authed(method = "GET") {
    return new Request("https://app.example/api/cron/publish-scheduled", {
      method,
      headers: { authorization: "Bearer cron-bdd-secret" },
    });
  }

  describe("Scenario: Unauthorized callers are rejected", () => {
    it("Given missing bearer, When controller runs, Then 401", async () => {
      const response = await publishScheduledPostsController(
        new Request("https://app.example/api/cron/publish-scheduled")
      );
      expect(response.status).toBe(401);
    });

    it("Given wrong bearer, When controller runs, Then 401", async () => {
      const response = await publishScheduledPostsController(
        new Request("https://app.example/api/cron/publish-scheduled", {
          headers: { authorization: "Bearer nope" },
        })
      );
      expect(response.status).toBe(401);
    });

    it("Given empty CRON_SECRET env, When controller runs, Then 500", async () => {
      process.env.CRON_SECRET = "   ";
      const response = await publishScheduledPostsController(authed());
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toMatch(/not configured/i);
    });
  });

  describe("Scenario: Vercel Cron GET and external POST both publish", () => {
    it("Given due posts, When GET route, Then publishedCount and published[]", async () => {
      createPostService.mockReturnValue({
        publishScheduledPosts: vi.fn().mockResolvedValue([
          {
            id: "p1",
            slug: "due",
            published_at: new Date("2026-10-01T00:00:00.000Z"),
          },
        ]),
      });

      const response = await publishGet(authed("GET"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        publishedCount: 1,
        published: [
          {
            id: "p1",
            slug: "due",
            published_at: "2026-10-01T00:00:00.000Z",
          },
        ],
      });
    });

    it("Given no due posts, When POST route, Then publishedCount 0", async () => {
      createPostService.mockReturnValue({
        publishScheduledPosts: vi.fn().mockResolvedValue([]),
      });

      const response = await publishPost(authed("POST"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.publishedCount).toBe(0);
      expect(body.published).toEqual([]);
    });
  });
});
