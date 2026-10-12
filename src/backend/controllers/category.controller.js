
import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";

import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

import { createCategoryService } from "@/backend/factories/category.factory";

import {
  validateCreateCategoryInput,
  validateUpdateCategoryInput,
  validateCategoryId,
} from "@/backend/validators/category.validator";

// ============================================
// REQUEST HELPERS
// ============================================

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new AppError(
      "Invalid JSON body",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_JSON
    );
  }
}

async function getValidatedCategoryId(context) {
  const params = await context?.params;

  return validateCategoryId(params?.id);
}

// ============================================
// CREATE CATEGORY
// ============================================

export async function createCategoryController(
  request,
  userId
) {
  try {
    const body = await parseJsonBody(request);

    const validatedData =
      await validateCreateCategoryInput(body);

    const categoryService = createCategoryService();

    const category =
      await categoryService.createCategory(validatedData);

    return Response.json(
      {
        success: true,
        message: "Category created successfully",
        data: category,
      },
      {
        status: HTTP_STATUS.CREATED,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// GET ALL CATEGORIES (PAGINATED)
// ============================================

export async function getCategoriesController(request) {
  try {
    const categoryService = createCategoryService();

    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page") ?? "1";
    const limitParam = searchParams.get("limit") ?? "10";
    const search = (searchParams.get("search") ?? "").trim();
    const page = Number(pageParam);
    const limit = Number(limitParam);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new AppError(
        "Invalid pagination parameters",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

   const result = await categoryService.getCategories({
  page,
  limit,
  search,
});

    return Response.json(
      {
        success: true,
        data: result.categories,
        pagination: result.pagination,
      },
      {
        status: HTTP_STATUS.OK,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// GET CATEGORY BY ID
// ============================================

export async function getCategoryByIdController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedCategoryId(context);

    const categoryService = createCategoryService();

    const category =
      await categoryService.getCategoryById(id);

    return Response.json(
      {
        success: true,
        data: category,
      },
      {
        status: HTTP_STATUS.OK,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// UPDATE CATEGORY
// ============================================

export async function updateCategoryController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedCategoryId(context);

    const body = await parseJsonBody(request);

    const validatedData =
      await validateUpdateCategoryInput(body);

    const categoryService = createCategoryService();

    const category =
      await categoryService.updateCategory(
        id,
        validatedData
      );

    return Response.json(
      {
        success: true,
        message: "Category updated successfully",
        data: category,
      },
      {
        status: HTTP_STATUS.OK,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// DELETE CATEGORY
// ============================================

export async function deleteCategoryController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedCategoryId(context);

    const categoryService = createCategoryService();

    await categoryService.deleteCategory(id);

    return Response.json(
      {
        success: true,
        message: "Category deleted successfully",
      },
      {
        status: HTTP_STATUS.OK,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}
