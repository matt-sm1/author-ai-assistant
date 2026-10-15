import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { generateSlug } from "@/backend/utils/slug.util";
import { assertCanDeleteTag } from "@/backend/policies/content.policies";

// ============================================
// TAG SERVICE
// ============================================

export class TagService {
  constructor(tagRepository) {
    this.tagRepository = tagRepository;
  }

  // ============================================
  // ERROR HELPERS
  // ============================================

  notFound() {
    return new AppError(
      "Tag not found",
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
    );
  }

  conflict(message) {
    return new AppError(message, HTTP_STATUS.CONFLICT, "CONFLICT");
  }

  badRequest(message) {
    return new AppError(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  // ============================================
  // CHECK DUPLICATE TAG
  // ============================================

  async checkDuplicate(name, slug, excludeId = null) {
    const [existingName, existingSlug] = await Promise.all([
      this.tagRepository.findByName(name),
      this.tagRepository.findBySlug(slug),
    ]);

    if (existingName && existingName.id !== excludeId) {
      throw this.conflict("Tag name already exists");
    }

    if (existingSlug && existingSlug.id !== excludeId) {
      throw this.conflict("Tag slug already exists");
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
      throw this.conflict("Tag name or slug already exists");
    }

    // PostgreSQL invalid UUID
    if (error.code === "22P02") {
      throw this.badRequest("Invalid tag ID");
    }

    throw error;
  }

  // ============================================
  // CREATE TAG
  // ============================================

  async createTag({ name }) {
    const slug = generateSlug(name);

    if (!slug) {
      throw this.badRequest("Tag name must contain valid characters");
    }

    try {
      await this.checkDuplicate(name, slug);

      return await this.tagRepository.create({
        name,
        slug,
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // GET TAGS WITH SEARCH + PAGINATION
  // ============================================

  async getTags({ page = 1, limit = 10, search = "" } = {}) {
    const offset = (page - 1) * limit;

    const [tags, total] = await Promise.all([
      this.tagRepository.findAll({
        limit,
        offset,
        search,
      }),
      this.tagRepository.countAll(search),
    ]);

    return {
      tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // GET TAG BY ID
  // ============================================

  async getTagById(id) {
    const tag = await this.tagRepository.findById(id);

    if (!tag) {
      throw this.notFound();
    }

    return tag;
  }

  // ============================================
  // UPDATE TAG
  // ============================================

  async updateTag(id, { name }) {
    try {
      const existing = await this.tagRepository.findById(id);

      if (!existing) {
        throw this.notFound();
      }

      // Preserve slug when the name is unchanged.
      const slug = existing.name === name ? existing.slug : generateSlug(name);

      if (!slug) {
        throw this.badRequest("Tag name must contain valid characters");
      }

      await this.checkDuplicate(name, slug, id);

      const updated = await this.tagRepository.update(id, {
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
  // DELETE TAG
  // ============================================

  async deleteTag(id, { force = false } = {}) {
    try {
      await this.getTagById(id);
      const postCount = await this.tagRepository.countPosts(id);
      assertCanDeleteTag(postCount, { force });

      const deleted = await this.tagRepository.delete(id);

      if (!deleted) {
        throw this.notFound();
      }

      return true;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // GET TAG POST COUNT
  // ============================================

  async getTagPostCount(id) {
    await this.getTagById(id);

    return this.tagRepository.countPosts(id);
  }
}
