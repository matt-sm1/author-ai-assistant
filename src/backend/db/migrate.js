import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsPath = path.join(__dirname, "migrations");
const MIGRATION_LOCK = [14000000, 1];

function getMigrationFiles() {
  return fs
    .readdirSync(migrationsPath)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

function stripOuterTransaction(sql) {
  const match = sql.match(/^\s*BEGIN\s*;\s*([\s\S]*?)\s*COMMIT\s*;\s*$/i);
  return match ? match[1] : sql;
}

async function runMigrations() {
  let client;
  let lockAcquired = false;

  try {
    client = await pool.connect();
    await client.query("SELECT pg_advisory_lock($1, $2)", MIGRATION_LOCK);
    lockAcquired = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        name TEXT PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = getMigrationFiles();
    let appliedCount = 0;

    for (const file of files) {
      const filePath = path.join(migrationsPath, file);
      const sql = fs.readFileSync(filePath, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await client.query(
        "SELECT checksum FROM public.schema_migrations WHERE name = $1",
        [file],
      );

      if (existing.rowCount > 0) {
        if (existing.rows[0].checksum.trim() !== checksum) {
          throw new Error(
            `Migration ${file} has changed after being applied. Create a new migration instead of editing an applied SQL file.`,
          );
        }

        console.log(`[migrate] Skipping already applied migration: ${file}`);
        continue;
      }

      try {
        await client.query("BEGIN");
        await client.query(stripOuterTransaction(sql));
        await client.query(
          `INSERT INTO public.schema_migrations (name, checksum)
           VALUES ($1, $2)`,
          [file, checksum],
        );
        await client.query("COMMIT");
        appliedCount += 1;
        console.log(`[migrate] Applied migration: ${file}`);
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(`[migrate] Rollback failed for ${file}:`, rollbackError);
        }

        throw new Error(`Migration ${file} failed: ${error.message}`, {
          cause: error,
        });
      }
    }

    console.log(
      appliedCount === 0
        ? "[migrate] Database is up to date."
        : `[migrate] Successfully applied ${appliedCount} migration(s).`,
    );
  } catch (error) {
    console.error("[migrate] Migration run failed:", error);
    process.exitCode = 1;
  } finally {
    if (client && lockAcquired) {
      try {
        await client.query("SELECT pg_advisory_unlock($1, $2)", MIGRATION_LOCK);
      } catch (error) {
        console.error("[migrate] Could not release advisory lock:", error);
        process.exitCode = 1;
      }
    }

    client?.release();
    await pool.end();
  }
}

runMigrations();
