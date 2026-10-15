import * as yup from "yup";
import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

/** Email address, or a simple username like `admin`. */
const loginIdentifierSchema = yup
  .string()
  .trim()
  .lowercase()
  .required("Email or username is required")
  .test(
    "email-or-username",
    "Enter a valid email address or username",
    (value) => {
      if (!value) return false;
      if (value.includes("@")) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      return /^[a-z0-9._-]{3,64}$/.test(value);
    }
  );

const loginSchema = yup
  .object({
    email: loginIdentifierSchema,
    password: yup.string().required("Password is required"),
  })
  .required();

const createUserSchema = yup
  .object({
    name: yup
      .string()
      .trim()
      .max(100, "Name cannot exceed 100 characters")
      .required("Name is required"),
    email: loginIdentifierSchema,
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password cannot exceed 72 characters")
      .required("Password is required"),
    role: yup
      .string()
      .oneOf(["admin", "editor"], "Role must be admin or editor")
      .default("editor"),
  })
  .required();

async function validateInput(schema, data) {
  try {
    return await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors = {};

      error.inner.forEach((item) => {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
      });

      throw new AppError(
        "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        errors
      );
    }

    throw error;
  }
}

export function validateLoginInput(data) {
  return validateInput(loginSchema, data);
}

/** @deprecated Public register removed — use validateCreateUserInput */
export function validateRegisterInput(data) {
  return validateInput(createUserSchema, data);
}

export function validateCreateUserInput(data) {
  return validateInput(createUserSchema, data);
}
