"use client";

import { Pencil, Trash2, Power } from "lucide-react";
import MediaImage from "@/frontend/components/ui/MediaImage";

import { Panel, StatusBadge } from "@/frontend/components/shared/ui-bits";
import DataTable from "@/frontend/components/shared/DataTable";
import { fmtDate } from "@/frontend/lib/format";

export default function AuthorsTable({
  authors = [],
  loading = false,
  isFetching = false,
  statusUpdating = false,
  onEdit,
  onDelete,
  onToggleActive,
  search,
  pagination,
}) {
  const columns = [
    {
      key: "avatar_url",
      header: "Photo",
      render: (author) => (
        <div className="relative h-10 w-10 overflow-hidden rounded-full border bg-muted">
          <span className="flex h-full w-full items-center justify-center font-semibold text-muted-foreground">
            {author.name?.trim()?.charAt(0)?.toUpperCase() || "A"}
          </span>
          {author.avatar_url && (
            <MediaImage
              src={author.avatar_url}
              alt={`${author.name} profile`}
              fill
              sizes="40px"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Author",
      truncate: true,
      maxWidth: 220,
      render: (author) => (
        <span className="font-medium">{author.name}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      truncate: true,
      maxWidth: 240,
      render: (author) => author.email || "—",
    },
    {
      key: "is_active",
      header: "Status",
      render: (author) => (
        <StatusBadge
          status={author.is_active ? "active" : "inactive"}
        />
      ),
    },
    {
      key: "updated_at",
      header: "Last Updated",
      render: (author) =>
        author.updated_at ? fmtDate(author.updated_at) : "—",
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (author) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          
          <button
            type="button"
            onClick={() => onToggleActive(author)}
            disabled={statusUpdating}
            title={author.is_active ? "Deactivate author" : "Activate author"}
            aria-label={
              author.is_active
                ? `Deactivate ${author.name}`
                : `Activate ${author.name}`
            }
            className={`rounded-md p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${author.is_active
                ? "text-destructive hover:bg-destructive/10"
                : "text-green-600 hover:bg-green-500/10"
              }`}
          >
            <Power className="h-4 w-4" />
          </button>



          <button
            type="button"
            onClick={() => onEdit(author)}
            title="Edit author"
            aria-label={`Edit ${author.name}`}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(author)}
            title="Delete author"
            aria-label={`Delete ${author.name}`}
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
          Loading authors...
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={authors}
          rowKey="id"
          search={search}
          pagination={pagination}
          isFetching={isFetching}
          emptyMessage="No authors found."
        />
      )}
    </Panel>
  );
}
