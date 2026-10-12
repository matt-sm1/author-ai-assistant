
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  FileCheck,
  FilePen,
  FileText,
  PenSquare,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/frontend/components/ui/Button";
import {
  ConfirmDialog,
  Panel,
  StatusBadge,
} from "@/frontend/components/shared/ui-bits";
import { useGetPostsQuery } from "@/frontend/feature/post/api/posts.api";
import  usePostMutations  from "@/frontend/feature/post/hooks/usePostmutations";
import { fmtDate, fmtNum } from "@/frontend/lib/format";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardView() {
  const router = useRouter();
  const [toDelete, setToDelete] = useState(null);

  const {
    data,
    isLoading: loading,
    error: postsError,
  } = useGetPostsQuery({ page: 1, limit: 100 });

  const { deletePost, isDeleting } = usePostMutations();

  const posts = data?.posts ?? [];
  const error =
    postsError?.data?.message ||
    postsError?.message ||
    "";

  async function handleDelete() {
    if (!toDelete) return;

    try {
      await deletePost(toDelete);
      setToDelete(null);
    } catch (err) {
      // RTK Query cache invalidation should refresh the posts list.
      console.error("Failed to delete post:", err);
    }
  }

  const stats = [
    {
      label: "Total Posts",
      value: posts.length,
      icon: FileText,
    },
    {
      label: "Published",
      value: posts.filter((p) => p.status === "published").length,
      icon: FileCheck,
    },
    {
      label: "Drafts",
      value: posts.filter((p) => p.status === "draft").length,
      icon: FilePen,
    },
    {
      label: "Scheduled",
      value: posts.filter((p) => p.status === "scheduled").length,
      icon: Eye,
    },
  ];

  const recentPosts = [...posts]
    .sort(
      (a, b) =>
        new Date(b.date ?? b.created_at) -
        new Date(a.date ?? a.created_at)
    )
    .slice(0, 5);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            suppressHydrationWarning
          >
            {greeting()}, Admin 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening with your blog today.
          </p>
        </div>

        <Button asChild className="rounded-xl shadow-lift">
          <Link href="/admin/post/new">
            <Plus className="h-4 w-4" /> New Post
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((st) => (
          <Panel
            key={st.label}
            className="p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {st.label}
              </span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary">
                <st.icon className="h-[18px] w-[18px]" />
              </div>
            </div>

            <div className="mt-3 text-3xl font-bold tracking-tight">
              {loading ? "–" : st.value}
            </div>

          </Panel>
        ))}
      </div>

      {/* <AnalyticsChart /> */}

      <Panel className="mt-6">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-semibold">Recent Posts</h2>
          <Link
            href="/admin/post"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">
            Loading posts...
          </p>
        ) : recentPosts.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-muted-foreground">
            No posts yet.
          </p>
        ) : (
          <div className="divide-y">
            {recentPosts.map((p) => (
              <div
                key={p.id}
                className="group flex items-center gap-4 px-5 py-3 transition hover:bg-muted/50"
              >
                <img
                  src={p.image || p.featured_image || ""}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className="line-clamp-1 text-sm font-semibold hover:text-primary"
                  >
                    {p.title}
                  </Link>

                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{p.author || "Admin"}</span>
                    ·
                    <span>
                      {typeof p.category === "string"
                        ? p.category
                        : p.category?.name || "Uncategorized"}
                    </span>
                    ·
                    <span>{fmtDate(p.date ?? p.created_at)}</span>
                    ·
                    <span>{fmtNum(p.views || 0)} views</span>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <StatusBadge status={p.status} />
                </div>

                <div className="flex gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push(`/admin/posts/${p.id}/edit`)}
                    aria-label="Edit"
                  >
                    <PenSquare className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setToDelete(p.id)}
                    aria-label="Delete"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && !isDeleting && setToDelete(null)}
        title="Delete this post?"
        description="This post will be permanently removed. This can't be undone."
        onConfirm={handleDelete}
      />
    </>
  );
}
