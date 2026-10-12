
import { withAuth } from "@/backend/middleware/auth.middleware";

import {
  createCategoryController,
  getCategoriesController,
} from "@/backend/controllers/category.controller";

// ============================================
// GET ALL CATEGORIES
// ============================================

export const GET = withAuth(getCategoriesController);

// ============================================
// CREATE CATEGORY
// ============================================

export const POST = withAuth(createCategoryController);
