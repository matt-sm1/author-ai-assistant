"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/frontend/components/shared/ui-bits";
import DataTable from "@/frontend/components/shared/DataTable";
import { fmtDate } from "@/frontend/lib/format";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/frontend/components/ui/Avatar";

export default function PostsTable({
  posts = [],
  loading = false,
  isFetching = false,
  onDelete,
  search,
  pagination,
}) {
  const columns = [
    {
      key: "title",
      header: "Title",
      truncate: true,
      maxWidth: 260,
      render: (post) => (
        <span className="font-medium">{post.title || "Untitled"}</span>
      ),
    },
    {
      key: "author",
      header: "Author",
      render: (post) =>
        post.author ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={post.author.avatarUrl || undefined}
                alt=""
              />
              <AvatarFallback>
                {post.author.name?.trim()?.charAt(0)?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{post.author.name}</span>
          </div>
        ) : (
          "—"
        ),
    },

    {
      key: "status",
      header: "Status",
      render: (post) => {
        const statusStyles = {
          draft: "bg-muted text-muted-foreground",
          published: "bg-green-500/10 text-green-600",
          scheduled: "bg-blue-500/10 text-blue-600",
        };

        const status = post.status || "draft";

        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status] || statusStyles.draft
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      key: "category_name",
      header: "Category",
      render: (post) => post.category_name || "—",
    },

    {
      key: "published_at",
      header: "Publish Date",
      render: (post) => (post.published_at ? fmtDate(post.published_at) : "—"),
    },
    {
      key: "updated_at",
      header: "Last Updated",
      render: (post) => (post.updated_at ? fmtDate(post.updated_at) : "—"),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (post) => (
        <div className="flex items-center justify-end gap-2">

          <Link
            href={`/admin/post/single-post/${encodeURIComponent(post.slug)}`}
            title="Preview post"
            aria-label={`Preview ${post.title || "post"}`}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Eye className="h-4 w-4" />
          </Link>


          <Link
            href={`/admin/post/${post.id}/edit`}
            title="Edit post"
            aria-label={`Edit ${post.title || "post"}`}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => onDelete?.(post)}
            title="Delete post"
            aria-label={`Delete ${post.title || "post"}`}
            className="rounded-md p-2 text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Panel>
      {loading ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          Loading posts...
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={posts}
          rowKey="id"
          search={search}
          pagination={pagination}
          isFetching={isFetching}
          emptyMessage="No posts found."
        />
      )}
    </Panel>
  );
}
