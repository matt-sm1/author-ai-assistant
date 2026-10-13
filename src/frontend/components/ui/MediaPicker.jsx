"use client";

import { useEffect, useReducer } from "react";
import Image from "next/image";

import { Button } from "@/frontend/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/Dialog";

import useMedia from "@/frontend/feature/media/hooks/useMedia";
import { EmptyState, FilterTabs } from "@/frontend/components/shared/ui-bits";

import { Image as ImageIcon, RefreshCw, Upload, Video } from "lucide-react";

const PAGE_SIZE = 10;

const MEDIA_FILTERS = [
  { label: "All", value: "" },
  { label: "Images", value: "image" },
  { label: "Videos", value: "video" },
];

const initialState = {
  resourceType: "",
  page: 1,
  loadedMedia: [],
};

function mediaPickerReducer(state, action) {
  switch (action.type) {
    case "filterChanged":
      return {
        resourceType: action.resourceType,
        page: 1,
        loadedMedia: [],
      };
    case "pageLoaded": {
      const items =
        action.page === 1
          ? action.media
          : [...state.loadedMedia, ...action.media];
      const uniqueItems = new Map();

      items.forEach((item) => {
        const key = item.id ?? item.url;
        if (key != null) uniqueItems.set(key, item);
      });

      return { ...state, loadedMedia: Array.from(uniqueItems.values()) };
    }
    case "loadMore":
      return { ...state, page: state.page + 1 };
    case "closed":
      return initialState;
    default:
      return state;
  }
}

export default function MediaPicker({
  open,
  onOpenChange,
  onSelect = () => { },
}) {
  const [state, dispatch] = useReducer(mediaPickerReducer, initialState);
  const { resourceType, page, loadedMedia } = state;

  const { media, pagination, isLoading, isFetching, error, refetch } = useMedia(
    {
      page,
      limit: PAGE_SIZE,
      resourceType,
    },
  );

  // Accumulate pages and remove duplicate items.
  useEffect(() => {
    if (isFetching || error) return;

    dispatch({ type: "pageLoaded", page, media });
  }, [media, page, isFetching, error]);

  const hasMore = page < pagination.totalPages;


  const handleSelect = (item) => {
    if (!["image", "video"].includes(item?.resource_type) || !item?.url) {
      return;
    }

    onSelect({
      id: item.id,
      url: item.url,
      resourceType: item.resource_type,
      thumbnailUrl: item.thumbnail_url ?? "",
    });

    onOpenChange(false);
  };


  const handleOpenChange = (nextOpen) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      dispatch({ type: "closed" });
    }
  };

  const handleFilterChange = (nextType) => {
    if (nextType === resourceType) return;

    dispatch({ type: "filterChanged", resourceType: nextType });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pr-8">
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FilterTabs
            value={resourceType}
            onChange={handleFilterChange}
            options={MEDIA_FILTERS}
          />

          {/* Media grid */}
          <div className="max-h-[50vh] overflow-y-auto">
            {isLoading && loadedMedia.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Loading media...
              </p>
            )}

            {error && (
              <div className="space-y-3 p-6 text-center">
                <p className="text-sm text-destructive">{error}</p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            )}

            {!error && loadedMedia.length > 0 && (
              <div className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-4">
                {loadedMedia.map((item) => {
                  const isVideo = item.resource_type === "video";
                  const canSelect =
                    ["image", "video"].includes(item.resource_type) &&
                    Boolean(item.url);

                  // Use Cloudinary's thumbnail URL for videos.
                  const previewUrl = isVideo
                    ? item.thumbnail_url
                    : item.thumbnail_url || item.url;

                  return (
                    <button
                      key={item.id ?? item.url}
                      type="button"
                      onClick={() => handleSelect(item)}
                      disabled={!canSelect}
                      aria-label={
                        isVideo
                          ? `Select ${item.filename || "video"}`
                          : `Select ${item.alt_text || item.filename || "image"}`
                      }
                      className="group relative overflow-hidden rounded-xl border transition hover:border-primary hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      {previewUrl ? (
                        <Image
                          src={previewUrl}
                          alt={
                            item.alt_text ||
                            item.filename ||
                            (isVideo ? "Video thumbnail" : "Image")
                          }
                          width={400}
                          height={300}
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="aspect-[4/3] w-full bg-muted object-contain"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                          {isVideo ? (
                            <Video aria-hidden="true" className="h-8 w-8" />
                          ) : (
                            <ImageIcon aria-hidden="true" className="h-8 w-8" />
                          )}

                          <span className="text-xs">
                            {isVideo
                              ? "Thumbnail unavailable"
                              : "Preview unavailable"}
                          </span>
                        </div>
                      )}

                      {/* Video thumbnail overlay */}
                      {isVideo && (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-white">
                          <Video aria-hidden="true" className="h-7 w-7" />

                          <span className="rounded bg-black/60 px-2 py-1 text-xs">
                            Video
                          </span>
                        </span>
                      )}

                      {/* Filename */}
                      <span className="block truncate px-2 py-1.5 text-left text-xs">
                        {item.filename || (isVideo ? "Video" : "Image")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty state */}

            {!isLoading &&
              !isFetching &&
              !error &&
              loadedMedia.length === 0 && (
                <EmptyState
                  icon={resourceType === "video" ? Video : ImageIcon}
                  title={`No ${resourceType === "video"
                      ? "videos"
                      : resourceType === "image"
                        ? "images"
                        : "media"
                    } found`}
                  text="Your media library doesn't contain any matching items."
                />
              )}

            {isFetching && loadedMedia.length > 0 && (
              <p className="py-3 text-center text-sm text-muted-foreground">
                Loading...
              </p>
            )}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                disabled={isFetching}
                onClick={() => dispatch({ type: "loadMore" })}
              >
                {isFetching ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}

          {/* Result count */}
          {loadedMedia.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Showing {loadedMedia.length} of {pagination.total} media items
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
