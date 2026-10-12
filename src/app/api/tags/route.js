
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  createTagController,
  getTagsController,
} from "@/backend/controllers/tag.controller";

// ============================================
// GET ALL TAGS
// ============================================

export const GET = withAuth(getTagsController);

// ============================================
// CREATE TAG
// ============================================

export const POST = withAuth(createTagController);
