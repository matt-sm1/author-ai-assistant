
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  getPostByIdController,
  updatePostController,
  deletePostController,
} from "@/backend/controllers/post.controller";

// ============================================
// GET POST BY ID
// ============================================

export const GET = withAuth(getPostByIdController);

// ============================================
// UPDATE POST
// ============================================

export const PUT = withAuth(updatePostController);

// ============================================
// DELETE POST
// ============================================

export const DELETE = withAuth(deletePostController);
