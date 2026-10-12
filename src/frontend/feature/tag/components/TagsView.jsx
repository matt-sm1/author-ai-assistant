"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/frontend/components/ui/Button";
import {
  ConfirmDialog,
  PageHeader,
} from "@/frontend/components/shared/ui-bits";

import TagsTable from "@/frontend/feature/tag/components/TagsTable";
import TagFormDialog from "@/frontend/feature/tag/components/TagFormDialog";

import useTags from "@/frontend/feature/tag/hooks/useTags";
import useTagMutations from "@/frontend/feature/tag/hooks/useTagMutations";

import { slugify } from "@/frontend/lib/format";
import { tagSchema } from "@/frontend/feature/tag/schema/tag.schema";

const createEmptyTag = () => ({
  id: "",
  name: "",
  slug: "",
});

function getErrorMessage(error, fallback) {
  return error?.data?.message ?? error?.message ?? fallback;
}

export default function TagsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { tags, pagination, isLoading, isFetching, error } = useTags({
    page,
    limit,
    search,
  });


  const { createTag, updateTag, deleteTag, isMutating } = useTagMutations();

  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const savePending = useRef(false);
  const deletePending = useRef(false);

  function handleAdd() {
    setErrors({});
    setEdit(createEmptyTag());
  }

  function handleEdit(tag) {
    setErrors({});
    setEdit({
      id: tag.id,
      name: tag.name ?? "",
      slug: tag.slug ?? "",
    });
  }

  function handleCloseForm() {
    if (savePending.current || isMutating) return;

    setEdit(null);
    setErrors({});
  }

  function handleChange(field, value) {
    if (!edit) return;

    setEdit((current) => ({
      ...current,
      [field]: value,
      ...(field === "name" ? { slug: slugify(value) } : {}),
    }));

    setErrors((current) => {
      const next = { ...current };
      delete next[field];

      if (field === "name") {
        delete next.slug;
      }

      return next;
    });
  }

  async function handleSave() {
    if (!edit || savePending.current) return;

    savePending.current = true;
    setIsSaving(true);

    try {
      const data = await tagSchema.validate(
        { name: edit.name },
        { abortEarly: false },
      );

      if (edit.id) {
        await updateTag(edit.id, data);
        toast.success("Tag updated");
      } else {
        await createTag(data);
        setPage(1);
        toast.success("Tag created");
      }

      setEdit(null);
      setErrors({});
    } catch (error) {
      if (error.name === "ValidationError") {
        const validationErrors = {};

        for (const item of error.inner) {
          if (item.path && !validationErrors[item.path]) {
            validationErrors[item.path] = item.message;
          }
        }

        setErrors(validationErrors);
      } else {
        toast.error(getErrorMessage(error, "Failed to save tag."));
      }
    } finally {
      savePending.current = false;
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!del || deletePending.current) return;

    deletePending.current = true;

    try {
      await deleteTag(del.id);

      if (page > 1 && tags.length === 1) {
        setPage(page - 1);
      }

      setDel(null);
      toast.success("Tag deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete tag."));
    } finally {
      deletePending.current = false;
    }
  }

  return (
    <>
      <PageHeader
        title="Tags"
        description="Organize your posts with tags."
        actions={
          <Button className="rounded-xl" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add Tag
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <TagsTable
        tags={tags}
        loading={isLoading}
        isFetching={isFetching}
        onEdit={handleEdit}
        onDelete={setDel}
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search tags...",
          debounceMs: 400,
        }}
        pagination={{
          ...pagination,
          onPageChange: setPage,
        }}
      />

      <TagFormDialog
        edit={edit}
        saving={isSaving || isMutating}
        errors={errors}
        onClose={handleCloseForm}
        onSave={handleSave}
        onChange={handleChange}
      />

      <ConfirmDialog
        open={!!del}
        onOpenChange={(open) => {
          if (!open && !deletePending.current) {
            setDel(null);
          }
        }}
        title={`Delete "${del?.name}"?`}
        description="Posts using this tag will keep their content but lose this tag."
        onConfirm={handleDelete}
      />
    </>
  );
}
