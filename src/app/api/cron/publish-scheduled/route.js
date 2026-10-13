import { publishScheduledPostsController } from "@/backend/controllers/corn.controller";

export const runtime = "nodejs";

export async function POST(request) {
  return publishScheduledPostsController(request);
}