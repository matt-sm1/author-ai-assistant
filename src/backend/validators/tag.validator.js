
import * as yup from "yup";

import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

// ============================================
// TAG NAME VALIDATION
// ============================================

const tagNameSchema = yup
  .mixed()
  .required("Tag name is required")
  .test(
    "is-string",
    "Tag name must be a string",
    (value) => typeof value === "string"
  )
  .test(
    "valid-name",
    "Tag name must be between 1 and 100 characters",
    (value) =>
      typeof value === "string" &&
      value.trim().length >= 1 &&
      value.trim().length <= 100
  )
  .transform((value) =>
    typeof value === "string" ? value.trim() : value
  );

// ============================================
// CREATE TAG SCHEMA
// ============================================

const createTagSchema = yup
  .object({
    name: tagNameSchema,
  })
  .required();

// ============================================
// UPDATE TAG SCHEMA
// ============================================

const updateTagSchema = createTagSchema.clone();

// ============================================
// TAG ID SCHEMA
// ============================================

const tagIdSchema = yup
  .string()
  .uuid("Invalid tag ID")
  .required("Tag ID is required");

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

      const issues = error.inner.length
        ? error.inner
        : [error];

      for (const item of issues) {
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
// EXPORTED VALIDATORS
// ============================================

export function validateCreateTagInput(data) {
  return validateInput(createTagSchema, data);
}

export function validateUpdateTagInput(data) {
  return validateInput(updateTagSchema, data);
}

export function validateTagId(id) {
  return validateInput(tagIdSchema, id);
}
