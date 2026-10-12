
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  getTagByIdController,
  updateTagController,
  deleteTagController,
} from "@/backend/controllers/tag.controller";

// ============================================
// GET TAG BY ID
// ============================================

export const GET = withAuth(getTagByIdController);

// ============================================
// UPDATE TAG
// ============================================

export const PUT = withAuth(updateTagController);

// ============================================
// DELETE TAG
// ============================================

export const DELETE = withAuth(deleteTagController);
