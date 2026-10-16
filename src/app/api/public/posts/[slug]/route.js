import { getPublishedPostBySlugController } from "@/backend/controllers/public-post.controller";

export const runtime = "nodejs";

export async function GET(request, context) {
  return getPublishedPostBySlugController(request, context);
}
