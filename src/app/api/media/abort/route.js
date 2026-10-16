import { withAuth } from "@/backend/middleware/auth.middleware";
import { abortUploadController } from "@/backend/controllers/media.controller";

export const runtime = "nodejs";

export const POST = withAuth(abortUploadController);
