import {
  useCreatePostMutation,
  useDeletePostMutation,
  useUpdatePostMutation,
} from "../api/posts.api";

function getErrorMessage(error) {
  return error?.data?.message ?? error?.message ?? "Post operation failed.";
}

export default function usePostMutations() {
  const [createRequest, createState] = useCreatePostMutation();
  const [updateRequest, updateState] = useUpdatePostMutation();
  const [deleteRequest, deleteState] = useDeletePostMutation();
  const error = createState.error ?? updateState.error ?? deleteState.error;

  return {
    createPost: (data) => createRequest(data).unwrap(),
    updatePost: (id, data) => updateRequest({ id, data }).unwrap(),
    deletePost: (id) => deleteRequest(id).unwrap(),
    isCreating: createState.isLoading,
    isUpdating: updateState.isLoading,
    isDeleting: deleteState.isLoading,
    isMutating: createState.isLoading || updateState.isLoading || deleteState.isLoading,
    error: error ? getErrorMessage(error) : null,
  };
}
