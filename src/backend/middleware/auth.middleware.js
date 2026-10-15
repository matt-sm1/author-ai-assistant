import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { resolveAuthFromRequest } from "@/backend/lib/auth-context";

/**
 * Wraps a controller as (request, auth, context) where auth is AuthContext.
 */
export function withAuth(controller) {
  return async function authenticatedRequest(request, context) {
    try {
      const auth = await resolveAuthFromRequest(request);

      if (!auth) {
        return handleError(
          new AppError(
            "Unauthorized",
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED
          )
        );
      }

      return controller(request, auth, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Requires an authenticated user with one of the given roles.
 */
export function withRole(...roles) {
  const allowed = new Set(roles);

  return function withRoleWrapper(controller) {
    return withAuth(async function roleGuarded(request, auth, context) {
      if (!allowed.has(auth.role)) {
        return handleError(
          new AppError(
            "Forbidden",
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.FORBIDDEN
          )
        );
      }

      return controller(request, auth, context);
    });
  };
}
