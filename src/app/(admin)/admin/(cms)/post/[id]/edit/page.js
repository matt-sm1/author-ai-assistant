"use client";

import { use } from "react";
import PostEditor from "@/frontend/feature/post/components/PostEditor";

export default function EditPostPage({ params }) {
  const { id } = use(params);

  return <PostEditor postId={id} />;
}