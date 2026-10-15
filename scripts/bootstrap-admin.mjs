/**
 * Run after migrations: create bootstrap admin if none exist.
 * Plain Node (no Next path aliases). Requires .env.local:
 *   DATABASE_URL, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD
 *
 * Usage: npm run bootstrap
 *        npm run setup:db  → migrate + bootstrap
 */
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Admin";

  if (!connectionString) {
    console.error("[bootstrap] DATABASE_URL is not set in .env.local");
    process.exitCode = 1;
    return;
  }

  if (!email || !password) {
    console.error(
      "[bootstrap] Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env.local"
    );
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({ connectionString });

  try {
    const admins = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM users
       WHERE role = 'admin' AND status = 'active'`
    );

    if ((admins.rows[0]?.count ?? 0) > 0) {
      console.log("[bootstrap] Skipped — an active admin already exists.");
      return;
    }

    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (existing.rowCount > 0) {
      console.log(
        "[bootstrap] Skipped — bootstrap email already exists (promote manually if needed)."
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       RETURNING id, email, role`,
      [name, email, passwordHash]
    );

    console.log(
      `[bootstrap] Created admin user: ${created.rows[0].email} (${created.rows[0].id})`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[bootstrap] Failed:", error.message || error);
  process.exitCode = 1;
});
