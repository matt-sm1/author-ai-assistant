/**
 * Feature: Published-only visibility
 *
 * As a public reader
 * I should only see posts that are published and due
 * So that drafts and future schedules stay private
 */

import { describe, expect, it, vi } from "vitest";
import { PostRepository } from "@/backend/repositories/post.repository";
import { PostService } from "@/backend/services/post.service";

describe("Feature: Published-only visibility", () => {
  describe("Scenario: Repository SQL gates drafts and future dates", () => {
    it("Given findPublishedBySlug, Then SQL requires published + due published_at + slug", async () => {
      const query = vi.fn().mockResolvedValue({ rows: [] });
      const repo = new PostRepository({ query });

      await repo.findPublishedBySlug("my-post", { query });

      const [sql, params] = query.mock.calls[0];
      expect(sql).toMatch(/p\.status\s*=\s*'published'/i);
      expect(sql).toMatch(/p\.published_at\s+IS\s+NOT\s+NULL/i);
      expect(sql).toMatch(/p\.published_at\s*<=\s*NOW\(\)/i);
      expect(sql).toMatch(/p\.slug\s*=\s*\$1/i);
      expect(params).toEqual(["my-post"]);
    });

    it("Given findPublishedAll, Then SQL orders newest published first and pages", async () => {
      const query = vi.fn().mockResolvedValue({ rows: [{ id: "1" }] });
      const repo = new PostRepository({ query });

      const rows = await repo.findPublishedAll({ limit: 5, offset: 10 });

      const [sql, params] = query.mock.calls[0];
      expect(sql).toMatch(/status\s*=\s*'published'/i);
      expect(sql).toMatch(/published_at\s*<=\s*NOW\(\)/i);
      expect(sql).toMatch(/ORDER BY p\.published_at DESC/i);
      expect(sql).toMatch(/LIMIT \$/i);
      expect(sql).toMatch(/OFFSET \$/i);
      expect(params.at(-2)).toBe(5);
      expect(params.at(-1)).toBe(10);
      expect(rows).toHaveLength(1);
    });

    it("Given a search term, Then LIKE wildcards are escaped", async () => {
      const query = vi.fn().mockResolvedValue({ rows: [] });
      const repo = new PostRepository({ query });

      await repo.findPublishedAll({ limit: 10, offset: 0, search: "100%_off!" });

      const params = query.mock.calls[0][1];
      expect(params[0]).toBe("%100!%!_off!!%");
    });

    it("Given countPublished, Then the same publish gates apply", async () => {
      const query = vi.fn().mockResolvedValue({ rows: [{ total: 3 }] });
      const repo = new PostRepository({ query });

      const total = await repo.countPublished({ search: "ai" });

      const sql = query.mock.calls[0][0];
      expect(sql).toMatch(/COUNT\(\*\)/i);
      expect(sql).toMatch(/status\s*=\s*'published'/i);
      expect(sql).toMatch(/published_at\s*<=\s*NOW\(\)/i);
      expect(total).toBe(3);
    });
  });

  describe("Scenario: Service maps missing published posts to 404", () => {
    it("Given repository returns null, When getPublishedPostBySlug, Then AppError 404", async () => {
      const service = new PostService(
        { findPublishedBySlug: vi.fn().mockResolvedValue(null) },
        {},
        {},
        {}
      );

      await expect(service.getPublishedPostBySlug("draft-slug")).rejects.toMatchObject(
        { statusCode: 404, message: "Post not found" }
      );
    });

    it("Given a row exists, When getPublishedPostBySlug, Then the row is returned", async () => {
      const row = { id: "1", slug: "live", status: "published" };
      const service = new PostService(
        { findPublishedBySlug: vi.fn().mockResolvedValue(row) },
        {},
        {},
        {}
      );

      await expect(service.getPublishedPostBySlug("live")).resolves.toEqual(row);
    });

    it("Given page 3 limit 10, When listPublishedPosts, Then offset is 20", async () => {
      const findPublishedAll = vi.fn().mockResolvedValue([]);
      const countPublished = vi.fn().mockResolvedValue(25);
      const service = new PostService(
        { findPublishedAll, countPublished },
        {},
        {},
        {}
      );

      const result = await service.listPublishedPosts({
        page: 3,
        limit: 10,
        search: "books",
      });

      expect(findPublishedAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 20,
        search: "books",
      });
      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it("Given zero posts, When listPublishedPosts, Then totalPages is 0", async () => {
      const service = new PostService(
        {
          findPublishedAll: vi.fn().mockResolvedValue([]),
          countPublished: vi.fn().mockResolvedValue(0),
        },
        {},
        {},
        {}
      );

      const result = await service.listPublishedPosts({ page: 1, limit: 12 });
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
