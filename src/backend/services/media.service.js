import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { validateMediaUpload } from "@/backend/validators/media-upload.validator";

// ============================================
// MEDIA SERVICE
// ============================================

export class MediaService {
  constructor(mediaRepository, storageProvider) {
    this.mediaRepository = mediaRepository;
    this.storageProvider = storageProvider;
  }

  // ============================================
  // ADD MEDIA THUMBNAIL
  // ============================================

  withThumbnail(media) {
    if (!media) return null;

    const currentProvider = (
      process.env.STORAGE_PROVIDER || "cloudinary"
    ).toLowerCase();

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

  // ============================================
  // ERROR HELPERS
  // ============================================

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

  // ============================================
  // UPLOAD MEDIA
  // ============================================

  async uploadMedia(fileBuffer, filename) {
    const validated = await validateMediaUpload(fileBuffer);

    const uploaded = await this.storageProvider.upload(fileBuffer, {
      folder: "blog-cms/media",
      resourceType: validated.resourceType,
    });

    try {
      return await this.mediaRepository.create({
        ...uploaded,
        filename,
        resource_type: validated.resourceType,
        mime_type: validated.mimeType,
        format: validated.format,
        size_bytes: validated.sizeBytes,
      });
    } catch (error) {
      // Clean up the uploaded asset if database insertion fails.
      try {
        await this.storageProvider.delete(
          uploaded.storage_key,
          uploaded.resource_type,
        );
      } catch (cleanupError) {
       
      }

      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // GET ALL MEDIA
  // ============================================

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

  // ============================================
  // GET MEDIA BY ID
  // ============================================

  async getMediaById(id) {
    try {
      const media = await this.mediaRepository.findById(id);

      if (!media) {
        throw this.notFound();
      }

      return this.withThumbnail(media);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // UPDATE MEDIA METADATA
  // ============================================

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

  // ============================================
  // DELETE MEDIA
  // ============================================


  async deleteMedia(id) {
    const media = await this.getMediaById(id);

    const providerName = (
      process.env.STORAGE_PROVIDER || "cloudinary"
    ).toLowerCase();

    if (media.storage_provider !== providerName) {
      throw this.badRequest(
        "Media belongs to a different storage provider",
      );
    }

    // First clear references and delete the database record.
    try {
      await this.mediaRepository.deleteWithReferencesCleared(id);
    } catch (error) {
      this.handleDatabaseError(error);
    }

    // Then delete the physical asset.
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
      this.handleDatabaseError(error);

    }

    return true;
  }


}
