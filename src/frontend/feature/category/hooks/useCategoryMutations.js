import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "../api/categories.api";

function getErrorMessage(error) {
  return (
    error?.data?.message ??
    error?.message ??
    "Category operation failed."
  );
}

export default function useCategoryMutations() {
  const [createRequest, createState] = useCreateCategoryMutation();
  const [updateRequest, updateState] = useUpdateCategoryMutation();
  const [deleteRequest, deleteState] = useDeleteCategoryMutation();

  const createCategory = (data) => createRequest(data).unwrap();

  const updateCategory = (id, data) =>
    updateRequest({ id, data }).unwrap();

  const deleteCategory = (id) => deleteRequest(id).unwrap();

  const error =
    createState.error ??
    updateState.error ??
    deleteState.error;

  return {
    createCategory,
    updateCategory,
    deleteCategory,

    isCreating: createState.isLoading,
    isUpdating: updateState.isLoading,
    isDeleting: deleteState.isLoading,

    isMutating:
      createState.isLoading ||
      updateState.isLoading ||
      deleteState.isLoading,

    error: error ? getErrorMessage(error) : null,
  };
}