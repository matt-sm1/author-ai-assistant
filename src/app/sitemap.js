import { createPostService } from "@/backend/factories/post.factory";
import { getPublicSiteUrl } from "@/frontend/feature/blog/lib/site-urls";

export default async function sitemap() {
  const base = getPublicSiteUrl() || "https://authoraiassistant.com/blogs";

  const entries = [
    {
      url: base,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const { posts } = await createPostService().listPublishedPosts({
      page: 1,
      limit: 100,
    });

    for (const post of posts) {
      entries.push({
        url: `${base}/${post.slug}`,
        lastModified: post.published_at || post.updated_at || undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // DB unavailable at build — listing entry alone is fine
  }

  return entries;
}
