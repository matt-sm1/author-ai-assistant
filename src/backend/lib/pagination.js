import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

/**
 * Validate page/limit and ensure (page-1)*limit is a safe integer for SQL OFFSET.
 */
export function assertSafePagination(page, limit, { maxLimit = 100 } = {}) {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > maxLimit ||
    !Number.isSafeInteger((page - 1) * limit)
  ) {
    throw new AppError(
      "Invalid pagination parameters",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  return { page, limit, offset: (page - 1) * limit };
}

export function parsePaginationParams(searchParams, defaults = {}) {
  const page = Number(searchParams.get("page") ?? defaults.page ?? 1);
  const limit = Number(searchParams.get("limit") ?? defaults.limit ?? 10);
  return assertSafePagination(page, limit, {
    maxLimit: defaults.maxLimit ?? 100,
  });
}
