import pool from "@/backend/lib/db";

// ============================================
// CATEGORY REPOSITORY
// ============================================

export class CategoryRepository {
  constructor(db = pool) {
    this.db = db;
  }

  // ============================================
  // CREATE CATEGORY
  // ============================================

  async create({ name, slug }) {
    const result = await this.db.query(
      `
      INSERT INTO categories (name, slug)
      VALUES ($1, $2)
      RETURNING id, name, slug, created_at, updated_at  
      `,
      [name, slug],
    );

    return result.rows[0];
  }

// ============================================
// GET ALL CATEGORIES (SEARCH + PAGINATION)
// ============================================

async findAll({ limit = 10, offset = 0, search = "" } = {}) {
  const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
  const searchPattern = `%${escapedSearch}%`;

  const result = await this.db.query(
    `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.created_at,
      c.updated_at,
      COUNT(p.id)::int AS "postCount"
    FROM categories c
    LEFT JOIN posts p
      ON p.category_id = c.id
    WHERE
      c.name ILIKE $3 ESCAPE '\'
      OR c.slug ILIKE $3 ESCAPE '\'
    GROUP BY
      c.id,
      c.name,
      c.slug,
      c.created_at,
      c.updated_at
    ORDER BY c.created_at DESC, c.id DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset, searchPattern]
  );

  return result.rows;
}

// ============================================
// COUNT ALL CATEGORIES (WITH SEARCH)
// ============================================

async countAll(search = "") {
  const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
  const searchPattern = `%${escapedSearch}%`;

  const result = await this.db.query(
    `
    SELECT COUNT(*)::int AS total
    FROM categories
    WHERE
      name ILIKE $1 ESCAPE '\'
      OR slug ILIKE $1 ESCAPE '\'
    `,
    [searchPattern]
  );

  return result.rows[0].total;
}


// ============================================
// FIND CATEGORY BY ID
// ============================================

async findById(id) {
  const result = await this.db.query(
    `
    SELECT
      id,
      name,
      slug,
      created_at,
      updated_at
    FROM categories
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

  // ============================================
  // FIND CATEGORY BY NAME
  // ============================================

  async findByName(name) {
    const result = await this.db.query(
      `
      SELECT id, name, slug
      FROM categories
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
      `,
      [name],
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // FIND CATEGORY BY SLUG
  // ============================================

  async findBySlug(slug) {
    const result = await this.db.query(
      `
      SELECT id, name, slug
      FROM categories
      WHERE slug = $1
      LIMIT 1
      `,
      [slug],
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // UPDATE CATEGORY
  // ============================================

  async update(id, { name, slug }) {
    const result = await this.db.query(
      `
      UPDATE categories
      SET
        name = $1,
        slug = $2
      WHERE id = $3
      RETURNING id, name, slug, created_at, updated_at
      `,
      [name, slug, id],
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // DELETE CATEGORY
  // ============================================

  async delete(id) {
    const result = await this.db.query(
      `
      DELETE FROM categories
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // COUNT POSTS IN CATEGORY
  // ============================================

  async countPosts(categoryId) {
    const result = await this.db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM posts
      WHERE category_id = $1
      `,
      [categoryId],
    );

    return result.rows[0].total;
  }
}
