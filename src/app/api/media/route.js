
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  getMediaController,
  uploadMediaController,
} from "@/backend/controllers/media.controller";

export const runtime = "nodejs";

// ============================================
// GET ALL MEDIA
// ============================================

export const GET = withAuth(getMediaController);

// ============================================
// UPLOAD MEDIA
// ============================================

export const POST = withAuth(uploadMediaController);


