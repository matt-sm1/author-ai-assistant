"use client";

import {
  useCreateAuthorMutation,
  useUpdateAuthorMutation,
  useDeleteAuthorMutation,
} from "@/frontend/feature/author/api/authors.api";

function getErrorMessage(error) {
  return (
    error?.data?.message ??
    error?.message ??
    "Author operation failed."
  );
}

export default function useAuthorMutations() {
  const [createRequest, createState] = useCreateAuthorMutation();
  const [updateRequest, updateState] = useUpdateAuthorMutation();
  const [deleteRequest, deleteState] = useDeleteAuthorMutation();

  const createAuthor = (data) => createRequest(data).unwrap();

  const updateAuthor = (id, data) =>
    updateRequest({ id, data }).unwrap();

  const deleteAuthor = (id) => deleteRequest(id).unwrap();

  const error =
    createState.error ??
    updateState.error ??
    deleteState.error;

  return {
    createAuthor,
    updateAuthor,
    deleteAuthor,

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