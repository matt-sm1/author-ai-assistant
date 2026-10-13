
import * as yup from "yup";

import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

// ============================================
// AUTHOR SCHEMA
// ============================================

const authorSchema = yup
  .object({
    name: yup
      .string()
      .trim()
      .required("Author name is required")
      .max(150, "Author name must not exceed 150 characters"),

    email: yup
      .string()
      .transform((value) =>
        typeof value === "string" && !value.trim()
          ? null
          : typeof value === "string"
            ? value.trim().toLowerCase()
            : value
      )
      .nullable()
      .optional()
      .email("Invalid author email")
      .max(255, "Author email must not exceed 255 characters"),

    bio: yup
      .string()
      .nullable()
      .optional()
      .max(5000, "Author bio must not exceed 5000 characters"),

    avatar_url: yup
      .string()
      .transform((value) =>
        typeof value === "string" && !value.trim()
          ? null
          : typeof value === "string"
            ? value.trim()
            : value
      )
      .nullable()
      .optional()
      .max(2048, "Avatar URL must not exceed 2048 characters")
      .test(
        "valid-url",
        "Avatar URL must be a valid HTTP or HTTPS URL",
        (value) => {
          if (!value) return true;

          try {
            const url = new URL(value);
            return ["http:", "https:"].includes(url.protocol);
          } catch {
            return false;
          }
        }
      ),
  })
  .required();

// ============================================
// AUTHOR UPDATE SCHEMA
// ============================================

const authorUpdateSchema = yup
  .object({
    name: authorSchema.fields.name.optional(),

    email: authorSchema.fields.email,

    bio: authorSchema.fields.bio,

    avatar_url: authorSchema.fields.avatar_url,

    is_active: yup
      .boolean()
      .optional()
      .typeError("is_active must be a boolean"),
  })
  .test(
    "at-least-one-field",
    "At least one field is required for update",
    (value) => Boolean(value && Object.keys(value).length > 0)
  )
  .required();

// ============================================
// AUTHOR ID SCHEMA
// ============================================

const authorIdSchema = yup
  .string()
  .uuid("Invalid author ID")
  .required("Author ID is required");

// ============================================
// VALIDATION HELPER
// ============================================

async function validateInput(schema, data) {
  try {
    return await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors = {};

      for (const item of error.inner.length ? error.inner : [error]) {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
      }

      if (Object.keys(errors).length === 0) {
        errors.body = error.message;
      }

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

// ============================================
// EXPORT VALIDATORS
// ============================================

export function validateCreateAuthorInput(data) {
  return validateInput(authorSchema, data);
}

export function validateUpdateAuthorInput(data) {
  return validateInput(authorUpdateSchema, data);
}

export function validateAuthorId(id) {
  return validateInput(authorIdSchema, id);
}