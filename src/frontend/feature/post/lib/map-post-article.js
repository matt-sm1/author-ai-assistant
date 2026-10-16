import { karachiDateTimeToISO } from "@/frontend/lib/format";
import { toNestedHostingerMediaUrl } from "@/frontend/lib/hostinger-media-url";

/**
 * Canonical article shape consumed by PostArticle.
 */

export function mapDbPostToArticle(post) {
  if (!post) return null;

  return {
    title: post.title ?? "",
    slug: post.slug ?? "",
    content: post.content ?? "",
    excerpt: post.excerpt ?? "",
    featured_image:
      toNestedHostingerMediaUrl(post.featured_image ?? "") ||
      post.featured_image ||
      "",
    published_at: post.published_at ?? null,
    seo_title: post.seo_title ?? "",
    meta_description: post.meta_description ?? "",
    category_name: post.category_name ?? null,
    category_slug: post.category_slug ?? null,
    author: post.author
      ? {
          name: post.author.name ?? "",
          avatarUrl: post.author.avatarUrl ?? post.author.avatar_url ?? null,
        }
      : null,
    tags: Array.isArray(post.tags)
      ? post.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        }))
      : [],
  };
}

/**
 * @param {object} form - PostEditor formData
 * @param {object} extras
 * @param {string|null} [extras.categoryName]
 * @param {string|null} [extras.categorySlug]
 * @param {{ name?: string, avatarUrl?: string }|null} [extras.author]
 * @param {Array<{ id: string, name: string, slug?: string }>} [extras.tags]
 */
export function mapEditorFormToArticle(form, extras = {}) {
  if (!form || typeof form !== "object") return null;

  let publishedAt = null;
  if (form.status === "published" || form.status === "scheduled") {
    if (form.publishDate) {
      publishedAt =
        karachiDateTimeToISO(form.publishDate) || form.publishDate;
    } else if (form.status === "published") {
      publishedAt = new Date().toISOString();
    }
  }

  const tags = Array.isArray(extras.tags)
    ? extras.tags
    : Array.isArray(form.tags)
      ? form.tags
      : [];

  return {
    title: form.title ?? "",
    slug: form.slug ?? "",
    content: form.content ?? "",
    excerpt: form.excerpt ?? "",
    featured_image:
      toNestedHostingerMediaUrl(form.featuredImage ?? "") ||
      form.featuredImage ||
      "",
    published_at: publishedAt,
    seo_title: form.seoTitle ?? "",
    meta_description: form.metaDescription ?? "",
    category_name: extras.categoryName ?? null,
    category_slug: extras.categorySlug ?? null,
    author: extras.author
      ? {
          name: extras.author.name ?? "",
          avatarUrl: extras.author.avatarUrl ?? null,
        }
      : null,
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
  };
}
