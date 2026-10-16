import { beforeEach, describe, expect, it, vi } from "vitest";

describe("preview-draft", () => {
  beforeEach(() => {
    vi.resetModules();
    const store = new Map();
    const sessionStorage = {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => {
        store.set(key, String(value));
      },
      removeItem: (key) => {
        store.delete(key);
      },
    };
    vi.stubGlobal("window", { sessionStorage });
    vi.stubGlobal("sessionStorage", sessionStorage);
  });

  it("round-trips an article draft", async () => {
    const {
      writePreviewDraft,
      readPreviewDraft,
      clearPreviewDraft,
    } = await import("@/frontend/feature/post/lib/preview-draft");

    writePreviewDraft({
      title: "T",
      slug: "t",
      content: "<p>x</p>",
      excerpt: "",
      featured_image: "",
      published_at: null,
      seo_title: "",
      meta_description: "",
      category_name: null,
      category_slug: null,
      author: null,
      tags: [],
    });

    const draft = readPreviewDraft();
    expect(draft?.title).toBe("T");
    expect(draft?.content).toBe("<p>x</p>");

    clearPreviewDraft();
    expect(readPreviewDraft()).toBeNull();
  });

  it("returns null for corrupt payloads", async () => {
    const { PREVIEW_DRAFT_KEY, readPreviewDraft } = await import(
      "@/frontend/feature/post/lib/preview-draft"
    );
    sessionStorage.setItem(PREVIEW_DRAFT_KEY, "{not-json");
    expect(readPreviewDraft()).toBeNull();
  });
});
