
import { fileTypeFromBuffer } from "file-type";

import { MEDIA_CONFIG } from "@/backend/constants/media.constants";
import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

// ============================================
// MEDIA UPLOAD VALIDATOR
// ============================================

export async function validateMediaUpload(fileBuffer) {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new AppError(
      "Please select a valid file",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const detected = await fileTypeFromBuffer(fileBuffer);

  if (!detected) {
    throw new AppError(
      "Unsupported file format",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const resourceType = detected.mime.startsWith("image/")
    ? "image"
    : detected.mime.startsWith("video/")
      ? "video"
      : null;

  const config = resourceType
    ? MEDIA_CONFIG[resourceType]
    : null;

  if (!config || !config.allowedMimeTypes.includes(detected.mime)) {
    throw new AppError(
      "Only supported images and videos are allowed",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (fileBuffer.length > config.maxSize) {
    throw new AppError(
      `${resourceType === "image" ? "Image" : "Video"} exceeds the maximum allowed size`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  return {
    resourceType,
    mimeType: detected.mime,
    format: detected.ext,
    sizeBytes: fileBuffer.length,
  };
}
