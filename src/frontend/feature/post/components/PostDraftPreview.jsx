"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/frontend/components/ui/Button";
import PostArticle from "@/frontend/feature/post/components/PostArticle";
import {
  clearPreviewDraft,
  readPreviewDraft,
} from "@/frontend/feature/post/lib/preview-draft";

export default function PostDraftPreview() {
  const [draft, setDraft] = useState(undefined);

  useEffect(() => {
    setDraft(readPreviewDraft());
    return () => {
      /* keep draft for refresh; only clear via explicit action if needed */
    };
  }, []);

  if (draft === undefined) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading preview…</div>
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <h1 className="text-xl font-semibold">No draft to preview</h1>
        <p className="text-sm text-muted-foreground">
          Open Preview from the post editor to see the current unsaved content.
        </p>
        <Button asChild className="rounded-xl">
          <Link href="/admin/post">Back to posts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        <span className="font-medium">Draft preview — not saved</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-lg"
          onClick={() => {
            clearPreviewDraft();
            setDraft(null);
          }}
        >
          Clear draft
        </Button>
      </div>
      <PostArticle post={draft} />
    </div>
  );
}
