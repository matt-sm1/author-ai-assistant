import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";

import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

import { createPostService } from "@/backend/factories/post.factory";

import {
  validateCreatePostInput,
  validateUpdatePostInput,
  validatePostId,
  validateListPostsQuery,
} from "@/backend/validators/post.validator";
import { assertSafePagination } from "@/backend/lib/pagination";

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

async function getValidatedPostId(context) {
  const params = await context?.params;

  return validatePostId(params?.id);
}

// ============================================
// CREATE POST
// ============================================

export async function createPostController(request) {
  try {
    const body = await parseJsonBody(request);

    const validatedData = await validateCreatePostInput(body);

    const postService = createPostService();

    const post = await postService.createPost(validatedData);

    return Response.json(
      {
        success: true,
        message: "Post created successfully",
        data: post,
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
// GET ALL POSTS
// ============================================

export async function getPostsController(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validates and normalizes page, limit, filters and sorting.
    // Invalid values throw a 400 VALIDATION_ERROR.
    const query = await validateListPostsQuery(
      Object.fromEntries(searchParams)
    );

    assertSafePagination(query.page, query.limit);

    const postService = createPostService();

    const result = await postService.getPosts(query);

    return Response.json(
      {
        success: true,
        data: result.posts,
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
// GET POST BY ID
// ============================================

export async function getPostByIdController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedPostId(context);

    const postService = createPostService();

    const post = await postService.getPostById(id);

    return Response.json(
      {
        success: true,
        data: post,
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
// UPDATE POST
// ============================================

export async function updatePostController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedPostId(context);

    const body = await parseJsonBody(request);

    const validatedData = await validateUpdatePostInput(body);

    const postService = createPostService();

    const post = await postService.updatePost(
      id,
      validatedData
    );

    return Response.json(
      {
        success: true,
        message: "Post updated successfully",
        data: post,
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
// DELETE POST
// ============================================

export async function deletePostController(
  request,
  userId,
  context
) {
  try {
    const id = await getValidatedPostId(context);

    const postService = createPostService();

    await postService.deletePost(id);

    return Response.json(
      {
        success: true,
        message: "Post deleted successfully",
      },
      {
        status: HTTP_STATUS.OK,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}