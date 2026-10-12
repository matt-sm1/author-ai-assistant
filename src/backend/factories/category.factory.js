
import { CategoryRepository } from "@/backend/repositories/category.repository";
import { CategoryService } from "@/backend/services/category.service";

// ============================================
// CATEGORY SERVICE FACTORY
// ============================================

export function createCategoryService() {
  const categoryRepository = new CategoryRepository();

  return new CategoryService(categoryRepository);
}
