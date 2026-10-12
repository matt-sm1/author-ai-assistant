"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/frontend/components/ui/Button";
import {
  ConfirmDialog,
  PageHeader,
} from "@/frontend/components/shared/ui-bits";

import CategoriesTable from "@/frontend/feature/category/components/CategoriesTable";
import CategoryFormDialog from "@/frontend/feature/category/components/CategoryFormDialog";

import useCategories from "@/frontend/feature/category/hooks/useCategories";
import useCategoryMutations from "@/frontend/feature/category/hooks/useCategoryMutations";

import { slugify } from "@/frontend/lib/format";
import { categorySchema } from "@/frontend/feature/category/schema/category.schema";

const createEmptyCategory = () => ({
  id: "",
  name: "",
  slug: "",
});

function getErrorMessage(error, fallback) {
  return error?.data?.message ?? error?.message ?? fallback;
}

export default function CategoriesView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { categories, pagination, isLoading, isFetching, error } =
    useCategories({ page, limit, search });



  const { createCategory, updateCategory, deleteCategory, isMutating } =
    useCategoryMutations();

  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const savePending = useRef(false);
  const deletePending = useRef(false);

  function handleAdd() {
    setErrors({});
    setEdit(createEmptyCategory());
  }

  function handleEdit(category) {
    setErrors({});
    setEdit({
      id: category.id,
      name: category.name ?? "",
      slug: category.slug ?? "",
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
      const data = await categorySchema.validate(
        { name: edit.name },
        { abortEarly: false },
      );

      if (edit.id) {
        await updateCategory(edit.id, data);
        toast.success("Category updated");
      } else {
        await createCategory(data);
        setPage(1);
        toast.success("Category created");
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
        toast.error(getErrorMessage(error, "Failed to save category."));
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
    await deleteCategory(del.id);
    if (page > 1 && categories.length === 1) {
      setPage(page - 1);
    }

    setDel(null);
    toast.success("Category deleted");
  } catch (error) {
    toast.error(
      getErrorMessage(error, "Failed to delete category.")
    );
  } finally {
    deletePending.current = false;
  }
}

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group your posts by topic."
        actions={
          <Button className="rounded-xl" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <CategoriesTable
        categories={categories}
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
          placeholder: "Search categories...",
          debounceMs: 400,
        }}
        pagination={{
          ...pagination,
          onPageChange: setPage,
        }}
      />
      <CategoryFormDialog
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
        description="Posts in this category will keep their content but lose this category."
        onConfirm={handleDelete}
      />
    </>
  );
}
