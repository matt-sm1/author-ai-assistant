import { publishScheduledPostsController } from "@/backend/controllers/cron.controller";

export const runtime = "nodejs";

export async function POST(request) {
  return publishScheduledPostsController(request);
}