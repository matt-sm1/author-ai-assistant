
import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";

import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

import { createAuthorService } from "@/backend/factories/author.factory";

import {
  validateCreateAuthorInput,
  validateUpdateAuthorInput,
  validateAuthorId,
} from "@/backend/validators/author.validator";

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

async function getValidatedAuthorId(context) {
  const params = await context?.params;

  return validateAuthorId(params?.id);
}

// ============================================
// CREATE AUTHOR
// ============================================

export async function createAuthorController(request, userId) {
  try {
    const body = await parseJsonBody(request);

    const validatedData =
      await validateCreateAuthorInput(body);

    const authorService = createAuthorService();

    const author =
      await authorService.createAuthor(validatedData);

    return Response.json(
      {
        success: true,
        message: "Author created successfully",
        data: author,
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
// GET ALL AUTHORS (SEARCH + PAGINATION + SORTING)
// ============================================

export async function getAuthorsController(request) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page") ?? "1";
    const limitParam = searchParams.get("limit") ?? "10";
    const search = (searchParams.get("search") ?? "").trim();
    const sortBy = searchParams.get("sortBy") ?? "created_at";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    const activeOnlyParam = searchParams.get("activeOnly") ?? "false";

    if (!["true", "false"].includes(activeOnlyParam)) {
      throw new AppError(
        "Invalid activeOnly parameter",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

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

    const allowedSortColumns = [
      "name",
      "email",
      "created_at",
      "updated_at",
    ];

    if (
      !allowedSortColumns.includes(sortBy) ||
      !["asc", "desc"].includes(sortOrder.toLowerCase())
    ) {
      throw new AppError(
        "Invalid sorting parameters",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const authorService = createAuthorService();

    const result = await authorService.getAuthors({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      activeOnly: activeOnlyParam === "true",
    });

    return Response.json(
      {
        success: true,
        data: result.authors,
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
// GET AUTHOR BY ID
// ============================================

export async function getAuthorByIdController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedAuthorId(context);

    const authorService = createAuthorService();

    const author = await authorService.getAuthorById(id);

    return Response.json(
      {
        success: true,
        data: author,
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
// UPDATE AUTHOR
// ============================================

export async function updateAuthorController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedAuthorId(context);
    const body = await parseJsonBody(request);

    const validatedData =
      await validateUpdateAuthorInput(body);

    const authorService = createAuthorService();

    const author = await authorService.updateAuthor(
      id,
      validatedData
    );

    return Response.json(
      {
        success: true,
        message: "Author updated successfully",
        data: author,
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
// DELETE AUTHOR
// ============================================

export async function deleteAuthorController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedAuthorId(context);

    const authorService = createAuthorService();

    await authorService.deleteAuthor(id);

    return Response.json(
      {
        success: true,
        message: "Author deleted successfully",
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
// DEACTIVATE AUTHOR
// ============================================

export async function deactivateAuthorController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedAuthorId(context);

    const authorService = createAuthorService();

    const author = await authorService.deactivateAuthor(id);

    return Response.json(
      {
        success: true,
        message: "Author deactivated successfully",
        data: author,
      },
      {
        status: HTTP_STATUS.OK,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}