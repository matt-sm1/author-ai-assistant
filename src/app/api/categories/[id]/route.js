
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from "@/backend/controllers/category.controller";

// ============================================
// GET CATEGORY BY ID
// ============================================

export const GET = withAuth(getCategoryByIdController);

// ============================================
// UPDATE CATEGORY
// ============================================

export const PUT = withAuth(updateCategoryController);

// ============================================
// DELETE CATEGORY
// ============================================

export const DELETE = withAuth(deleteCategoryController);
