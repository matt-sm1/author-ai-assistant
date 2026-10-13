import { notFound } from "next/navigation";

import PostArticle from "@/frontend/feature/post/components/PostArticle";
import { getPreviewPostBySlug } from "@/frontend/feature/post/data/preview-post";

export default async function SinglePostPage({ params }) {
  const { slug } = await params;
  const post = await getPreviewPostBySlug(slug);

  if (!post) notFound();

  return <PostArticle post={post} />;
}
