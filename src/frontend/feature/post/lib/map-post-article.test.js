import { describe, expect, it } from "vitest";
import {
  mapDbPostToArticle,
  mapEditorFormToArticle,
} from "@/frontend/feature/post/lib/map-post-article";

describe("map-post-article", () => {
  it("maps DB posts into PostArticle shape", () => {
    const article = mapDbPostToArticle({
      title: "Hello",
      slug: "hello",
      content: "<p>Hi</p>",
      excerpt: "ex",
      featured_image:
        "https://x.hostingersite.com/media/2026/10/01ARZ3NDEKTSV4RRFFQ69G5FAV.webp",
      published_at: "2026-01-01T00:00:00.000Z",
      category_name: "News",
      category_slug: "news",
      author: { name: "Ada", avatarUrl: "https://example.com/a.png" },
      tags: [{ id: "1", name: "t", slug: "t" }],
    });

    expect(article.title).toBe("Hello");
    expect(article.category_name).toBe("News");
    expect(article.author.name).toBe("Ada");
    expect(article.featured_image).toContain("/media/media/");
    expect(article.tags).toHaveLength(1);
  });

  it("maps editor form into PostArticle shape without DB", () => {
    const article = mapEditorFormToArticle(
      {
        title: "Draft",
        slug: "draft",
        content: "<p>Body</p>",
        excerpt: "",
        featuredImage: "",
        status: "draft",
        publishDate: "",
        seoTitle: "",
        metaDescription: "",
        tags: [{ id: "t1", name: "Tag", slug: "tag" }],
      },
      {
        categoryName: "Life",
        categorySlug: "life",
        author: { name: "Bob", avatarUrl: null },
      },
    );

    expect(article.title).toBe("Draft");
    expect(article.content).toContain("Body");
    expect(article.category_name).toBe("Life");
    expect(article.author.name).toBe("Bob");
    expect(article.published_at).toBeNull();
    expect(article.tags[0].name).toBe("Tag");
  });
});
