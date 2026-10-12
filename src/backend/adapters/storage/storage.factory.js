import { CloudinaryAdapter } from "./cloudinary.adapter";

// ============================================
// STORAGE PROVIDER FACTORY
// ============================================

export function createStorageProvider() {
  const provider = (
    process.env.STORAGE_PROVIDER || "cloudinary"
  ).toLowerCase();

  switch (provider) {
    case "cloudinary":
      return new CloudinaryAdapter();

    default:
      throw new Error(
        `Unsupported storage provider: ${provider}`
      );
  }
}