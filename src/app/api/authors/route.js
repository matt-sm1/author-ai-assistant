
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  createAuthorController,
  getAuthorsController,
} from "@/backend/controllers/author.controller";

// ============================================
// GET ALL AUTHORS
// ============================================

export const GET = withAuth(getAuthorsController);

// ============================================
// CREATE AUTHOR
// ============================================

export const POST = withAuth(createAuthorController);