export const PREVIEW_DRAFT_KEY = "cms:post-preview-draft";
export const PREVIEW_DRAFT_VERSION = 1;

function isBrowser() {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

/**
 * @param {object} articlePost - PostArticle-shaped payload
 */
export function writePreviewDraft(articlePost) {
  if (!isBrowser()) {
    throw new Error("Preview draft requires a browser");
  }
  if (!articlePost || typeof articlePost !== "object") {
    throw new Error("Invalid preview draft");
  }

  const payload = {
    version: PREVIEW_DRAFT_VERSION,
    savedAt: Date.now(),
    post: articlePost,
  };

  sessionStorage.setItem(PREVIEW_DRAFT_KEY, JSON.stringify(payload));
  return payload;
}

export function readPreviewDraft() {
  if (!isBrowser()) return null;

  try {
    const raw = sessionStorage.getItem(PREVIEW_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== PREVIEW_DRAFT_VERSION) return null;
    if (!parsed.post || typeof parsed.post !== "object") return null;

    const post = parsed.post;
    return {
      title: typeof post.title === "string" ? post.title : "",
      slug: typeof post.slug === "string" ? post.slug : "",
      content: typeof post.content === "string" ? post.content : "",
      excerpt: typeof post.excerpt === "string" ? post.excerpt : "",
      featured_image:
        typeof post.featured_image === "string" ? post.featured_image : "",
      published_at: post.published_at ?? null,
      seo_title: typeof post.seo_title === "string" ? post.seo_title : "",
      meta_description:
        typeof post.meta_description === "string" ? post.meta_description : "",
      category_name: post.category_name ?? null,
      category_slug: post.category_slug ?? null,
      author: post.author ?? null,
      tags: Array.isArray(post.tags) ? post.tags : [],
    };
  } catch {
    return null;
  }
}

export function clearPreviewDraft() {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(PREVIEW_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
