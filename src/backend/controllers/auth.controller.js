import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { buildAuthCookie, buildClearCookie } from "@/backend/lib/auth-cookie";
import { createAuthService } from "@/backend/factories/auth.factory";
import {
  validateLoginInput,
  validateRegisterInput,
} from "@/backend/validators/auth.validator";

export async function meController(_request, userId) {
  try {
    const authService = createAuthService();
    const user = await authService.getUserById(userId);

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: HTTP_STATUS.UNAUTHORIZED,
        }
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

        const { token, user } = await authService.login(validatedData);

    return Response.json(
      { success: true, message: "Login successful", user },
      {
        status: HTTP_STATUS.OK,
        headers: { "Set-Cookie": buildAuthCookie(token) },
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function registerController(request) {
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

    const validatedData = await validateRegisterInput(body);
    const authService = createAuthService();
    const result = await authService.register(validatedData);

    return Response.json(
      {
        success: true,
        message: "Registration successful",
        ...result,
      },
      {
        status: HTTP_STATUS.CREATED,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function logoutController() {
  return Response.json(
    { success: true, message: "Logged out" },
    { status: HTTP_STATUS.OK, headers: { "Set-Cookie": buildClearCookie() } }
  );
}