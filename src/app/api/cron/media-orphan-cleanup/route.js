import { mediaOrphanCleanupController } from "@/backend/controllers/media-orphan-cron.controller";

export const runtime = "nodejs";

export async function GET(request) {
  return mediaOrphanCleanupController(request);
}

export async function POST(request) {
  return mediaOrphanCleanupController(request);
}
