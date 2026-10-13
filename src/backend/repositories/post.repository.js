
import pool from "@/backend/lib/db";

// ============================================
// POST REPOSITORY
// ============================================

// Only whitelisted columns can be used for sorting.
const SORT_COLUMNS = {
  created_at: "p.created_at",
  updated_at: "p.updated_at",
  published_at: "p.published_at",
  title: "p.title",
  status: "p.status",
};

// Allowed fields for partial updates.
const UPDATE_COLUMNS = {
  title: "title",
  slug: "slug",
  content: "content",
  excerpt: "excerpt",
  featuredMediaId: "featured_media_id",
  featuredImage: "featured_image",
  status: "status",
  publishedAt: "published_at",
  categoryId: "category_id",
  authorId: "author_id",
  seoTitle: "seo_title",
  metaDescription: "meta_description",
};

// ============================================
// COMMON SELECT
// ============================================

const POST_SELECT = `
  SELECT
    p.*,
    c.name AS category_name,
    c.slug AS category_slug,
    CASE
      WHEN a.id IS NULL THEN NULL
      ELSE JSON_BUILD_OBJECT(
        'id', a.id,
        'name', a.name,
        'avatarUrl', a.avatar_url,
        'isActive', a.is_active
      )
    END AS author,
    COALESCE(
      (
        SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', t.id,
            'name', t.name,
            'slug', t.slug
          )
          ORDER BY t.name, t.id
        )
        FROM post_tags pt
        JOIN tags t ON t.id = pt.tag_id
        WHERE pt.post_id = p.id
      ),
      '[]'::json
    ) AS tags
  FROM posts p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN authors a ON a.id = p.author_id
`;

// ============================================
// QUERY HELPERS
// ============================================

function escapeLike(value) {
  return value.replace(/[!%_]/g, "!$&");
}

function buildFilters(filters = {}) {
  const conditions = [];
  const values = [];

  function add(sql, value) {
    values.push(value);
    const index = values.length;
    conditions.push(sql.replace("?", `$${index}`));
  }

  const search = filters.search?.trim();

  if (search) {
    values.push(`%${escapeLike(search)}%`);
    const index = values.length;

    conditions.push(`
      (
        p.title ILIKE $${index} ESCAPE '!'
        OR p.slug ILIKE $${index} ESCAPE '!'
        OR COALESCE(p.content, '') ILIKE $${index} ESCAPE '!'
      )
    `);
  }

  if (filters.status) {
    add("p.status = ?", filters.status);
  }

  if (filters.categoryId) {
    add("p.category_id = ?", filters.categoryId);
  }

  if (filters.authorId) {
    add("p.author_id = ?", filters.authorId);
  }

  if (filters.tagId) {
    add(
      `EXISTS (
        SELECT 1
        FROM post_tags pt_filter
        WHERE pt_filter.post_id = p.id
          AND pt_filter.tag_id = ?
      )`,
      filters.tagId
    );
  }

  if (filters.createdFrom) {
    add("p.created_at >= ?", filters.createdFrom);
  }

  if (filters.createdTo) {
    add("p.created_at <= ?", filters.createdTo);
  }

  if (filters.publishedFrom) {
    add("p.published_at >= ?", filters.publishedFrom);
  }

  if (filters.publishedTo) {
    add("p.published_at <= ?", filters.publishedTo);
  }

  return {
    where: conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "",
    values,
  };
}

function buildSort(sortBy = "created_at", sortOrder = "desc") {
  const column =
    SORT_COLUMNS[sortBy] || SORT_COLUMNS.created_at;

  const direction =
    String(sortOrder).toLowerCase() === "asc"
      ? "ASC"
      : "DESC";

  return `${column} ${direction} NULLS LAST, p.id DESC`;
}

// ============================================
// REPOSITORY
// ============================================

export class PostRepository {
  constructor(db = pool) {
    this.db = db;
  }

  // ============================================
  // TRANSACTION
  // ============================================

  async withTransaction(callback) {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      const result = await callback(client);

      await client.query("COMMIT");

      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
       
      }

      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================
  // FIND BY ID
  // ============================================

  async findById(id, db = this.db) {
    const result = await db.query(
      `
      ${POST_SELECT}
      WHERE p.id = $1
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // FIND BY SLUG
  // ============================================

  async findBySlug(slug, db = this.db) {
    const result = await db.query(
      `
      ${POST_SELECT}
      WHERE p.slug = $1
      `,
      [slug]
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // FIND FOR UPDATE
  // ============================================

  async findForUpdate(id, db) {
    const result = await db.query(
      `
      SELECT *
      FROM posts
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // GET ALL WITH FILTERS + PAGINATION
  // ============================================

  async findAll({
    limit = 20,
    offset = 0,
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
    const { where, values } = buildFilters({
      search,
      status,
      categoryId,
      authorId,
      tagId,
      createdFrom,
      createdTo,
      publishedFrom,
      publishedTo,
    });

    const orderBy = buildSort(sortBy, sortOrder);

    const limitIndex = values.length + 1;
    const offsetIndex = values.length + 2;

    const result = await this.db.query(
      `
      ${POST_SELECT}
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
      `,
      [...values, limit, offset]
    );

    return result.rows;
  }

  // ============================================
  // COUNT WITH SAME FILTERS
  // ============================================

  async count(filters = {}) {
    const { where, values } = buildFilters(filters);

    const result = await this.db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM posts p
      ${where}
      `,
      values
    );

    return result.rows[0]?.total ?? 0;
  }

  // ============================================
  // CATEGORY EXISTS
  // ============================================

  async categoryExists(categoryId, db = this.db) {
    const result = await db.query(
      `
      SELECT 1
      FROM categories
      WHERE id = $1
      LIMIT 1
      `,
      [categoryId]
    );

    return result.rowCount > 0;
  }

  // ============================================
  // FIND EXISTING TAG IDS
  // ============================================

  async findExistingTagIds(tagIds, db = this.db) {
    if (!Array.isArray(tagIds) || !tagIds.length) {
      return [];
    }

    const result = await db.query(
      `
      SELECT id
      FROM tags
      WHERE id = ANY($1::uuid[])
      `,
      [tagIds]
    );

    return result.rows.map((row) => row.id);
  }

  // ============================================
  // CREATE POST
  // ============================================

  
async create(data, db = this.db) {
  const {
    title,
    slug,
    content = null,
    excerpt = null,
    featuredMediaId = null,
    featuredImage = null,
    status = "draft",
    publishedAt = null,
    categoryId = null,
    authorId,
    seoTitle = null,
    metaDescription = null,
  } = data;

  const result = await db.query(
    `
    INSERT INTO posts (
      title,
      slug,
      content,
      excerpt,
      featured_media_id,
      featured_image,
      status,
      published_at,
      category_id,
      author_id,
      seo_title,
      meta_description
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12
    )
    RETURNING *
    `,
    [
      title,
      slug,
      content,
      excerpt,
      featuredMediaId,
      featuredImage,
      status,
      publishedAt,
      categoryId,
      authorId,
      seoTitle,
      metaDescription,
    ]
  );

  return result.rows[0];
}


  // ============================================
  // PARTIAL UPDATE
  // ============================================

  async update(id, data, db = this.db) {
    const fields = [];
    const values = [];

    for (const [key, column] of Object.entries(
      UPDATE_COLUMNS
    )) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }

      if (data[key] === undefined) {
        continue;
      }

      values.push(data[key]);

      fields.push(`${column} = $${values.length}`);
    }

    if (!fields.length) {
      return this.findById(id, db);
    }

    values.push(id);

    const result = await db.query(
      `
      UPDATE posts
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // DELETE SINGLE POST
  // ============================================

  async delete(id, db = this.db) {
    const result = await db.query(
      `
      DELETE FROM posts
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // REPLACE TAG RELATIONSHIPS
  // ============================================

  async replaceTags(postId, tagIds, db = this.db) {
    const ids = [
      ...new Set(tagIds ?? []),
    ];

    await db.query(
      `
      DELETE FROM post_tags
      WHERE post_id = $1
      `,
      [postId]
    );

    if (!ids.length) return;

    await db.query(
      `
      INSERT INTO post_tags (post_id, tag_id)
      SELECT $1::uuid, t.id
      FROM tags t
      WHERE t.id = ANY($2::uuid[])
      ON CONFLICT DO NOTHING
      `,
      [postId, ids]
    );
  }

  // ============================================
  // PUBLISH DUE SCHEDULED POSTS
  // Used by cron-job.org through a secured API.
  // ============================================

  async publishScheduledPosts(db = this.db) {
    const result = await db.query(
      `
      UPDATE posts
      SET status = 'published'
      WHERE status = 'scheduled'
        AND published_at IS NOT NULL
        AND published_at <= NOW()
      RETURNING id, slug, published_at
      `
    );

    return result.rows;
  }
}
