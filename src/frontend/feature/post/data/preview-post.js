import "server-only";

import { cache } from "react";
import { createPostService } from "@/backend/factories/post.factory";
import { mapDbPostToArticle } from "@/frontend/feature/post/lib/map-post-article";

const PREVIEW_STATUSES = new Set(["draft", "scheduled", "published"]);

export const getPreviewPostById = cache(async (id) => {
  if (typeof id !== "string" || !id.trim()) return null;

  try {
    const post = await createPostService().getPostById(id.trim());

    if (!post || !PREVIEW_STATUSES.has(post.status)) {
      return null;
    }

    return mapDbPostToArticle(post);
  } catch {
    return null;
  }
});
