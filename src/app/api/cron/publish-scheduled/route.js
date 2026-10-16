import { publishScheduledPostsController } from "@/backend/controllers/cron.controller";

export const runtime = "nodejs";

/** Vercel Cron invokes GET; external schedulers may use POST. */
export async function GET(request) {
  return publishScheduledPostsController(request);
}

export async function POST(request) {
  return publishScheduledPostsController(request);
}
