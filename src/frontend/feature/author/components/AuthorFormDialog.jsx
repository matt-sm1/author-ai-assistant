"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import MediaImage from "@/frontend/components/ui/MediaImage";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/Dialog";
import { Button } from "@/frontend/components/ui/Button";
import { Input } from "@/frontend/components/ui/Input";
import { Label } from "@/frontend/components/ui/Label";
import { MEDIA_CONFIG } from "@/shared/constants/media.constants";

export default function AuthorFormDialog({
  edit,
  saving,
  uploading = false,
  errors = {},
  onClose,
  onSave,
  onChange,
  onAvatarFile,
}) {
  const fileInputRef = useRef(null);
  const avatarTypes = MEDIA_CONFIG.image.allowedMimeTypes.join(",");

  return (
    <Dialog
      open={!!edit}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {edit?.id ? "Edit author" : "Add author"}
          </DialogTitle>
        </DialogHeader>

        {edit && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="author-name">Name</Label>
              <Input
                id="author-name"
                className="mt-1.5"
                value={edit.name}
                aria-invalid={!!errors.name}
                onChange={(event) =>
                  onChange("name", event.target.value)
                }
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="author-email">Email (optional)</Label>
              <Input
                id="author-email"
                type="email"
                className="mt-1.5"
                value={edit.email}
                aria-invalid={!!errors.email}
                onChange={(event) =>
                  onChange("email", event.target.value)
                }
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="author-bio">Bio (optional)</Label>
              <textarea
                id="author-bio"
                rows={4}
                maxLength={5000}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={edit.bio}
                aria-invalid={!!errors.bio}
                onChange={(event) =>
                  onChange("bio", event.target.value)
                }
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.bio}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="author-avatar-url">
                Profile picture (optional)
              </Label>

              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-muted">
                  <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                    {edit.name?.trim()?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                  {edit.avatar_url && (
                    <MediaImage
                      src={edit.avatar_url}
                      alt={`${edit.name || "Author"} profile preview`}
                      fill
                      sizes="64px"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={avatarTypes}
                    className="hidden"
                    disabled={saving || uploading}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";

                      if (file) {
                        onAvatarFile(file);
                      }
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload from laptop"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Images only; maximum size is 10 MB.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="author-avatar-url">
                  Or paste an image URL
                </Label>
                <Input
                  id="author-avatar-url"
                  type="url"
                  className="mt-1.5"
                  value={edit.avatar_url}
                  aria-invalid={!!errors.avatar_url}
                  placeholder="https://example.com/profile.jpg"
                  onChange={(event) => {
                    onChange("avatar_url", event.target.value);
                    onChange("avatar_media_id", null);
                  }}
                />
                {errors.avatar_url && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.avatar_url}
                  </p>
                )}
              </div>
            </div>

            {edit.id && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(edit.is_active)}
                  disabled={saving || uploading}
                  onChange={(event) =>
                    onChange("is_active", event.target.checked)
                  }
                />
                Active author
              </label>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving || uploading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onSave}
            disabled={saving || uploading || !edit}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
