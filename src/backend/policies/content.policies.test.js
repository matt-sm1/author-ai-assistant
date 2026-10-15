import { describe, expect, it } from "vitest";
import { AppError } from "@/backend/errors/app-error";
import {
  assertCanDeleteReferenced,
  assertCanDeleteTag,
  applyPublishingPolicy,
  assertFeaturedMediaAllowed,
} from "@/backend/policies/content.policies";

describe("assertCanDeleteReferenced", () => {
  it("allows delete when no posts reference the resource", () => {
    expect(() => assertCanDeleteReferenced("a category", 0)).not.toThrow();
  });

  it("blocks delete when posts still reference the resource", () => {
    expect(() => assertCanDeleteReferenced("a category", 2)).toThrow(AppError);
    try {
      assertCanDeleteReferenced("an author", 1);
    } catch (error) {
      expect(error.statusCode).toBe(409);
      expect(error.message).toMatch(/author/i);
    }
  });
});

describe("assertCanDeleteTag", () => {
  it("blocks used tags without force", () => {
    expect(() => assertCanDeleteTag(3, { force: false })).toThrow(AppError);
  });

  it("allows used tags with force=true", () => {
    expect(() => assertCanDeleteTag(3, { force: true })).not.toThrow();
  });

  it("allows unused tags", () => {
    expect(() => assertCanDeleteTag(0)).not.toThrow();
  });
});

describe("applyPublishingPolicy", () => {
  const hasContent = (html) => Boolean(html && html.replace(/<[^>]*>/g, "").trim());

  it("requires content for published posts", () => {
    const data = { status: "published", content: "<p></p>" };
    expect(() => applyPublishingPolicy(data, { hasContent })).toThrow(AppError);
  });

  it("coerces published + future publishedAt to scheduled", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const data = {
      status: "published",
      content: "<p>Hello</p>",
      publishedAt: future,
    };
    applyPublishingPolicy(data, { hasContent });
    expect(data.status).toBe("scheduled");
  });

  it("requires future publishedAt for scheduled posts", () => {
    const data = {
      status: "scheduled",
      content: "<p>Hello</p>",
      publishedAt: new Date(Date.now() - 1000).toISOString(),
    };
    expect(() => applyPublishingPolicy(data, { hasContent })).toThrow(/future/i);
  });

  it("requires publishedAt for scheduled posts", () => {
    const data = { status: "scheduled", content: "<p>Hello</p>" };
    expect(() => applyPublishingPolicy(data, { hasContent })).toThrow(
      /publishedAt/i
    );
  });
});

describe("assertFeaturedMediaAllowed", () => {
  it("allows null/empty featured media", () => {
    expect(() => assertFeaturedMediaAllowed(null, false)).not.toThrow();
    expect(() => assertFeaturedMediaAllowed("", false)).not.toThrow();
  });

  it("rejects missing media UUID", () => {
    expect(() =>
      assertFeaturedMediaAllowed("11111111-1111-1111-1111-111111111111", false)
    ).toThrow(AppError);
  });

  it("allows existing media UUID", () => {
    expect(() =>
      assertFeaturedMediaAllowed("11111111-1111-1111-1111-111111111111", true)
    ).not.toThrow();
  });
});
