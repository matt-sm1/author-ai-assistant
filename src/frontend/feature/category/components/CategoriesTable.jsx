"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Panel } from "@/frontend/components/shared/ui-bits";
import DataTable from "@/frontend/components/shared/DataTable";
import { fmtDate } from "@/frontend/lib/format";

export default function CategoriesTable({
  categories = [],
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
      header: "Name",
      truncate: true,
      maxWidth: 220,
      render: (category) => (
        <span className="font-medium">{category.name}</span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      truncate: true,
      maxWidth: 200,
      render: (category) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          {category.slug}
        </code>
      ),
    },
    {
      key: "postCount",
      header: "Posts",
      render: (category) => category.postCount ?? 0,
    },
    {
      key: "updated_at",
      header: "Last Updated",
      render: (category) =>
        category.updated_at ? fmtDate(category.updated_at) : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (category) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(category)}
            title="Edit category"
            aria-label={`Edit ${category.name}`}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(category)}
            title="Delete category"
            aria-label={`Delete ${category.name}`}
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
          Loading categories...
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={categories}
          rowKey="id"
          search={search}
          pagination={pagination}
          isFetching={isFetching}
          emptyMessage="No categories found."
        />
      )}
    </Panel>
  );
}
