import { MediaRepository } from "@/backend/repositories/media.repository";
import { MediaService } from "@/backend/services/media.service";
import { createStorageProvider } from "@/backend/adapters/storage/storage.factory";

// ============================================
// MEDIA SERVICE FACTORY
// ============================================

export function createMediaService() {
  const mediaRepository = new MediaRepository();
  const storageProvider = createStorageProvider();

  return new MediaService(mediaRepository, storageProvider);
}