import { withAuth } from "@/backend/middleware/auth.middleware";
import { finalizeUploadController } from "@/backend/controllers/media.controller";

export const runtime = "nodejs";

export const POST = withAuth(finalizeUploadController);
