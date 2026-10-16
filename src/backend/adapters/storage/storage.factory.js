import { CloudinaryAdapter } from "./cloudinary.adapter";
import { HostingerAdapter } from "./hostinger.adapter";

// ============================================
// STORAGE PROVIDER FACTORY
// ============================================

export function createStorageProvider() {
  const provider = (
    process.env.STORAGE_PROVIDER || "hostinger"
  ).toLowerCase();

  switch (provider) {
    case "hostinger":
      return new HostingerAdapter();

    case "cloudinary":
      return new CloudinaryAdapter();

    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
}

export function getStorageProviderName() {
  return (process.env.STORAGE_PROVIDER || "hostinger").toLowerCase();
}
