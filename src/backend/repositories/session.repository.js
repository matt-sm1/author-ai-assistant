import pool from "@/backend/lib/db";

export class SessionRepository {
  async create({ userId, expiresAt }) {
    const result = await pool.query(
      `INSERT INTO sessions (user_id, expires_at)
       VALUES ($1, $2)
       RETURNING id, user_id, expires_at, revoked_at, created_at`,
      [userId, expiresAt]
    );

    return result.rows[0];
  }

  async findActiveById(id) {
    const result = await pool.query(
      `SELECT s.id, s.user_id, s.expires_at, s.revoked_at,
              u.name, u.email, u.role, u.status
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.id = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
         AND u.status = 'active'
       LIMIT 1`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async revoke(id) {
    await pool.query(
      `UPDATE sessions
       SET revoked_at = NOW()
       WHERE id = $1 AND revoked_at IS NULL`,
      [id]
    );
  }

  async revokeAllForUser(userId) {
    await pool.query(
      `UPDATE sessions
       SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }
}
