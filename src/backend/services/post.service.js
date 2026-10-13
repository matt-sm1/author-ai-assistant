import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { generateSlug } from "@/backend/utils/slug.util";

// ============================================
// POST SERVICE
// ============================================

const PUBLISHABLE_STATUSES = ["published", "scheduled"];

// <p></p> ya <p>&nbsp;</p> jaisa khali TinyMCE output bhi khali maana jaye.
// Media-only content (img/video/iframe) valid hai.
function hasContent(html) {
  if (!html) return false;
  if (/<(img|video|iframe)\b/i.test(html)) return true;

  const text = String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();

  return text.length > 0;
}

export class PostService {
  constructor(postRepository, tagRepository, authorRepository) {
    this.postRepository = postRepository;
    this.tagRepository = tagRepository;
    this.authorRepository = authorRepository;
  }

  // ============================================
  // ERROR HELPERS
  // ============================================

  notFound(message = "Post not found") {
    return new AppError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
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
  // GENERATE UNIQUE POST SLUG
  // ============================================

  async getUniqueSlug(title, db, excludeId = null) {
    const baseSlug = generateSlug(title);

    if (!baseSlug) {
      throw this.badRequest("Title must contain valid characters");
    }

    for (let attempt = 1; attempt <= 100; attempt++) {
      const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;

      const existing = await this.postRepository.findBySlug(slug, db);

      if (!existing || existing.id === excludeId) {
        return slug;
      }
    }

    throw this.conflict("Unable to generate a unique post slug");
  }

  // ============================================
  // VALIDATE CATEGORY
  // ============================================

  async validateCategory(categoryId, db) {
    if (!categoryId) return;

    const exists = await this.postRepository.categoryExists(categoryId, db);

    if (!exists) {
      throw this.badRequest("Category not found");
    }
  }

  async validateAuthor(authorId, db, { allowInactive = false } = {}) {
    if (!authorId) {
      throw this.badRequest("An author is required");
    }

    const author = await this.authorRepository.findById(authorId, db);

    if (!author) {
      throw this.badRequest("Author not found");
    }

    if (!author.is_active && !allowInactive) {
      throw this.badRequest("Inactive authors cannot be assigned to posts");
    }
  }

  // ============================================
  // PREPARE TAGS
  // ============================================

  prepareTags(tags = []) {
    const unique = new Map();

    for (const name of tags) {
      const slug = generateSlug(name);

      if (!slug) {
        throw this.badRequest("Tag must contain valid characters");
      }

      if (!unique.has(slug)) {
        unique.set(slug, {
          name,
          slug,
        });
      }
    }

    return [...unique.values()];
  }

  async resolveTagIds(preparedTags, db) {
    const tagIds = [];

    for (const { name, slug } of preparedTags) {
      const existingTag = await this.tagRepository.findByName(name, db);

      if (existingTag) {
        tagIds.push(existingTag.id);
        continue;
      }

      const createdTag = await this.tagRepository.create({ name, slug }, db);

      tagIds.push(createdTag.id);
    }

    return [...new Set(tagIds)];
  }

  // ============================================
  // VALIDATE PUBLISHING RULES
  // ============================================

  validatePublishing(data) {
    if (
      PUBLISHABLE_STATUSES.includes(data.status) &&
      !hasContent(data.content)
    ) {
      throw new AppError(
        "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        { content: "Content is required for published or scheduled posts" },
      );
    }

    if (data.status === "scheduled" && !data.publishedAt) {
      throw this.badRequest("Scheduled posts require publishedAt");
    }

    if (
      data.status === "scheduled" &&
      new Date(data.publishedAt).getTime() <= Date.now()
    ) {
      throw this.badRequest("Scheduled publish date must be in the future");
    }

    // Published status is stored by this service.
    // Automatic scheduled publishing requires
    // a separate scheduler/worker.
  }

  // ============================================
  // DATABASE CONFLICT HANDLING
  // ============================================

  handleDatabaseError(error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === "23503") {
      throw this.badRequest("Referenced category or author does not exist");
    }

    if (error.code === "23505") {
      throw this.conflict("A post or tag with this slug already exists");
    }

    if (error.code === "22P02") {
      throw this.badRequest("Invalid ID format");
    }

    throw error;
  }

  // ============================================
  // CREATE POST
  // ============================================

  async createPost(postData) {
    const { authorId, tags = [], ...data } = postData;

    this.validatePublishing(data);

    if (data.status === "published" && !data.publishedAt) {
      data.publishedAt = new Date();
    }

    const preparedTags = this.prepareTags(tags);

    try {
      return await this.postRepository.withTransaction(async (db) => {
        await this.validateAuthor(authorId, db);
        await this.validateCategory(data.categoryId, db);

        const slug = await this.getUniqueSlug(data.title, db);

        const post = await this.postRepository.create(
          {
            ...data,
            slug,
            authorId,
          },
          db,
        );

        const tagIds = await this.resolveTagIds(preparedTags, db);

        await this.postRepository.replaceTags(post.id, tagIds, db);

        return this.postRepository.findById(post.id, db);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // GET ALL POSTS
  // ============================================

  // Expects an already validated query object
  // (see validateListPostsQuery in post.validator.js).

  
async getPosts({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  categoryId = null,
  authorId = null,
  tagId = null,
  createdFrom = null,
  createdTo = null,
  publishedFrom = null,
  publishedTo = null,
  sortBy = "created_at",
  sortOrder = "desc",
} = {}) {
  const offset = (page - 1) * limit;

  const filters = {
    search,
    status,
    categoryId,
    authorId,
    tagId,
    createdFrom,
    createdTo,
    publishedFrom,
    publishedTo,
  };

  const [posts, total] = await Promise.all([
    this.postRepository.findAll({
      ...filters,
      limit,
      offset,
      sortBy,
      sortOrder,
    }),
    this.postRepository.count(filters),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}


  // ============================================
  // GET POST BY ID
  // ============================================

  async getPostById(id) {
    const post = await this.postRepository.findById(id);

    if (!post) {
      throw this.notFound();
    }

    return post;
  }

  async getPostBySlug(slug) {
    return this.postRepository.findBySlug(slug);
  }

  // ============================================
  // UPDATE POST
  // ============================================

  async updatePost(id, postData) {
    const { tags = [], ...data } = postData;

    this.validatePublishing(data);

    const preparedTags = this.prepareTags(tags);

    try {
      return await this.postRepository.withTransaction(async (db) => {
        const existing = await this.postRepository.findForUpdate(id, db);

        if (!existing) {
          throw this.notFound();
        }

        await this.validateAuthor(data.authorId, db, {
          allowInactive: existing.author_id === data.authorId,
        });

        if (data.status === "published" && !data.publishedAt) {
          // Pehle se published post ki tarikh preserve karo, warna ab ka waqt
          data.publishedAt =
            existing.status === "published"
              ? (existing.publishedAt ?? existing.published_at ?? new Date())
              : new Date();
        }

        await this.validateCategory(data.categoryId, db);

        let slug = existing.slug;

        if (data.title !== existing.title) {
          slug = await this.getUniqueSlug(data.title, db, id);
        }

        await this.postRepository.update(
          id,
          {
            ...data,
            slug,
          },
          db,
        );

        const tagIds = await this.resolveTagIds(preparedTags, db);

        await this.postRepository.replaceTags(id, tagIds, db);

        return this.postRepository.findById(id, db);
      });
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  // ============================================
  // PUBLISH DUE SCHEDULED POSTS
  // ============================================

  async publishScheduledPosts() {
    return this.postRepository.publishScheduledPosts();
  }

  // ============================================
  // DELETE POST
  // ============================================

  async deletePost(id) {
    try {
      const deleted = await this.postRepository.delete(id);

      if (!deleted) {
        throw this.notFound();
      }

      return true;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}