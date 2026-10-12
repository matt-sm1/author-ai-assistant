"use client";

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

export default function CategoryFormDialog({
  edit,
  saving,
  errors = {},
  onClose,
  onSave,
  onChange,
}) {
  return (
    <Dialog
      open={!!edit}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {edit?.id ? "Edit category" : "Add category"}
          </DialogTitle>
        </DialogHeader>

        {edit && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                className="mt-1.5"
                value={edit.name}
                aria-invalid={!!errors.name}
                onChange={(e) =>
                  onChange("name", e.target.value)
                }
              />

              {errors.name && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                className="mt-1.5"
                value={edit.slug}
                readOnly
                aria-readonly="true"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Automatically generated from the category name.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button onClick={onSave} disabled={saving || !edit}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
