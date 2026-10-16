/**
 * Strip CMS-only fields from a post row for public JSON / SSR.
 */
export function toPublicPost(post) {
  if (!post) return null;

  return {
    id: post.id,
    title: post.title ?? "",
    slug: post.slug ?? "",
    content: post.content ?? "",
    excerpt: post.excerpt ?? "",
    featured_image: post.featured_image ?? null,
    published_at: post.published_at ?? null,
    seo_title: post.seo_title ?? null,
    meta_description: post.meta_description ?? null,
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
