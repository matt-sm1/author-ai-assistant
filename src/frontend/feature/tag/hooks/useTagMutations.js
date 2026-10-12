import {
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from "../api/tags.api";

function getErrorMessage(error) {
  return (
    error?.data?.message ??
    error?.message ??
    "Tag operation failed."
  );
}

export default function useTagMutations() {
  const [createRequest, createState] = useCreateTagMutation();
  const [updateRequest, updateState] = useUpdateTagMutation();
  const [deleteRequest, deleteState] = useDeleteTagMutation();

  const createTag = (data) => createRequest(data).unwrap();

  const updateTag = (id, data) =>
    updateRequest({ id, data }).unwrap();

  const deleteTag = (id) => deleteRequest(id).unwrap();

  const error =
    createState.error ??
    updateState.error ??
    deleteState.error;

  return {
    createTag,
    updateTag,
    deleteTag,

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