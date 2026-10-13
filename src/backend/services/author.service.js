import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

export class AuthorService {
  constructor(authorRepository) {
    this.authorRepository = authorRepository;
  }

  notFound() {
    return new AppError(
      "Author not found",
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

  handleDatabaseError(error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error?.code === "23505") {
      throw this.conflict("Author email already exists");
    }

    if (error?.code === "23503") {
      throw this.conflict(
        "Cannot delete an author assigned to one or more posts"
      );
    }

    throw error;
  }

  async createAuthor(authorData) {
    try {
      if (authorData.email) {
        const existing =
          await this.authorRepository.findByEmail(authorData.email);

        if (existing) {
          throw this.conflict("Author email already exists");
        }
      }

      return await this.authorRepository.create(authorData);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async getAuthors({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "created_at",
    sortOrder = "desc",
    activeOnly = false,
  } = {}) {
    const offset = (page - 1) * limit;
    const normalizedSearch = search.trim();

    const [authors, total] = await Promise.all([
      this.authorRepository.findAll({
        limit,
        offset,
        search: normalizedSearch,
        sortBy,
        sortOrder,
        activeOnly,
      }),
      this.authorRepository.countAll(normalizedSearch, activeOnly),
    ]);

    return {
      authors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuthorById(id) {
    const author = await this.authorRepository.findById(id);

    if (!author) {
      throw this.notFound();
    }

    return author;
  }

  async updateAuthor(id, updates) {
    try {
      const existing = await this.authorRepository.findById(id);

      if (!existing) {
        throw this.notFound();
      }

      const updatedValues = {
        name:
          updates.name === undefined
            ? existing.name
            : updates.name,
        email:
          updates.email === undefined
            ? existing.email
            : updates.email,
        bio:
          updates.bio === undefined
            ? existing.bio
            : updates.bio,
        avatar_media_id:
          updates.avatar_media_id === undefined
            ? existing.avatar_media_id
            : updates.avatar_media_id,

        avatar_url:
          updates.avatar_url === undefined
            ? existing.avatar_url
            : updates.avatar_url,

        is_active:
          updates.is_active === undefined
            ? existing.is_active
            : updates.is_active,
      };

      if (updatedValues.email) {
        const duplicate =
          await this.authorRepository.findByEmail(updatedValues.email);

        if (duplicate && duplicate.id !== id) {
          throw this.conflict("Author email already exists");
        }
      }

      const updated = await this.authorRepository.update(
        id,
        updatedValues
      );

      if (!updated) {
        throw this.notFound();
      }

      return updated;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deleteAuthor(id) {
    try {
      const existing = await this.authorRepository.findById(id);

      if (!existing) {
        throw this.notFound();
      }

      const postCount =
        await this.authorRepository.countPosts(id);

      if (postCount > 0) {
        throw this.conflict(
          "Cannot delete an author assigned to one or more posts"
        );
      }

      const deleted = await this.authorRepository.delete(id);

      if (!deleted) {
        throw this.notFound();
      }

      return true;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async deactivateAuthor(id) {
    return this.updateAuthor(id, { is_active: false });
  }
}