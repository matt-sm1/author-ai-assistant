
import {
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
} from "../api/media.api";

// ============================================
// MEDIA MUTATIONS HOOK
// ============================================

export default function useMediaMutations() {
  const [uploadMediaMutation, uploadState] =
    useUploadMediaMutation();

  const [updateMediaMutation, updateState] =
    useUpdateMediaMutation();

  const [deleteMediaMutation, deleteState] =
    useDeleteMediaMutation();

  // ============================================
  // UPLOAD MEDIA
  // ============================================

  async function uploadMedia(file) {
    const formData = new FormData();
    formData.append("file", file);

    return uploadMediaMutation(formData).unwrap();
  }

  // ============================================
  // UPDATE METADATA
  // ============================================

  async function updateMedia(id, data) {
    return updateMediaMutation({ id, data }).unwrap();
  }

  // ============================================
  // DELETE MEDIA
  // ============================================

  async function deleteMedia(id) {
    return deleteMediaMutation(id).unwrap();
  }

  return {
    uploadMedia,
    updateMedia,
    deleteMedia,

    isUploading: uploadState.isLoading,
    isUpdating: updateState.isLoading,
    isDeleting: deleteState.isLoading,

    isMutating:
      uploadState.isLoading ||
      updateState.isLoading ||
      deleteState.isLoading,
  };
}
