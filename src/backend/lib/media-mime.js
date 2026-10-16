import { MEDIA_CONFIG } from "@/backend/constants/media.constants";

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/**
 * Validate client-declared mime/size before issuing an upload ticket.
 */
export function validateDeclaredMedia({ mimeType, sizeBytes }) {
  const mime = String(mimeType || "")
    .trim()
    .toLowerCase();
  const size = Number(sizeBytes);

  if (!Number.isSafeInteger(size) || size <= 0) {
    return { ok: false, message: "Invalid file size" };
  }

  let resourceType = null;
  if (MEDIA_CONFIG.image.allowedMimeTypes.includes(mime)) {
    resourceType = "image";
  } else if (MEDIA_CONFIG.video.allowedMimeTypes.includes(mime)) {
    resourceType = "video";
  }

  if (!resourceType) {
    return { ok: false, message: "Only supported images and videos are allowed" };
  }

  const config = MEDIA_CONFIG[resourceType];
  if (size > config.maxSize) {
    return {
      ok: false,
      message: `${resourceType === "image" ? "Image" : "Video"} exceeds the maximum allowed size`,
    };
  }

  const format = MIME_TO_EXT[mime];
  if (!format) {
    return { ok: false, message: "Unsupported file format" };
  }

  return {
    ok: true,
    resourceType,
    mimeType: mime,
    format,
    sizeBytes: size,
  };
}

export function sanitizeFilename(name) {
  const base = String(name || "file")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .trim()
    .slice(0, 180);
  return base || "file";
}
