"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/frontend/components/ui/Button";
import {
  ConfirmDialog,
  PageHeader,
} from "@/frontend/components/shared/ui-bits";

import AuthorsTable from "@/frontend/feature/author/components/AuthorsTable";
import AuthorFormDialog from "@/frontend/feature/author/components/AuthorFormDialog";

import useAuthors from "@/frontend/feature/author/hooks/useAuthors";
import useAuthorMutations from "@/frontend/feature/author/hooks/useAuthorMutations";
import useMediaMutations from "@/frontend/feature/media/hooks/useMediaMutations";

import {
  createAuthorSchema,
  updateAuthorSchema,
} from "@/frontend/feature/author/schema/author.schema";
import { MEDIA_CONFIG } from "@/shared/constants/media.constants";

const emptyAuthor = () => ({
  id: "",
  name: "",
  email: "",
  bio: "",
  avatar_media_id: null,
  avatar_url: "",
  is_active: true,
});

function getErrorMessage(error, fallback) {
  return error?.data?.message ?? error?.message ?? fallback;
}

function getValidationErrors(error) {
  const validationErrors = {};

  for (const item of error.inner ?? []) {
    if (item.path && !validationErrors[item.path]) {
      validationErrors[item.path] = item.message;
    }
  }

  if (error.path && !validationErrors[error.path]) {
    validationErrors[error.path] = error.message;
  }

  return validationErrors;
}

export default function AuthorsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const limit = 10;
  const savePending = useRef(false);
  const deletePending = useRef(false);
  const statusPending = useRef(false);

  const {
    authors,
    pagination,
    isLoading,
    isFetching,
    error,
  } = useAuthors({ page, limit, search });

  const {
    createAuthor,
    updateAuthor,
    deleteAuthor,
    isMutating,
  } = useAuthorMutations();

  const { uploadMedia, isUploading } = useMediaMutations();

  function handleAdd() {
    setErrors({});
    setEdit(emptyAuthor());
  }

  function handleEdit(author) {
    setErrors({});
    setEdit({
      id: author.id,
      name: author.name ?? "",
      email: author.email ?? "",
      bio: author.bio ?? "",
      avatar_media_id: author.avatar_media_id ?? null,
      avatar_url: author.avatar_url ?? "",
      is_active: author.is_active ?? true,
    });
  }

  function handleCloseForm() {
    if (savePending.current || isMutating || isUploading) return;

    setEdit(null);
    setErrors({});
  }

  function handleChange(field, value) {
    if (!edit) return;

    setEdit((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleAvatarFile(file) {
    if (!edit || isUploading) return;

    const imageConfig = MEDIA_CONFIG.image;

    if (!imageConfig.allowedMimeTypes.includes(file.type)) {
      toast.error("Choose a supported image file.");
      return;
    }

    if (file.size <= 0 || file.size > imageConfig.maxSize) {
      toast.error("Image must be between 1 byte and 10 MB.");
      return;
    }

    try {
      const response = await uploadMedia(file);
      const media = response?.data;
      const uploadedUrl = media?.url;
      const uploadedMediaId = media?.id;

      if (!uploadedUrl || !uploadedMediaId) {
        throw new Error(
          "Upload response must include the media ID and URL."
        );
      }

      setEdit((current) => ({
        ...current,
        avatar_url: uploadedUrl,
        avatar_media_id: uploadedMediaId,
      }));

      toast.success("Profile picture uploaded");
    } catch (uploadError) {
      toast.error(
        getErrorMessage(
          uploadError,
          "Failed to upload profile picture."
        )
      );
    }
  }

  async function handleSave() {
    if (!edit || savePending.current) return;

    savePending.current = true;
    setIsSaving(true);

    try {
      const isUpdate = Boolean(edit.id);
      const schema = isUpdate
        ? updateAuthorSchema
        : createAuthorSchema;

      const values = {
        name: edit.name,
        email: edit.email,
        bio: edit.bio,
        avatar_media_id: edit.avatar_media_id ?? null,
        avatar_url: edit.avatar_url || null,
        ...(isUpdate ? { is_active: edit.is_active } : {}),
      };

      const data = await schema.validate(values, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (isUpdate) {
        await updateAuthor(edit.id, data);
        toast.success("Author updated");
      } else {
        await createAuthor(data);
        setPage(1);
        toast.success("Author created");
      }

      setEdit(null);
      setErrors({});
    } catch (saveError) {
      if (saveError.name === "ValidationError") {
        setErrors(getValidationErrors(saveError));
      } else {
        toast.error(getErrorMessage(saveError, "Failed to save author."));
      }
    } finally {
      savePending.current = false;
      setIsSaving(false);
    }
  }

  async function handleToggleActive(author) {
    if (statusPending.current) return;

    statusPending.current = true;
    setIsStatusUpdating(true);

    const nextStatus = !author.is_active;

    try {
      await updateAuthor(author.id, { is_active: nextStatus });
      toast.success(
        nextStatus ? "Author activated" : "Author deactivated"
      );
    } catch (statusError) {
      toast.error(
        getErrorMessage(statusError, "Could not update author status.")
      );
    } finally {
      statusPending.current = false;
      setIsStatusUpdating(false);
    }
  }

  async function handleDelete() {
    if (!del || deletePending.current) return;

    deletePending.current = true;

    try {
      await deleteAuthor(del.id);

      if (page > 1 && authors.length === 1) {
        setPage(page - 1);
      }

      setDel(null);
      toast.success("Author deleted");
    } catch (deleteError) {
      toast.error(
        getErrorMessage(
          deleteError,
          "Could not delete this author. They may be assigned to posts."
        )
      );
    } finally {
      deletePending.current = false;
    }
  }

  return (
    <>
      <PageHeader
        title="Authors"
        description="Manage author profiles used by your blog."
        actions={
          <Button className="rounded-xl" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add Author
          </Button>
        }
      />

      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <AuthorsTable
        authors={authors}
        loading={isLoading}
        isFetching={isFetching}
        statusUpdating={isStatusUpdating}
        onEdit={handleEdit}
        onDelete={setDel}
        onToggleActive={handleToggleActive}
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search authors...",
          debounceMs: 400,
        }}
        pagination={{
          ...pagination,
          onPageChange: setPage,
        }}
      />

      <AuthorFormDialog
        edit={edit}
        saving={isSaving || isMutating}
        uploading={isUploading}
        errors={errors}
        onClose={handleCloseForm}
        onSave={handleSave}
        onChange={handleChange}
        onAvatarFile={handleAvatarFile}
      />

      <ConfirmDialog
        open={!!del}
        onOpenChange={(open) => {
          if (!open && !deletePending.current) {
            setDel(null);
          }
        }}
        title={`Delete "${del?.name}"?`}
        description="If this author is linked to posts, the server may reject deletion. You can deactivate the author instead."
        onConfirm={handleDelete}
      />
    </>
  );
}