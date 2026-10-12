
import { TagRepository } from "@/backend/repositories/tag.repository";
import { TagService } from "@/backend/services/tag.service";

// ============================================
// TAG SERVICE FACTORY
// ============================================

export function createTagService() {
  const tagRepository = new TagRepository();

  return new TagService(tagRepository);
}
