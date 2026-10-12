"use client";

import SearchInput from "@/frontend/components/ui/Search";
import { Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/frontend/components/ui/Pagination";

export default function DataTable({
  columns = [],
  rows = [],
  rowKey = "id",
  emptyMessage = "No results found.",
  search,
  pagination,
  isFetching = false,
}) {
  function renderCell(row, column) {
    const content = column.render ? column.render(row) : row[column.key];

    if (!column.truncate) return content;

    const text = row[column.key];

    return (
      <div
        className="block max-w-full truncate"
        style={{ maxWidth: column.maxWidth ?? 200 }}
        title={
          typeof text === "string" || typeof text === "number"
            ? String(text)
            : undefined
        }
      >
        {content}
      </div>
    );
  }

  const currentPage = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 0;
  const limit = pagination?.limit ?? 10;
  const total = pagination?.total ?? 0;

  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  function getPageNumbers() {
    const pages = [];

    for (let page = 1; page <= totalPages; page++) {
      if (
        page === 1 ||
        page === totalPages ||
        Math.abs(page - currentPage) <= 1
      ) {
        pages.push(page);
      }
    }

    return pages;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="overflow-hidden rounded-xl border">
      {search && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-b p-4">
          {isFetching && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </div>
          )}

          <SearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder ?? "Search..."}
            debounceMs={search.debounceMs ?? 400}
            className="w-full max-w-xs"
          />
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-medium ${
                    column.headerClassName || ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="p-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row[rowKey]}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 ${column.className || ""}`}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {start}-{end} of {total}
          </p>

          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={currentPage <= 1}
                  onClick={() => pagination.onPageChange?.(currentPage - 1)}
                />
              </PaginationItem>

              {pageNumbers.map((page, index) => (
                <PaginationItem key={page}>
                  {index > 0 && page - pageNumbers[index - 1] > 1 && (
                    <PaginationEllipsis />
                  )}

                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => pagination.onPageChange?.(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  disabled={totalPages === 0 || currentPage >= totalPages}
                  onClick={() => pagination.onPageChange?.(currentPage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
