import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { getStorageProviderName } from "@/backend/adapters/storage/storage.factory";
import {
  buildMediaStorageKey,
  publicUrlForKey,
} from "@/backend/adapters/storage/storage-key";
import {
  issueUploadTicket,
  verifyUploadReceipt,
} from "@/backend/lib/media-ticket";
import {
  sanitizeFilename,
  validateDeclaredMedia,
} from "@/backend/lib/media-mime";

// ============================================
// MEDIA SERVICE
// ============================================

export class MediaService {
  constructor(mediaRepository, storageProvider) {
    this.mediaRepository = mediaRepository;
    this.storageProvider = storageProvider;
  }

  withThumbnail(media) {
    if (!media) return null;

    const currentProvider = getStorageProviderName();

    return {
      ...media,
      thumbnail_url:
        media.storage_provider === currentProvider
          ? this.storageProvider.getThumbnailUrl(
              media.storage_key,
              media.resource_type,
            )
          : null,
    };
  }

  notFound() {
    return new AppError(
      "Media not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
  }

  badRequest(message) {
    return new AppError(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  handleDatabaseError(error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === "22P02") {
      throw this.badRequest("Invalid media ID");
    }

    if (error.code === "23505") {
      throw this.badRequest("Media already exists");
    }

    throw error;
  }

  requireHostingerConfig() {
    const publicBase = process.env.HOSTINGER_PUBLIC_BASE_URL?.trim();
    const apiBase = process.env.HOSTINGER_MEDIA_API_BASE_URL?.trim();
    const secret = process.env.HOSTINGER_MEDIA_SIGNING_SECRET?.trim();

    if (!publicBase || !apiBase || !secret) {
      throw new AppError(
        "Hostinger media storage is not configured",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.STORAGE_PROVIDER_ERROR,
      );
    }

    return {
      publicBase: publicBase.replace(/\/+$/, ""),
      apiBase: apiBase.replace(/\/+$/, ""),
    };
  }

  /** Legacy multipart upload — disabled; use direct Hostinger sessions. */
  async uploadMedia() {
    throw this.badRequest(
      "Use the direct upload session flow for Hostinger storage",
    );
  }

  /**
   * Create pending media + HMAC ticket for Hostinger direct upload.
   */
  async createUploadSession({ filename, mimeType, sizeBytes }) {
    if (getStorageProviderName() !== "hostinger") {
      throw this.badRequest(
        "Upload sessions are only available for Hostinger storage",
      );
    }

    const { publicBase, apiBase } = this.requireHostingerConfig();
    const declared = validateDeclaredMedia({ mimeType, sizeBytes });

    if (!declared.ok) {
      throw this.badRequest(declared.message);
    }

    const storageKey = buildMediaStorageKey(declared.format);
    const url = publicUrlForKey(publicBase, storageKey);
    const ttlSec = Number(process.env.HOSTINGER_UPLOAD_TICKET_TTL_SEC || 900);
    const chunkSize = Number(
      process.env.HOSTINGER_CHUNK_SIZE_BYTES || 5 * 1024 * 1024,
    );
    const uploadExpiresAt = new Date(Date.now() + ttlSec * 1000);

    let media;
    try {
      media = await this.mediaRepository.create({
        storage_provider: "hostinger",
        storage_key: storageKey,
        provider_asset_id: null,
        url,
        filename: sanitizeFilename(filename),
        resource_type: declared.resourceType,
        mime_type: declared.mimeType,
        format: declared.format,
        size_bytes: declared.sizeBytes,
        status: "pending",
        upload_expires_at: uploadExpiresAt,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }

    const ticket = issueUploadTicket({
      mediaId: media.id,
      storageKey,
      maxBytes: declared.sizeBytes,
      mime: declared.mimeType,
      resourceType: declared.resourceType,
      ttlSec,
    });

    const useChunked = declared.sizeBytes > chunkSize;

    return {
      mediaId: media.id,
      storageKey,
      chunkSize,
      useChunked,
      ticket,
      endpoints: {
        upload: `${apiBase}/upload.php`,
        init: `${apiBase}/session_init.php`,
        chunk: `${apiBase}/chunk.php`,
        complete: `${apiBase}/complete.php`,
      },
      expiresAt: uploadExpiresAt.toISOString(),
    };
  }

  async finalizeUpload({ mediaId, receipt }) {
    if (getStorageProviderName() !== "hostinger") {
      throw this.badRequest("Finalize is only available for Hostinger storage");
    }

    const { publicBase } = this.requireHostingerConfig();

    let verified;
    try {
      verified = verifyUploadReceipt(receipt);
    } catch (error) {
      throw this.badRequest(error.message || "Invalid upload receipt");
    }

    if (verified.mediaId !== String(mediaId)) {
      throw this.badRequest("Receipt mediaId mismatch");
    }

    const existing = await this.mediaRepository.findById(mediaId);
    if (!existing) {
      throw this.notFound();
    }

    if (
      existing.status === "ready" &&
      existing.storage_key === verified.storageKey
    ) {
      return this.withThumbnail(existing);
    }

    if (existing.status !== "pending") {
      throw this.badRequest("Media is not awaiting finalize");
    }

    if (existing.storage_key !== verified.storageKey) {
      throw this.badRequest("Receipt storage key mismatch");
    }

    if (verified.bytes > existing.size_bytes) {
      throw this.badRequest("Uploaded file exceeds declared size");
    }

    const url = publicUrlForKey(publicBase, verified.storageKey);

    try {
      const finalized = await this.mediaRepository.finalizePending(mediaId, {
        url,
        size_bytes: verified.bytes,
        width: Number.isFinite(verified.width) ? verified.width : null,
        height: Number.isFinite(verified.height) ? verified.height : null,
        format: verified.format || existing.format,
        content_sha256: verified.sha256,
        storage_key: verified.storageKey,
      });

      if (!finalized) {
        const again = await this.mediaRepository.findById(mediaId);
        if (
          again?.status === "ready" &&
          again.storage_key === verified.storageKey
        ) {
          return this.withThumbnail(again);
        }
        throw this.badRequest("Unable to finalize media upload");
      }

      return this.withThumbnail(finalized);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async abortUpload(mediaId) {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw this.notFound();
    }

    if (media.status !== "pending") {
      throw this.badRequest("Only pending uploads can be aborted");
    }

    if (media.storage_provider === "hostinger") {
      try {
        await this.storageProvider.delete(media.storage_key);
      } catch {
        /* best-effort remote cleanup */
      }
    }

    const failed = await this.mediaRepository.markFailed(mediaId);
    return failed ?? media;
  }

  /**
   * Mark expired pending uploads failed and delete remote parts/files.
   */
  async sweepExpiredUploads({ limit = 50 } = {}) {
    const expired = await this.mediaRepository.findExpiredPending(limit);
    let cleaned = 0;

    for (const media of expired) {
      if (media.storage_provider === getStorageProviderName()) {
        try {
          await this.storageProvider.delete(media.storage_key);
        } catch {
          /* ignore */
        }
      }
      await this.mediaRepository.markFailed(media.id);
      cleaned += 1;
    }

    return { cleaned, examined: expired.length };
  }

  async getMedia({
    page = 1,
    limit = 10,
    search = "",
    resourceType = "",
  } = {}) {
    const offset = (page - 1) * limit;

    const [media, total] = await Promise.all([
      this.mediaRepository.findAll({
        limit,
        offset,
        search: search.trim(),
        resourceType,
      }),
      this.mediaRepository.countAll(search.trim(), resourceType),
    ]);

    return {
      media: media.map((item) => this.withThumbnail(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMediaById(id) {
    try {
      const media = await this.mediaRepository.findById(id);

      if (!media || media.status !== "ready") {
        throw this.notFound();
      }

      return this.withThumbnail(media);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async updateMedia(id, metadata) {
    try {
      const updated = await this.mediaRepository.update(id, metadata);

      if (!updated) {
        throw this.notFound();
      }

      return updated;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deleteMedia(id) {
    const media = await this.mediaRepository.findById(id);

    if (!media || (media.status !== "ready" && media.status !== "failed")) {
      throw this.notFound();
    }

    const providerName = getStorageProviderName();

    if (media.storage_provider !== providerName) {
      throw this.badRequest(
        "Media belongs to a different storage provider",
      );
    }

    try {
      const deletion = await this.storageProvider.delete(
        media.storage_key,
        media.resource_type,
      );

      if (
        deletion?.result !== "ok" &&
        deletion?.result !== "not found"
      ) {
        throw new AppError(
          "Failed to delete media from storage provider",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.STORAGE_PROVIDER_ERROR,
        );
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.handleDatabaseError(error);
    }

    try {
      await this.mediaRepository.deleteWithReferencesCleared(id);
    } catch (error) {
      if (error?.message === "Media not found") {
        throw this.notFound();
      }
      this.handleDatabaseError(error);
    }

    return true;
  }
}
