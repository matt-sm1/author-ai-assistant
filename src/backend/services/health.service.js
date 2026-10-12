import pool from "@/backend/lib/db";

export async function checkDatabaseConnection() {
  const result = await pool.query("SELECT NOW()");

  return {
    database: "connected",
    time: result.rows[0].now,
  };
}