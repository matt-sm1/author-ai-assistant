
import pool from "@/backend/lib/db";

// ============================================
// MEDIA REPOSITORY
// ============================================

const MEDIA_COLUMNS = `
  id,
  storage_provider,
  storage_key,
  provider_asset_id,
  url,
  filename,
  resource_type,
  mime_type,
  format,
  size_bytes,
  width,
  height,
  alt_text,
  caption,
  description,
  created_at,
  updated_at
`;

export class MediaRepository {
  constructor(db = pool) {
    this.db = db;
  }

  // ============================================
  // CREATE MEDIA
  // ============================================

  async create(data) {
    const result = await this.db.query(
      `
      INSERT INTO media (
        storage_provider,
        storage_key,
        provider_asset_id,
        url,
        filename,
        resource_type,
        mime_type,
        format,
        size_bytes,
        width,
        height,
        alt_text,
        caption,
        description
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING ${MEDIA_COLUMNS}
      `,
      [
        data.storage_provider,
        data.storage_key,
        data.provider_asset_id ?? null,
        data.url,
        data.filename,
        data.resource_type,
        data.mime_type,
        data.format,
        data.size_bytes,
        data.width ?? null,
        data.height ?? null,
        data.alt_text ?? null,
        data.caption ?? null,
        data.description ?? null,
      ]
    );

    return result.rows[0];
  }

  // ============================================
  // GET MEDIA (SEARCH + FILTER + PAGINATION)
  // ============================================

  async findAll({
    limit = 10,
    offset = 0,
    search = "",
    resourceType = "",
  } = {}) {
    const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
    const searchPattern = `%${escapedSearch}%`;

    const result = await this.db.query(
      `
      SELECT ${MEDIA_COLUMNS}
      FROM media
      WHERE
        (filename ILIKE $3 ESCAPE '\\'
         OR COALESCE(alt_text, '') ILIKE $3 ESCAPE '\\')
        AND ($4 = '' OR resource_type = $4)
      ORDER BY created_at DESC, id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset, searchPattern, resourceType]
    );

    return result.rows;
  }

  // ============================================
  // COUNT MEDIA
  // ============================================

  async countAll(search = "", resourceType = "") {
    const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
    const searchPattern = `%${escapedSearch}%`;

    const result = await this.db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM media
      WHERE
        (filename ILIKE $1 ESCAPE '\\'
         OR COALESCE(alt_text, '') ILIKE $1 ESCAPE '\\')
        AND ($2 = '' OR resource_type = $2)
      `,
      [searchPattern, resourceType]
    );

    return result.rows[0].total;
  }

  // ============================================
  // GET MEDIA BY ID
  // ============================================

  async findById(id, db = this.db) {
    const result = await db.query(
      `
      SELECT ${MEDIA_COLUMNS}
      FROM media
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // UPDATE MEDIA METADATA
  // ============================================

  async update(id, { alt_text, caption, description }) {
    const result = await this.db.query(
      `
      UPDATE media
      SET
        alt_text = COALESCE($1, alt_text),
        caption = COALESCE($2, caption),
        description = COALESCE($3, description)
      WHERE id = $4
      RETURNING ${MEDIA_COLUMNS}
      `,
      [alt_text, caption, description, id]
    );

    return result.rows[0] ?? null;
  }

  // ============================================
  // DELETE MEDIA RECORD
  // ============================================

  async delete(id) {
    const result = await this.db.query(
      `
      DELETE FROM media
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    return result.rows[0] ?? null;
  }

  
  // ============================================
  // DELETE MEDIA + CLEAR REFERENCES
  // ============================================

  async deleteWithReferencesCleared(id) {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

     await client.query(
  `UPDATE authors
   SET avatar_media_id = NULL,
       avatar_url = NULL
   WHERE avatar_media_id = $1
      OR avatar_url = (
        SELECT url FROM media WHERE id = $1
      )`,
  [id],
);

await client.query(
  `UPDATE posts
   SET featured_media_id = NULL,
       featured_image = NULL
   WHERE featured_media_id = $1
      OR featured_image = (
        SELECT url FROM media WHERE id = $1
      )`,
  [id],
);

      // Delete the media record.
      const result = await client.query(
        `
        DELETE FROM media
        WHERE id = $1
        RETURNING id
        `,
        [id],
      );

      if (result.rowCount === 0) {
        throw new Error("Media not found");
      }

      await client.query("COMMIT");

      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

}

