import { JwtAdapter } from "@/backend/adapters/jwt.adapter";
import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { getTokenFromRequest } from "@/backend/lib/auth-cookie";
const tokenProvider = new JwtAdapter();

function getUserId(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const payload = tokenProvider.verify(token);
    const userId = typeof payload === "object" && payload ? payload.sub : null;
    return typeof userId === "string" && userId ? userId : null;
  } catch {
    return null;
  }
}

export function withAuth(controller) {
  return async function authenticatedRequest(request, context) {
    const userId = getUserId(request);

    if (!userId) {
      return handleError(
        new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED)
      );
    }

    return controller(request, userId, context);
  };
}