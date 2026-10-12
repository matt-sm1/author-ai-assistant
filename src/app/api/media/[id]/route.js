import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  deleteMediaController,
  getMediaByIdController,
  updateMediaController,
} from "@/backend/controllers/media.controller";

// ============================================
// NODE.JS RUNTIME
// ============================================

export const runtime = "nodejs";

// ============================================
// GET MEDIA BY ID
// ============================================

export const GET = withAuth(getMediaByIdController);

// ============================================
// UPDATE MEDIA METADATA
// ============================================

export const PATCH = withAuth(updateMediaController);

// ============================================
// DELETE MEDIA
// ============================================

export const DELETE = withAuth(deleteMediaController);
