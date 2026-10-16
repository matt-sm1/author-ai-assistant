import BlogListing from "@/frontend/feature/blog/components/BlogListing";
import { createPostService } from "@/backend/factories/post.factory";
import { toPublicPost } from "@/backend/lib/to-public-post";

export const metadata = {
  title: "Articles | AuthorBot",
  description:
    "Latest insights for modern authors on AI, reader engagement, and book marketing.",
};

export const dynamic = "force-dynamic";

export default async function BlogHomePage() {
  const { posts } = await createPostService().listPublishedPosts({
    page: 1,
    limit: 24,
  });

  return <BlogListing posts={posts.map(toPublicPost)} />;
}
