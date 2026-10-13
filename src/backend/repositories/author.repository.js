
import pool from "@/backend/lib/db";

export class AuthorRepository {
  constructor(db = pool) {
    this.db = db;
  }

  // CREATE AUTHOR

  async create({
    name,
    email = null,
    bio = null,
    avatar_media_id = null,
    avatar_url = null,
  }) {
    const result = await this.db.query(
      `
    INSERT INTO authors (
      name,
      email,
      bio,
      avatar_media_id,
      avatar_url
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id, name, email, bio,
      avatar_media_id, avatar_url,
      is_active, created_at, updated_at
    `,
      [name, email, bio, avatar_media_id, avatar_url],
    );

    return result.rows[0];
  }


  // GET ALL AUTHORS (SEARCH + PAGINATION + SORTING)
  async findAll({
    limit = 10,
    offset = 0,
    search = "",
    sortBy = "created_at",
    sortOrder = "desc",
    activeOnly = false,
  } = {}) {
    const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
    const searchPattern = `%${escapedSearch}%`;

    // Allowlist prevents SQL injection through sorting parameters.
    const allowedSortColumns = [
      "name",
      "email",
      "created_at",
      "updated_at",
    ];

    const safeSortBy = allowedSortColumns.includes(sortBy)
      ? sortBy
      : "created_at";

    const safeSortOrder =
      sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    const result = await this.db.query(
      `
      SELECT
  id,
  name,
  email,
  bio,
  avatar_media_id,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM authors
      WHERE
        (
          name ILIKE $3 ESCAPE '\\'
          OR COALESCE(email, '') ILIKE $3 ESCAPE '\\'
        )
        AND (NOT $4::boolean OR is_active = TRUE)
      ORDER BY ${safeSortBy} ${safeSortOrder}, id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset, searchPattern, activeOnly],
    );

    return result.rows;
  }

  // COUNT AUTHORS (WITH SEARCH)
  async countAll(search = "", activeOnly = false) {
    const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
    const searchPattern = `%${escapedSearch}%`;

    const result = await this.db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM authors
      WHERE
        (
          name ILIKE $1 ESCAPE '\\'
          OR COALESCE(email, '') ILIKE $1 ESCAPE '\\'
        )
        AND (NOT $2::boolean OR is_active = TRUE)
      `,
      [searchPattern, activeOnly],
    );

    return result.rows[0].total;
  }

  // FIND AUTHOR BY ID
  async findById(id, db = this.db) {
    const result = await db.query(
      `
     SELECT
  id,
  name,
  email,
  bio,
  avatar_media_id,
  avatar_url,
  is_active,
  created_at,
  updated_at
FROM authors
WHERE id = $1
LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  // FIND AUTHOR BY EMAIL
  async findByEmail(email) {
    if (!email) return null;

    const result = await this.db.query(
      `
      SELECT id, name, email
      FROM authors
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email],
    );

    return result.rows[0] ?? null;
  }

  // UPDATE AUTHOR

  async update(
    id,
    {
      name,
      email = null,
      bio = null,
      avatar_media_id = null,
      avatar_url = null,
      is_active,
    },
  ) {
    const result = await this.db.query(
      `
    UPDATE authors
    SET
      name = $1,
      email = $2,
      bio = $3,
      avatar_media_id = $4,
      avatar_url = $5,
      is_active = COALESCE($6, is_active),
      updated_at = NOW()
    WHERE id = $7
    RETURNING
      id, name, email, bio,
      avatar_media_id, avatar_url,
      is_active, created_at, updated_at
    `,
      [
        name,
        email,
        bio,
        avatar_media_id,
        avatar_url,
        is_active ?? null,
        id,
      ],
    );

    return result.rows[0] ?? null;
  }


  // DELETE AUTHOR
  async delete(id) {
    const result = await this.db.query(
      `
      DELETE FROM authors
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  // COUNT POSTS BY AUTHOR
  // Accurate after posts.author_id references authors.id.
  async countPosts(authorId) {
    const result = await this.db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM posts
      WHERE author_id = $1
      `,
      [authorId],
    );

    return result.rows[0].total;
  }
}