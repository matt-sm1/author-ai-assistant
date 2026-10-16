
"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { MEDIA_CONFIG } from "@/shared/constants/media.constants";

// ============================================
// MEDIA UPLOAD COMPONENT
// ============================================

export default function MediaUpload({
  onFileSelect,
  uploading = false,
  uploadProgress = 0,
  error = "",
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const acceptedTypes = [
    ...MEDIA_CONFIG.image.allowedMimeTypes,
    ...MEDIA_CONFIG.video.allowedMimeTypes,
  ].join(",");

  function handleFile(file) {
    if (uploading) return;

    if (!file) {
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  }

  function handleFileChange(event) {
    const files = event.target.files;

    if (files?.length === 1) {
      handleFile(files[0]);
    } else if (files?.length > 1) {
      handleFile(null);
    }

    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    if (uploading) return;

    const files = event.dataTransfer.files;

    if (files.length !== 1) {
      handleFile(null);
      return;
    }

    handleFile(files[0]);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!uploading) {
      setDragging(true);
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();

    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragging(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        disabled={uploading}
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-busy={uploading}
        className={[
          "flex flex-col items-center justify-center",
          "rounded-3xl border border-dashed px-6 py-10 text-center",
          "transition-colors",
          dragging
            ? "border-primary bg-accent"
            : "border-border bg-muted/40",
          uploading ? "opacity-70" : "",
        ].join(" ")}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
          <Upload className="h-5 w-5" />
        </div>

        <p className="text-sm">
          Drop a file here or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer font-medium text-primary hover:underline disabled:opacity-50"
          >
            browse
          </button>
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WebP, GIF, AVIF (Max 10 MB)
        </p>

        <p className="text-xs text-muted-foreground">
          MP4, WebM, MOV (Max 100 MB)
        </p>

        {uploading && (
          <div className="mt-4 w-full max-w-xs" role="status">
            <p className="mb-2 text-sm text-primary">
              Uploading media
              {uploadProgress > 0
                ? `… ${Math.round(uploadProgress * 100)}%`
                : "…"}
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{
                  width: `${Math.min(100, Math.round(uploadProgress * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
