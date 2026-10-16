/**
 * Feature: Public blog read API
 *
 * As a visitor or marketing site client
 * I want to list and fetch published posts without a session
 * So that the public blog never leaks drafts or scheduled content
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/factories/post.factory", () => ({
  createPostService: vi.fn(),
}));

import { createPostService } from "@/backend/factories/post.factory";
import {
  getPublishedPostBySlugController,
  listPublishedPostsController,
} from "@/backend/controllers/public-post.controller";
import { PUBLIC_CACHE_CONTROL } from "@/backend/lib/cache-headers";
import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

const SAMPLE_ROW = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "How AI Helps Authors",
  slug: "how-ai-helps-authors",
  content: "<p>Hello</p>",
  excerpt: "A short pitch",
  featured_image: "https://cdn.example.com/media/a.webp",
  published_at: "2026-09-28T00:00:00.000Z",
  seo_title: "AI for authors",
  meta_description: "Engage readers 24/7",
  category_name: "Insights",
  category_slug: "insights",
  status: "published",
  author_id: "secret-author-uuid",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  author: { id: "a1", name: "Maya Chen", avatarUrl: "/a.png", isActive: true },
  tags: [{ id: "t1", name: "AI", slug: "ai" }],
};

describe("Feature: Public blog read API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Scenario: Anonymous visitor lists published posts", () => {
    it("Given no Authorization header, When GET /api/public/posts, Then 200 with public cache", async () => {
      // Given
      createPostService.mockReturnValue({
        listPublishedPosts: vi.fn().mockResolvedValue({
          posts: [SAMPLE_ROW],
          pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
        }),
      });
      const request = new Request("http://localhost/api/public/posts");

      // When
      const response = await listPublishedPostsController(request);
      const body = await response.json();

      // Then
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(PUBLIC_CACHE_CONTROL);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
      });
    });

    it("Then CMS-only fields are stripped from each post", async () => {
      createPostService.mockReturnValue({
        listPublishedPosts: vi.fn().mockResolvedValue({
          posts: [SAMPLE_ROW],
          pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
        }),
      });

      const response = await listPublishedPostsController(
        new Request("http://localhost/api/public/posts")
      );
      const body = await response.json();
      const post = body.data[0];

      expect(post).toMatchObject({
        id: SAMPLE_ROW.id,
        title: SAMPLE_ROW.title,
        slug: SAMPLE_ROW.slug,
        content: SAMPLE_ROW.content,
        excerpt: SAMPLE_ROW.excerpt,
        featured_image: SAMPLE_ROW.featured_image,
        seo_title: SAMPLE_ROW.seo_title,
        meta_description: SAMPLE_ROW.meta_description,
        category_name: "Insights",
        category_slug: "insights",
        author: { name: "Maya Chen", avatarUrl: "/a.png" },
        tags: [{ id: "t1", name: "AI", slug: "ai" }],
      });
      expect(post).not.toHaveProperty("status");
      expect(post).not.toHaveProperty("author_id");
      expect(post).not.toHaveProperty("created_at");
      expect(post).not.toHaveProperty("updated_at");
      expect(post.author).not.toHaveProperty("id");
      expect(post.author).not.toHaveProperty("isActive");
    });
  });

  describe("Scenario: Visitor paginates and searches", () => {
    it("When page/limit/search are provided, Then they are forwarded to the service", async () => {
      const listPublishedPosts = vi.fn().mockResolvedValue({
        posts: [],
        pagination: { page: 2, limit: 6, total: 0, totalPages: 0 },
      });
      createPostService.mockReturnValue({ listPublishedPosts });

      await listPublishedPostsController(
        new Request(
          "http://localhost/api/public/posts?page=2&limit=6&search=reader"
        )
      );

      expect(listPublishedPosts).toHaveBeenCalledWith({
        page: 2,
        limit: 6,
        search: "reader",
      });
    });

    it("When pagination is invalid, Then 400 VALIDATION_ERROR", async () => {
      const listPublishedPosts = vi.fn();
      createPostService.mockReturnValue({ listPublishedPosts });

      const response = await listPublishedPostsController(
        new Request("http://localhost/api/public/posts?page=0&limit=12")
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(listPublishedPosts).not.toHaveBeenCalled();
    });

    it("When limit exceeds public max (50), Then 400", async () => {
      const listPublishedPosts = vi.fn();
      createPostService.mockReturnValue({ listPublishedPosts });

      const response = await listPublishedPostsController(
        new Request("http://localhost/api/public/posts?limit=51")
      );

      expect(response.status).toBe(400);
      expect(listPublishedPosts).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: Visitor opens a published article by slug", () => {
    it("Given a published post, When GET by slug, Then 200 with public cache", async () => {
      createPostService.mockReturnValue({
        getPublishedPostBySlug: vi.fn().mockResolvedValue(SAMPLE_ROW),
      });

      const response = await getPublishedPostBySlugController(
        new Request("http://localhost/api/public/posts/how-ai-helps-authors"),
        { params: Promise.resolve({ slug: "how-ai-helps-authors" }) }
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(PUBLIC_CACHE_CONTROL);
      expect(body.data.slug).toBe("how-ai-helps-authors");
      expect(body.data).not.toHaveProperty("status");
    });

    it("Given draft/missing/scheduled slug, When GET by slug, Then 404", async () => {
      createPostService.mockReturnValue({
        getPublishedPostBySlug: vi.fn().mockRejectedValue(
          new AppError("Post not found", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND)
        ),
      });

      const response = await getPublishedPostBySlugController(
        new Request("http://localhost/api/public/posts/secret-draft"),
        { params: Promise.resolve({ slug: "secret-draft" }) }
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe("Scenario: Empty catalog", () => {
    it("When there are no published posts, Then data is an empty array", async () => {
      createPostService.mockReturnValue({
        listPublishedPosts: vi.fn().mockResolvedValue({
          posts: [],
          pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
        }),
      });

      const response = await listPublishedPostsController(
        new Request("http://localhost/api/public/posts")
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
    });
  });
});
