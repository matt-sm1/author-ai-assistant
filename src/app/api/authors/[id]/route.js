
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  getAuthorByIdController,
  updateAuthorController,
  deleteAuthorController,
} from "@/backend/controllers/author.controller";

// ============================================
// GET AUTHOR BY ID
// ============================================

export const GET = withAuth(getAuthorByIdController);

// ============================================
// UPDATE AUTHOR
// ============================================

export const PUT = withAuth(updateAuthorController);

// ============================================
// DELETE AUTHOR
// ============================================

export const DELETE = withAuth(deleteAuthorController);