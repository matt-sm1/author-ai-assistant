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
  status,
  upload_expires_at,
  content_sha256,
  created_at,
  updated_at
`;

export class MediaRepository {
  constructor(db = pool) {
    this.db = db;
  }

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
        description,
        status,
        upload_expires_at,
        content_sha256
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14,
        COALESCE($15::media_status, 'ready'::media_status),
        $16,
        $17
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
        data.status ?? "ready",
        data.upload_expires_at ?? null,
        data.content_sha256 ?? null,
      ],
    );

    return result.rows[0];
  }

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
        status = 'ready'
        AND (filename ILIKE $3 ESCAPE '\\'
         OR COALESCE(alt_text, '') ILIKE $3 ESCAPE '\\')
        AND ($4 = '' OR resource_type = $4)
      ORDER BY created_at DESC, id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset, searchPattern, resourceType],
    );

    return result.rows;
  }

  async countAll(search = "", resourceType = "") {
    const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
    const searchPattern = `%${escapedSearch}%`;

    const result = await this.db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM media
      WHERE
        status = 'ready'
        AND (filename ILIKE $1 ESCAPE '\\'
         OR COALESCE(alt_text, '') ILIKE $1 ESCAPE '\\')
        AND ($2 = '' OR resource_type = $2)
      `,
      [searchPattern, resourceType],
    );

    return result.rows[0].total;
  }

  async findById(id, db = this.db) {
    const result = await db.query(
      `
      SELECT ${MEDIA_COLUMNS}
      FROM media
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async update(id, { alt_text, caption, description }) {
    const result = await this.db.query(
      `
      UPDATE media
      SET
        alt_text = COALESCE($1, alt_text),
        caption = COALESCE($2, caption),
        description = COALESCE($3, description),
        updated_at = NOW()
      WHERE id = $4
        AND status = 'ready'
      RETURNING ${MEDIA_COLUMNS}
      `,
      [alt_text, caption, description, id],
    );

    return result.rows[0] ?? null;
  }

  /**
   * Promote pending → ready once. Idempotent if already ready with same key.
   */
  async finalizePending(id, data) {
    const result = await this.db.query(
      `
      UPDATE media
      SET
        status = 'ready',
        url = $2,
        size_bytes = $3,
        width = $4,
        height = $5,
        format = COALESCE(NULLIF($6, ''), format),
        content_sha256 = $7,
        upload_expires_at = NULL,
        updated_at = NOW()
      WHERE id = $1
        AND status = 'pending'
        AND storage_key = $8
      RETURNING ${MEDIA_COLUMNS}
      `,
      [
        id,
        data.url,
        data.size_bytes,
        data.width ?? null,
        data.height ?? null,
        data.format ?? null,
        data.content_sha256 ?? null,
        data.storage_key,
      ],
    );

    return result.rows[0] ?? null;
  }

  async markFailed(id) {
    const result = await this.db.query(
      `
      UPDATE media
      SET
        status = 'failed',
        upload_expires_at = NULL,
        updated_at = NOW()
      WHERE id = $1
        AND status = 'pending'
      RETURNING ${MEDIA_COLUMNS}
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async findExpiredPending(limit = 50) {
    const result = await this.db.query(
      `
      SELECT ${MEDIA_COLUMNS}
      FROM media
      WHERE status = 'pending'
        AND upload_expires_at IS NOT NULL
        AND upload_expires_at < NOW()
      ORDER BY upload_expires_at ASC
      LIMIT $1
      `,
      [limit],
    );

    return result.rows;
  }

  async delete(id) {
    const result = await this.db.query(
      `
      DELETE FROM media
      WHERE id = $1
      RETURNING id
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

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
