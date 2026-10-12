
import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";

import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

import { createTagService } from "@/backend/factories/tag.factory";

import {
  validateCreateTagInput,
  validateUpdateTagInput,
  validateTagId,
} from "@/backend/validators/tag.validator";

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

async function getValidatedTagId(context) {
  const params = await context?.params;

  return validateTagId(params?.id);
}

// ============================================
// CREATE TAG
// ============================================

export async function createTagController(
  request,
  userId
) {
  try {
    const body = await parseJsonBody(request);

    const validatedData =
      await validateCreateTagInput(body);

    const tagService = createTagService();

    const tag = await tagService.createTag(
      validatedData
    );

    return Response.json(
      {
        success: true,
        message: "Tag created successfully",
        data: tag,
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
// GET TAGS WITH SEARCH + PAGINATION
// ============================================

export async function getTagsController(request) {
  try {
    const url = new URL(request.url);

    const pageParam = url.searchParams.get("page") ?? "1";
    const limitParam = url.searchParams.get("limit") ?? "10";
    const search = (url.searchParams.get("search") ?? "").trim();

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

    const tagService = createTagService();

    const { tags, pagination } = await tagService.getTags({
      page,
      limit,
      search,
    });

    return Response.json(
      {
        success: true,
        data: tags,
        pagination,
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
// GET TAG BY ID
// ============================================

export async function getTagByIdController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedTagId(context);

    const tagService = createTagService();

    const tag = await tagService.getTagById(id);

    return Response.json(
      {
        success: true,
        data: tag,
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
// UPDATE TAG
// ============================================

export async function updateTagController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedTagId(context);

    const body = await parseJsonBody(request);

    const validatedData =
      await validateUpdateTagInput(body);

    const tagService = createTagService();

    const tag = await tagService.updateTag(
      id,
      validatedData
    );

    return Response.json(
      {
        success: true,
        message: "Tag updated successfully",
        data: tag,
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
// DELETE TAG
// ============================================

export async function deleteTagController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedTagId(context);

    const tagService = createTagService();

    await tagService.deleteTag(id);

    return Response.json(
      {
        success: true,
        message: "Tag deleted successfully",
      },
      {
        status: HTTP_STATUS.OK,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}
