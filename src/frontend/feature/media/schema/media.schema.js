
import * as yup from "yup";

import { MEDIA_CONFIG } from "@/shared/constants/media.constants";
// ============================================
// MEDIA FILE VALIDATION
// ============================================

const allowedMimeTypes = [
  ...MEDIA_CONFIG.image.allowedMimeTypes,
  ...MEDIA_CONFIG.video.allowedMimeTypes,
];

export const mediaUploadSchema = yup.object({
  file: yup
    .mixed()
    .required("Please select an image or video.")
    .test("file-type", "Unsupported file format.", (file) => {
      if (!file) return false;

      return (
        typeof File !== "undefined" &&
        file instanceof File &&
        allowedMimeTypes.includes(file.type)
      );
    })
    .test("file-size", "File exceeds the maximum allowed size.", (file) => {
      if (!file || !(file instanceof File)) return false;

      const config = file.type.startsWith("image/")
        ? MEDIA_CONFIG.image
        : MEDIA_CONFIG.video;

      return file.size > 0 && file.size <= config.maxSize;
    }),
});

// ============================================
// MEDIA METADATA VALIDATION
// ============================================

export const mediaMetadataSchema = yup.object({
  alt_text: yup
    .string()
    .trim()
    .max(255, "Alt text cannot exceed 255 characters."),

  caption: yup
    .string()
    .trim()
    .max(500, "Caption cannot exceed 500 characters."),

  description: yup
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters."),
});
