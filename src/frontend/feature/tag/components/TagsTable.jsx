"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Panel } from "@/frontend/components/shared/ui-bits";
import DataTable from "@/frontend/components/shared/DataTable";
import { fmtDate } from "@/frontend/lib/format";

export default function TagsTable({
  tags = [],
  loading = false,
  isFetching = false,
  onEdit,
  onDelete,
  search,
  pagination,
}) {
  const columns = [
    {
      key: "name",
      header: "Tag",
      truncate: true,
      maxWidth: 220,
      render: (tag) => (
        <span className="inline-flex max-w-full items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          # {tag.name}
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      truncate: true,
      maxWidth: 200,
      render: (tag) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          {tag.slug}
        </code>
      ),
    },
    {
      key: "postCount",
      header: "Posts",
      render: (tag) => tag.postCount ?? 0,
    },
    {
      key: "updated_at",
      header: "Last Updated",
      render: (tag) => (tag.updated_at ? fmtDate(tag.updated_at) : "—"),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (tag) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(tag)}
            title="Edit tag"
            aria-label={`Edit ${tag.name}`}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(tag)}
            title="Delete tag"
            aria-label={`Delete ${tag.name}`}
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
          Loading tags...
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={tags}
          rowKey="id"
          search={search}
          pagination={pagination}
          isFetching={isFetching}
          emptyMessage="No tags found."
        />
      )}
    </Panel>
  );
}
