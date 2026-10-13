import "server-only";

import { cache } from "react";
import { createPostService } from "@/backend/factories/post.factory";

function mapPreviewPost(post) {
  return {
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    featured_image: post.featured_image,
    published_at: post.published_at,
    seo_title: post.seo_title,
    meta_description: post.meta_description,
    category_name: post.category_name,
    category_slug: post.category_slug,
    author: post.author
      ? {
          name: post.author.name,
          avatarUrl: post.author.avatarUrl,
        }
      : null,
    tags: Array.isArray(post.tags)
      ? post.tags.map(({ id, name, slug }) => ({ id, name, slug }))
      : [],
  };
}

export const getPreviewPostBySlug = cache(async (slug) => {
  if (typeof slug !== "string" || !slug.trim()) return null;

  const post = await createPostService().getPostBySlug(slug);

  if (!post || !["draft", "scheduled", "published"].includes(post.status)) {
    return null;
  }

  return mapPreviewPost(post);
});
