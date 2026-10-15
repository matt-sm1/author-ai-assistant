import pool from "@/backend/lib/db";

const PUBLIC_USER_COLUMNS = `id, name, email, role, status, created_at, updated_at`;

export class UserRepository {
  async create({ name, email, passwordHash, role = "editor" }) {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING ${PUBLIC_USER_COLUMNS}`,
      [name, email, passwordHash, role]
    );

    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, status
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    return result.rows[0] ?? null;
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT ${PUBLIC_USER_COLUMNS}
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  async countAdmins() {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM users
       WHERE role = 'admin' AND status = 'active'`
    );

    return result.rows[0]?.count ?? 0;
  }
}
