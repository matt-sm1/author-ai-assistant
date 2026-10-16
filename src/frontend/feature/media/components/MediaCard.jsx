"use client";

import { Calendar, Eye, FileImage, FileVideo, Play } from "lucide-react";

import MediaImage from "@/frontend/components/ui/MediaImage";
import { cn } from "@/frontend/lib/utils";
import { fmtDate } from "@/frontend/lib/format";

// ============================================
// MEDIA CARD
// ============================================

export default function MediaCard({ item, onClick, priority = false }) {
  const isVideo = item.resource_type === "video";

  const previewUrl = item.thumbnail_url || item.url;

  const TypeIcon = isVideo ? FileVideo : FileImage;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${item.filename}`}
      className={cn(
        "cursor-pointer group overflow-hidden rounded-xl border bg-card text-left",
        "transition-all hover:-translate-y-0.5 hover:shadow-lift",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

      )}
    >
      {/* MEDIA PREVIEW */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
        <MediaImage
          src={previewUrl}
          alt={item.alt_text || item.filename}
          fill
          className="object-contain"
          priority={priority}
        />

        {/* VIDEO PLAY BUTTON */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
              <Play className="h-5 w-5 fill-current" />
            </div>
          </div>
        )}

        {/* TYPE BADGE */}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm">
          <TypeIcon className="h-3 w-3" />
          {isVideo ? "Video" : "Image"}
        </span>

        {/* HOVER HINT */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
          {!isVideo && (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow">
              <Eye className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      {/* FILE INFORMATION */}
      <div className="space-y-1.5 p-3.5">
        <p className="truncate text-sm font-medium">
          {item.filename}
        </p>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium uppercase">
            {item.format || item.resource_type}
          </span>

          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {fmtDate(item.created_at)}
          </span>
        </div>
      </div>
    </button>
  );
}
