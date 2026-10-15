import pool from "@/backend/lib/db";

// ============================================
// TAG REPOSITORY
// ============================================

export class TagRepository {
  constructor(db = pool) {
    this.db = db;
  }

  // ============================================
  // CREATE TAG
  // ============================================


async create({ name, slug }, db = this.db) {
  const result = await db.query(
    `
    INSERT INTO tags (name, slug)
    VALUES ($1, $2)
    RETURNING id, name, slug, created_at, updated_at
    `,
    [name, slug],
  );

  return result.rows[0];
}
  

  // ============================================
  // GET ALL TAGS
  // ============================================

  async findAll({ limit, offset, search = "" } = {}) {
    const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
    const searchPattern = `%${escapedSearch}%`;

    const result = await this.db.query(
      `
    SELECT
      t.id,
      t.name,
      t.slug,
      t.created_at,
      t.updated_at,
      COUNT(pt.post_id)::int AS "postCount"
    FROM tags t
    LEFT JOIN post_tags pt
      ON pt.tag_id = t.id
    WHERE (
      t.name ILIKE $1 ESCAPE '\\'
      OR t.slug ILIKE $1 ESCAPE '\\'
    )
    GROUP BY t.id
    ORDER BY t.created_at DESC, t.id DESC
    LIMIT $2 OFFSET $3
    `,
      [searchPattern, limit, offset],
    );

    return result.rows;
  }

  async countAll(search = "") {
    const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
    const searchPattern = `%${escapedSearch}%`;

    const result = await this.db.query(
      `
    SELECT COUNT(*)::int AS total
    FROM tags t
    WHERE (
      t.name ILIKE $1 ESCAPE '\\'
      OR t.slug ILIKE $1 ESCAPE '\\'
    )
    `,
      [searchPattern],
    );

    return result.rows[0].total;
  }
  // ============================================
  // FIND TAG BY ID
  // ============================================

  async findById(id) {
    const result = await this.db.query(
      `
    SELECT
  t.id,
  t.name,
  t.slug,
  t.created_at,
  t.updated_at,
  COUNT(pt.post_id)::int AS "postCount"
    FROM tags t
    LEFT JOIN post_tags pt
      ON pt.tag_id = t.id
    WHERE t.id = $1
    GROUP BY t.id
    `,
      [id],
    );

    return result.rows[0] ?? null;
  }
  // ============================================
  // FIND TAG BY NAME
  // ============================================

  async findByName(name, db = this.db) {
  const result = await db.query(
    `
    SELECT id, name, slug
    FROM tags
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [name],
  );

  return result.rows[0] ?? null;
}

  // ============================================
  // FIND TAG BY SLUG
  // ============================================

  async findBySlug(slug, db = this.db) {
    const result = await db.query(
      `
      SELECT id, name, slug
      FROM tags
      WHERE slug = $1
      LIMIT 1
      `,
      [slug],
    );

    return result.rows[0] ?? null;
  }

  /**
   * Insert tag or return existing row for the same slug (race-safe).
   */
  async upsertBySlug({ name, slug }, db = this.db) {
    const result = await db.query(
      `
      INSERT INTO tags (name, slug)
      VALUES ($1, $2)
      ON CONFLICT (slug) DO UPDATE
        SET name = tags.name
      RETURNING id, name, slug, created_at, updated_at
      `,
      [name, slug],
    );

    return result.rows[0];
  }

  // ============================================
  // UPDATE TAG
  // ============================================

  async update(id, { name, slug }) {
    const result = await this.db.query(
      `
      UPDATE tags
      SET
        name = $1,
        slug = $2
      WHERE id = $3
RETURNING id, name, slug, created_at, updated_at      `,
      [name, slug, id],
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // DELETE TAG
  // ============================================

  async delete(id) {
    const result = await this.db.query(
      `
      DELETE FROM tags
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // COUNT POSTS USING TAG
  // ============================================

  async countPosts(tagId) {
    const result = await this.db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM post_tags
      WHERE tag_id = $1
      `,
      [tagId],
    );

    return result.rows[0].total;
  }
}
