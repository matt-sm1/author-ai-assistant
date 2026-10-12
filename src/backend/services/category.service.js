
import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { generateSlug } from "@/backend/utils/slug.util";
// ============================================
// CATEGORY SERVICE
// ============================================

export class CategoryService {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  // ============================================
  // ERROR HELPERS
  // ============================================

  notFound() {
    return new AppError(
      "Category not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
  }

  conflict(message) {
    return new AppError(
      message,
      HTTP_STATUS.CONFLICT,
      "CONFLICT"
    );
  }

  badRequest(message) {
    return new AppError(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // ============================================
  // CHECK DUPLICATE CATEGORY
  // ============================================

  async checkDuplicate(name, slug, excludeId = null) {
    const [existingName, existingSlug] = await Promise.all([
      this.categoryRepository.findByName(name),
      this.categoryRepository.findBySlug(slug),
    ]);

    if (existingName && existingName.id !== excludeId) {
      throw this.conflict(
        "Category name already exists"
      );
    }

    if (existingSlug && existingSlug.id !== excludeId) {
      throw this.conflict(
        "Category slug already exists"
      );
    }
  }

  // ============================================
  // HANDLE DATABASE ERRORS
  // ============================================

  handleDatabaseError(error) {
    if (error instanceof AppError) {
      throw error;
    }

    // PostgreSQL unique constraint violation
    if (error.code === "23505") {
      throw this.conflict(
        "Category name or slug already exists"
      );
    }

    // PostgreSQL invalid UUID
    if (error.code === "22P02") {
      throw this.badRequest("Invalid category ID");
    }

    throw error;
  }

  // ============================================
  // CREATE CATEGORY
  // ============================================

  async createCategory({ name }) {
    const slug = generateSlug(name);

    if (!slug) {
      throw this.badRequest(
        "Category name must contain valid characters"
      );
    }

    try {
      await this.checkDuplicate(name, slug);

      return await this.categoryRepository.create({
        name,
        slug,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // GET ALL CATEGORIES
  // ============================================

async getCategories({ page = 1, limit = 10, search = "" } = {}) {
  const offset = (page - 1) * limit;
  const normalizedSearch = search.trim();

  const [categories, total] = await Promise.all([
    this.categoryRepository.findAll({
      limit,
      offset,
      search: normalizedSearch,
    }),
    this.categoryRepository.countAll(normalizedSearch),
  ]);

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  // ============================================
  // GET CATEGORY BY ID
  // ============================================

  async getCategoryById(id) {
    const category =
      await this.categoryRepository.findById(id);

    if (!category) {
      throw this.notFound();
    }

    return category;
  }

  // ============================================
  // UPDATE CATEGORY
  // ============================================

  async updateCategory(id, { name }) {
    try {
      const existing =
        await this.categoryRepository.findById(id);

      if (!existing) {
        throw this.notFound();
      }

      // Preserve slug when category name is unchanged.
      const slug =
        existing.name === name
          ? existing.slug
          : generateSlug(name);

      if (!slug) {
        throw this.badRequest(
          "Category name must contain valid characters"
        );
      }

      await this.checkDuplicate(name, slug, id);

      const updated =
        await this.categoryRepository.update(id, {
          name,
          slug,
        });

      if (!updated) {
        throw this.notFound();
      }

      return updated;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // DELETE CATEGORY
  // ============================================

  async deleteCategory(id) {
    try {
      const deleted =
        await this.categoryRepository.delete(id);

      if (!deleted) {
        throw this.notFound();
      }

      return true;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // GET CATEGORY POST COUNT
  // ============================================

  async getCategoryPostCount(id) {
    await this.getCategoryById(id);

    return this.categoryRepository.countPosts(id);
  }
}
