
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  createPostController,
  getPostsController,
} from "@/backend/controllers/post.controller";

// ============================================
// GET ALL POSTS
// ============================================

export const GET = withAuth(getPostsController);

// ============================================
// CREATE POST
// ============================================

export const POST = withAuth(createPostController);
