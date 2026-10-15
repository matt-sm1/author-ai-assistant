import pool from "@/backend/lib/db";

export class StatsService {
  async getDashboardStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total_posts,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published_posts,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_posts,
        COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled_posts
      FROM posts
    `);

    const row = result.rows[0] ?? {};

    return {
      totalPosts: row.total_posts ?? 0,
      publishedPosts: row.published_posts ?? 0,
      draftPosts: row.draft_posts ?? 0,
      scheduledPosts: row.scheduled_posts ?? 0,
    };
  }
}

export function createStatsService() {
  return new StatsService();
}
