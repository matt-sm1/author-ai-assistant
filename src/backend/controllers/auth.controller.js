import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import {
  buildAuthCookie,
  buildClearCookie,
  getSessionIdFromRequest,
} from "@/backend/lib/auth-cookie";
import { createAuthService } from "@/backend/factories/auth.factory";
import {
  validateLoginInput,
  validateCreateUserInput,
} from "@/backend/validators/auth.validator";
import { rateLimit, clientKeyFromRequest } from "@/backend/lib/rate-limit";

export async function meController(_request, auth) {
  try {
    const authService = createAuthService();
    const user = await authService.getUserById(auth.userId);

    if (!user || user.status !== "active") {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    return Response.json({
      success: true,
      user,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function loginController(request) {
  try {
    const limited = rateLimit(clientKeyFromRequest(request, "login"), {
      limit: 20,
      windowMs: 60_000,
    });

    if (!limited.ok) {
      throw new AppError(
        "Too many login attempts. Try again shortly.",
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      throw new AppError(
        "Invalid JSON body",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_JSON
      );
    }

    const validatedData = await validateLoginInput(body);
    const authService = createAuthService();

    await authService.bootstrapAdminIfNeeded();

    const { sessionId, user } = await authService.login(validatedData);

    return Response.json(
      { success: true, message: "Login successful", user },
      {
        status: HTTP_STATUS.OK,
        headers: { "Set-Cookie": buildAuthCookie(sessionId) },
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Admin-only user creation. Replaces public registration.
 */
export async function createUserController(request, _auth) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      throw new AppError(
        "Invalid JSON body",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_JSON
      );
    }

    const validatedData = await validateCreateUserInput(body);
    const authService = createAuthService();
    const result = await authService.createUser(validatedData);

    return Response.json(
      {
        success: true,
        message: "User created successfully",
        ...result,
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    return handleError(error);
  }
}

/** Public register is disabled. */
export async function registerController() {
  return handleError(
    new AppError(
      "Public registration is disabled. An administrator must create accounts.",
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    )
  );
}

export async function logoutController(request) {
  try {
    const sessionId = getSessionIdFromRequest(request);
    const authService = createAuthService();
    await authService.logout(sessionId);

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Set-Cookie", buildClearCookie());
    // Clear legacy JWT cookie name during migration from token → session.
    headers.append(
      "Set-Cookie",
      ["token=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"].join("; ")
    );

    return new Response(
      JSON.stringify({ success: true, message: "Logged out" }),
      { status: HTTP_STATUS.OK, headers }
    );
  } catch (error) {
    return handleError(error);
  }
}
