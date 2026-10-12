import pool from "@/backend/lib/db";

export class UserRepository {
  async create({ name, email, passwordHash }) {
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at, updated_at`,
      [name, email, passwordHash]
    );

    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await pool.query(
      `SELECT id, name, email, password AS password_hash
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    return result.rows[0] ?? null;
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return result.rows[0] ?? null;
  }
}