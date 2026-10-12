"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ValidationError } from "yup";

import SearchInput from "@/frontend/components/ui/Search";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/frontend/components/ui/Pagination";

import {
  EmptyState,
  FilterTabs,
  PageHeader,
  Panel,
  ConfirmDialog,
} from "@/frontend/components/shared/ui-bits";

import MediaUpload from "@/frontend/feature/media/components/MediaUpload";
import MediaCard from "@/frontend/feature/media/components/MediaCard";
import MediaDetailsDialog from "@/frontend/feature/media/components/MediaDetailsDialog";

import useMedia from "@/frontend/feature/media/hooks/useMedia";
import useMediaMutations from "@/frontend/feature/media/hooks/useMediaMutations";

import {
  mediaUploadSchema,
  mediaMetadataSchema,
} from "@/frontend/feature/media/schema/media.schema";

// ============================================
// MEDIA VIEW
// ============================================

export default function MediaView() {
  // ============================================
  // STATES
  // ============================================

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [uploadError, setUploadError] = useState("");
  const [metadataErrors, setMetadataErrors] = useState({});

  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ============================================
  // MEDIA LISTING
  // ============================================

  const { media, pagination, isLoading, isFetching, error } = useMedia({
    page,
    limit: 20,
    search: query.trim(),
    resourceType: filter === "all" ? "" : filter,
  });

  // ============================================
  // MEDIA MUTATIONS
  // ============================================

  const {
    uploadMedia,
    updateMedia,
    deleteMedia,
    isUploading,
    isUpdating,
    isDeleting,
  } = useMediaMutations();

  // ============================================
  // UPLOAD MEDIA
  // ============================================

  async function handleFileSelect(file) {
    if (isUploading) return;

    if (!file) {
      setUploadError("Please select only one file.");
      return;
    }

    setUploadError("");

    try {
      await mediaUploadSchema.validate({ file }, { abortEarly: false });
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        setUploadError(validationError.errors[0] || "Invalid file.");
      } else {
        setUploadError("Unable to validate file.");
      }

      return;
    }

    try {
      const response = await uploadMedia(file);

      // Backend response: { success, message, data }
      const created = response?.data;

      toast.success("Media uploaded successfully");

      setPage(1);
      setUploadError("");

      // Open metadata dialog automatically.
      if (created?.id) {
        setMetadataErrors({});
        setSelectedItem(created);
      }
    } catch (uploadFailure) {
      const message =
        uploadFailure?.data?.message ||
        uploadFailure?.message ||
        "Failed to upload media.";

      setUploadError(message);
      toast.error(message);
    }
  }

  // ============================================
  // OPEN / CLOSE MEDIA DETAILS
  // ============================================

  function handleOpenDetails(item) {
    setMetadataErrors({});
    setSelectedItem(item);
  }

  function handleCloseDetails(open) {
    if (open || isUpdating || isDeleting || deleteTarget) {
      return;
    }

    setSelectedItem(null);
    setMetadataErrors({});
  }

  // ============================================
  // SAVE MEDIA METADATA
  // ============================================

  async function handleSaveMetadata(form) {
    if (!selectedItem || isUpdating) return;

    setMetadataErrors({});

    let validated;

    try {
      validated = await mediaMetadataSchema.validate(form, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        const errors = {};

        for (const issue of validationError.inner) {
          if (issue.path && !errors[issue.path]) {
            errors[issue.path] = issue.message;
          }
        }

        setMetadataErrors(errors);
      } else {
        toast.error("Unable to validate media details.");
      }

      return;
    }

    try {
      await updateMedia(selectedItem.id, validated);

      toast.success("Media details updated");

      setMetadataErrors({});
      setSelectedItem(null);
    } catch (updateFailure) {
      toast.error(
        updateFailure?.data?.message ||
          updateFailure?.message ||
          "Failed to update media.",
      );
    }
  }

  // ============================================
  // DELETE MEDIA
  // ============================================

  function handleRequestDelete(item) {
    if (isDeleting || isUpdating) return;

    setDeleteTarget(item);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || isDeleting) return;

    try {
      await deleteMedia(deleteTarget.id);

      toast.success("Media deleted successfully");

      setDeleteTarget(null);
      setSelectedItem(null);
      setMetadataErrors({});
    } catch (deleteFailure) {
      toast.error(
        deleteFailure?.data?.message ||
          deleteFailure?.message ||
          "Failed to delete media.",
      );
    }
  }

  // ============================================
  // FILTERS / SEARCH
  // ============================================

  const tabs = [
    {
      value: "all",
      label: "All",
    },
    {
      value: "image",
      label: "Images",
    },
    {
      value: "video",
      label: "Videos",
    },
  ];

  function handleFilterChange(value) {
    setFilter(value);
    setPage(1);
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title="Media Library"
        description="Upload and manage your images and videos."
      />

      {/* MEDIA UPLOAD */}
      <MediaUpload
        onFileSelect={handleFileSelect}
        uploading={isUploading}
        error={uploadError}
      />

      {/* MEDIA LIBRARY */}
      <Panel>
        <div className="p-10">
          {/* FILTERS + SEARCH */}
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs
              value={filter}
              onChange={handleFilterChange}
              options={tabs}
            />

            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search media..."
              debounceMs={400}
              className="w-full lg:max-w-sm"
            />
          </div>

          {/* MEDIA GRID */}
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading media...
            </div>
          ) : error ? (
            <EmptyState
              icon={ImageIcon}
              title="Unable to load media"
              text={error}
            />
          ) : media.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No media found"
              text={
                query
                  ? "Try a different search."
                  : "Upload an image or video to get started."
              }
            />
          ) : (
            <>
              {/* MEDIA CARDS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {media.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onClick={() => handleOpenDetails(item)}
                  />
                ))}
              </div>

              {/* PAGINATION */}
              {pagination?.totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-4 border-t pt-5 sm:flex-row">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </p>

                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          disabled={page <= 1 || isFetching}
                          onClick={() =>
                            setPage((previous) => Math.max(1, previous - 1))
                          }
                        />
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationLink isActive>{page}</PaginationLink>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationNext
                          disabled={page >= pagination.totalPages || isFetching}
                          onClick={() => setPage((previous) => previous + 1)}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </Panel>

      {/* MEDIA DETAILS DIALOG */}
      {selectedItem && (
        <MediaDetailsDialog
          key={selectedItem.id}
          item={selectedItem}
          open={true}
          onOpenChange={handleCloseDetails}
          onSave={handleSaveMetadata}
          onDelete={handleRequestDelete}
          saving={isUpdating}
          deleting={isDeleting}
          errors={metadataErrors}
        />
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
        title="Delete media?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.filename}"?`
            : ""
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
