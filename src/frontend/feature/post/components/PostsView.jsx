
"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/frontend/components/ui/Button";
import {
  ConfirmDialog,
  PageHeader,
} from "@/frontend/components/shared/ui-bits";

import PostsTable from "@/frontend/feature/post/components/PostsTable";
import usePostMutations from "@/frontend/feature/post/hooks/usePostmutations";
import { useGetPostsQuery } from "@/frontend/feature/post/api/posts.api";

function getErrorMessage(error, fallback) {
  return error?.data?.message ?? error?.message ?? fallback;
}

export default function PostsView() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [del, setDel] = useState(null);

  const deletePending = useRef(false);
  const limit = 10;

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useGetPostsQuery({
    page,
    limit,
    search: search.trim(),
  });

  const { deletePost, isDeleting } = usePostMutations();

  const posts = data?.posts ?? [];
  const pagination = data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 0,
  };

  function handleAdd() {
    router.push("/admin/post/new");
  }

  async function handleDelete() {
    if (!del || deletePending.current) return;

    deletePending.current = true;

    try {
      await deletePost(del.id);

      if (page > 1 && posts.length === 1) {
        setPage(page - 1);
      }

      setDel(null);
      toast.success("Post deleted successfully.");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to delete post."),
      );
    } finally {
      deletePending.current = false;
    }
  }

  return (
    <>
      <PageHeader
        title="Posts"
        description="Create, manage, and organize your blog posts."
        actions={
          <Button
            className="rounded-xl"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4" />
            Add Post
          </Button>
        }
      />

      {error && (
        <p className="mb-4 text-sm text-destructive">
          {getErrorMessage(error, "Failed to load posts.")}
        </p>
      )}

      <PostsTable
        posts={posts}
        loading={isLoading}
        isFetching={isFetching}
        onDelete={setDel}
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search posts...",
          debounceMs: 400,
        }}
        pagination={{
          ...pagination,
          page,
          onPageChange: setPage,
        }}
      />

      <ConfirmDialog
        open={!!del}
        onOpenChange={(open) => {
          if (!open && !deletePending.current) {
            setDel(null);
          }
        }}
        title={`Delete "${del?.title || "Untitled"}"?`}
        description="This action cannot be undone. The post will be permanently deleted."
        onConfirm={handleDelete}
      />
    </>
  );
}
