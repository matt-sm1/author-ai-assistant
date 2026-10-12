import { v2 as cloudinary } from "cloudinary";

// ============================================
// CLOUDINARY STORAGE ADAPTER
// ============================================

export class CloudinaryAdapter {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  // ============================================
  // UPLOAD FILE
  // ============================================

  async upload(fileBuffer, options = {}) {
    const { folder = "blog-cms", resourceType = "auto" } = options;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      stream.end(fileBuffer);
    });

    return this.normalize(result);
  }

  // ============================================
  // UPLOAD FROM URL
  // ============================================

  async uploadFromUrl(url, options = {}) {
    const { folder = "blog-cms", resourceType = "auto" } = options;

    const result = await cloudinary.uploader.upload(url, {
      folder,
      resource_type: resourceType,
    });

    return this.normalize(result);
  }

  // ============================================
  // DELETE FILE
  // ============================================

  async delete(storageKey, resourceType = "image") {
    return cloudinary.uploader.destroy(storageKey, {
      resource_type: resourceType,
      invalidate: true,
    });
  }

  // ============================================
  // GET VIDEO THUMBNAIL URL
  // ============================================

  getThumbnailUrl(storageKey, resourceType) {
    if (resourceType === "image") {
      return cloudinary.url(storageKey, {
        secure: true,
        resource_type: "image",
      });
    }

    if (resourceType === "video") {
      return cloudinary.url(storageKey, {
        secure: true,
        resource_type: "video",
        format: "jpg",
        transformation: [
          {
            start_offset: "0",
            width: 400,
            height: 300,
            crop: "limit",
          },
        ],
      });
    }

    return null;
  }

  // ============================================
  // NORMALIZE CLOUDINARY RESPONSE
  // ============================================

  normalize(result) {
    return {
      storage_provider: "cloudinary",
      storage_key: result.public_id,
      provider_asset_id: result.asset_id,
      url: result.secure_url,
      resource_type: result.resource_type,
      format: result.format,
      size_bytes: result.bytes,
      width: result.width || null,
      height: result.height || null,
    };
  }
}
