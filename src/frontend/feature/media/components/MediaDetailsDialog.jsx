"use client";

import { useState } from "react";
import {
  AlignLeft,
  Calendar,
  Captions,
  Copy,
  FileImage,
  FileVideo,
  HardDrive,
  ImageIcon,
  Link2,
  Loader2,
  Save,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { toast } from "sonner";
import MediaImage from "@/frontend/components/ui/MediaImage";

import { Button } from "@/frontend/components/ui/Button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/Dialog";

import { Input } from "@/frontend/components/ui/Input";
import { Label } from "@/frontend/components/ui/Label";
import { Textarea } from "@/frontend/components/ui/Textarea";
import { fmtDate } from "@/frontend/lib/format";

function formatBytes(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* Small UI helpers (presentation only) */

function FieldLabel({ htmlFor, icon: Icon, children }) {
  return (
    <Label
      htmlFor={htmlFor}
      className="flex items-center gap-2 text-sm font-medium"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </Label>
  );
}

function FieldError({ message }) {
  if (!message) return null;

  return <p className="text-sm text-destructive">{message}</p>;
}

function MetaChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

export default function MediaDetailsDialog({
  item,
  open,
  onOpenChange,
  onSave,
  onDelete,
  saving = false,
  deleting = false,
  errors = {},
}) {
  // The parent should render this component with key={item.id}
  // so metadata resets when selecting another file.
  const [form, setForm] = useState(() => ({
    alt_text: item?.alt_text || "",
    caption: item?.caption || "",
    description: item?.description || "",
  }));

  if (!item) return null;

  const busy = saving || deleting;
  const isVideo = item.resource_type === "video";

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(item.url);
      toast.success("URL copied");
    } catch {
      toast.error("Could not copy URL");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* HEADER */}
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ImageIcon className="h-4 w-4" />
            </span>
            Media Details
          </DialogTitle>
        </DialogHeader>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* PREVIEW */}
          <div className="flex min-h-52 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
            {isVideo ? (
              <video
                src={item.url}
                poster={item.thumbnail_url || undefined}
                controls
                preload="none"
                className="max-h-80 w-full"
              />
            ) : (
              <MediaImage
                src={item.url}
                alt={form.alt_text || item.filename}
                width={640}
                height={320}
                sizes="(max-width: 768px) 100vw, 640px"
                priority
                className="max-h-80 w-full object-contain"
              />
            )}
          </div>

          {/* FILE INFORMATION */}
          <div className="space-y-2.5">
            <h3 className="break-all font-medium leading-snug">
              {item.filename}
            </h3>

            <div className="flex flex-wrap gap-2">
              <MetaChip icon={isVideo ? FileVideo : FileImage}>
                {isVideo ? "Video" : "Image"}
              </MetaChip>

              <MetaChip icon={HardDrive}>
                {formatBytes(item.size_bytes)}
              </MetaChip>

              <MetaChip icon={Calendar}>
                {fmtDate(item.created_at)}
              </MetaChip>
            </div>
          </div>

          {/* FILE URL */}
          <div className="space-y-2">
            <FieldLabel htmlFor="media-file-url" icon={Link2}>
              File URL
            </FieldLabel>

            <div className="flex gap-2">
              <Input
                id="media-file-url"
                value={item.url}
                readOnly
                className="bg-muted/40 font-mono text-xs"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                aria-label="Copy URL"
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ALT TEXT */}
          <div className="space-y-2">
            <FieldLabel htmlFor="media-alt" icon={Type}>
              Alt Text
            </FieldLabel>

            <Input
              id="media-alt"
              value={form.alt_text}
              onChange={(event) =>
                updateField("alt_text", event.target.value)
              }
              disabled={busy}
              placeholder="Describe the image"
            />

            <FieldError message={errors.alt_text} />
          </div>

          {/* CAPTION */}
          <div className="space-y-2">
            <FieldLabel htmlFor="media-caption" icon={Captions}>
              Caption
            </FieldLabel>

            <Input
              id="media-caption"
              value={form.caption}
              onChange={(event) =>
                updateField("caption", event.target.value)
              }
              disabled={busy}
              placeholder="Optional caption"
            />

            <FieldError message={errors.caption} />
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <FieldLabel htmlFor="media-description" icon={AlignLeft}>
              Description
            </FieldLabel>

            <Textarea
              id="media-description"
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              disabled={busy}
              placeholder="Optional description"
              className="min-h-24 resize-none"
            />

            <FieldError message={errors.description} />
          </div>
        </div>

        {/* ACTIONS (always visible, body scrolls above it) */}
        <DialogFooter className="flex-col gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => onDelete?.(item)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="button"
              disabled={busy}
              onClick={() => onSave?.(form)}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
