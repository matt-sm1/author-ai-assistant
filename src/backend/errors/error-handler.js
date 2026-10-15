import { AppError } from "@/backend/errors/app-error";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { HTTP_STATUS } from "@/backend/constants/http-status";

export function handleError(error) {
  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        message: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
      {
        status: error.statusCode,
      }
    );
  }


  console.error("[api]", error?.message || error, error?.stack);

  return Response.json(
    {
      success: false,
      message: "Something went wrong",
      code: ERROR_CODES.INTERNAL_ERROR,
    },
    {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    }
  );
}