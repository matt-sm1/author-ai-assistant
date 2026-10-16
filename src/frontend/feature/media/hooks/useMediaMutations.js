"use client";

import { useRef, useState } from "react";

import {
  useUploadMediaMutation,
  useCreateUploadSessionMutation,
  useFinalizeUploadMutation,
  useAbortUploadMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,
} from "../api/media.api";
import { uploadFileToHostinger } from "../lib/hostinger-direct-upload";

// ============================================
// MEDIA MUTATIONS HOOK
// ============================================

export default function useMediaMutations() {
  const [uploadMediaMutation, uploadState] = useUploadMediaMutation();
  const [createSession] = useCreateUploadSessionMutation();
  const [finalizeUpload] = useFinalizeUploadMutation();
  const [abortUpload] = useAbortUploadMutation();
  const [updateMediaMutation, updateState] = useUpdateMediaMutation();
  const [deleteMediaMutation, deleteState] = useDeleteMediaMutation();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const abortRef = useRef(null);

  async function uploadMedia(file) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsDirectUploading(true);
    setUploadProgress(0);

    let mediaId = null;

    try {
      const session = await createSession({
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }).unwrap();

      mediaId = session.mediaId;

      const receipt = await uploadFileToHostinger({
        file,
        session,
        signal: controller.signal,
        onProgress: setUploadProgress,
      });

      const media = await finalizeUpload({
        mediaId,
        receipt,
      }).unwrap();

      setUploadProgress(1);
      return { data: media, success: true };
    } catch (error) {
      if (mediaId) {
        try {
          await abortUpload({ mediaId }).unwrap();
        } catch {
          /* ignore abort failures */
        }
      }

      throw error
    } finally {
      setIsDirectUploading(false);
      abortRef.current = null;
    }
  }

  function cancelUpload() {
    abortRef.current?.abort();
  }

  async function updateMedia(id, data) {
    return updateMediaMutation({ id, data }).unwrap();
  }

  async function deleteMedia(id) {
    return deleteMediaMutation(id).unwrap();
  }

  return {
    uploadMedia,
    cancelUpload,
    updateMedia,
    deleteMedia,
    uploadProgress,
    isUploading: isDirectUploading || uploadState.isLoading,
    isUpdating: updateState.isLoading,
    isDeleting: deleteState.isLoading,
    isMutating:
      isDirectUploading ||
      uploadState.isLoading ||
      updateState.isLoading ||
      deleteState.isLoading,
  };
}
