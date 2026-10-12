
import * as yup from "yup";

import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

// ============================================
// CATEGORY SCHEMA
// ============================================


const categorySchema = yup.object({
  name: yup
    .mixed()
    .test(
      "is-string",
      "Category name must be a string",
      (value) => typeof value === "string"
    )
    .required("Category name is required")
    .test(
      "valid-name",
      "Category name must be between 1 and 100 characters",
      (value) =>
        typeof value === "string" &&
        value.trim().length >= 1 &&
        value.trim().length <= 100
    )
    .transform((value) =>
      typeof value === "string" ? value.trim() : value
    ),
}).required();


// ============================================
// CATEGORY ID SCHEMA
// ============================================

const categoryIdSchema = yup
  .string()
  .uuid("Invalid category ID")
  .required("Category ID is required");

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

      for (const item of error.inner.length
        ? error.inner
        : [error]) {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
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

export function validateCreateCategoryInput(data) {
  return validateInput(categorySchema, data);
}

export function validateUpdateCategoryInput(data) {
  return validateInput(categorySchema, data);
}

export function validateCategoryId(id) {
  return validateInput(categoryIdSchema, id);
}
