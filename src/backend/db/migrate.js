

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsPath = path.join(__dirname, "migrations");

async function runMigrations() {
  try {
    const files = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsPath, file);
      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`Running migration: ${file}`);

      await pool.query(sql);

      console.log(`Completed: ${file}`);
    }

    console.log("All migrations completed.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();