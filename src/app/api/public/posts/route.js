import { listPublishedPostsController } from "@/backend/controllers/public-post.controller";

export const runtime = "nodejs";

export async function GET(request) {
  return listPublishedPostsController(request);
}
