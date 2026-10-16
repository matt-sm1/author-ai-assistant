import { notFound } from "next/navigation";

import PostArticle from "@/frontend/feature/post/components/PostArticle";
import { getPreviewPostById } from "@/frontend/feature/post/data/preview-post";

export default async function PostSavedPreviewPage({ params }) {
  const { id } = await params;
  const post = await getPreviewPostById(id);

  if (!post) notFound();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Saved preview</span>
        <span className="mx-2">·</span>
        Last saved version from the database
      </div>
      <PostArticle post={post} />
    </div>
  );
}
