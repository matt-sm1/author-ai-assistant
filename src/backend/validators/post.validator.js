import * as yup from "yup";

import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

// ============================================
// CONSTANTS
// ============================================

const POST_STATUSES = ["draft", "published", "scheduled", "archived"];

const POST_VISIBILITIES = ["public", "private"];

// Password visibility will be enabled when
// password protection is implemented.

// Must match the whitelist in post.repository.js
const SORT_FIELDS = [
  "created_at",
  "updated_at",
  "published_at",
  "title",
  "status",
];

// ============================================
// COMMON SCHEMAS
// ============================================

const uuidSchema = yup
  .string()
  .uuid("Invalid UUID format")
  .required("ID is required");

const nullableText = (max) =>
  yup.string().trim().max(max).nullable().default(null);

const tagsSchema = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .min(1, "Tag cannot be empty")
      .max(100, "Tag is too long")
      .required(),
  )
  .max(30, "Maximum 30 tags allowed")
  .default([]);

// ============================================
// CREATE POST SCHEMA
// ============================================

const createPostSchema = yup
  .object({
    title: yup
      .mixed()
      .required("Title is required")
      .test(
        "is-string",
        "Title must be a string",
        (value) => typeof value === "string",
      )
      .test(
        "valid-title",
        "Title must be between 1 and 255 characters",
        (value) =>
          typeof value === "string" &&
          value.trim().length >= 1 &&
          value.trim().length <= 255,
      )
      .transform((value) => (typeof value === "string" ? value.trim() : value)),

    content: nullableText(1000000),

    excerpt: nullableText(2000),

    featuredImage: nullableText(2048),

    status: yup
      .string()
      .oneOf(POST_STATUSES, "Invalid post status")
      .default("draft"),

    visibility: yup
      .string()
      .oneOf(POST_VISIBILITIES, "Invalid visibility")
      .default("public"),

    publishedAt: yup.date().nullable().default(null),

    categoryId: yup
      .string()
      .uuid("Invalid category ID")
      .nullable()
      .default(null),

    tags: tagsSchema,

    seoTitle: nullableText(255),

    metaDescription: nullableText(160),
  })
  .required();

// ============================================
// UPDATE POST SCHEMA
// ============================================

// Current update API expects full post data.
// Preserve that contract for PUT requests.

const updatePostSchema = createPostSchema.clone();

// ============================================
// LIST POSTS QUERY SCHEMA
// ============================================

// Query strings often arrive as empty values (e.g. ?status=&page=).
// Treat empty strings as "not provided".
const emptyToUndefined = (value, original) =>
  typeof original === "string" && original.trim() === "" ? undefined : value;

const optionalUuid = (label) =>
  yup
    .string()
    .transform(emptyToUndefined)
    .uuid(`Invalid ${label}`)
    .optional();

const optionalDate = (label) =>
  yup
    .date()
    .transform(emptyToUndefined)
    .typeError(`Invalid ${label}`)
    .optional();

const listPostsQuerySchema = yup.object({
  page: yup
    .number()
    .transform(emptyToUndefined)
    .typeError("Page must be a number")
    .integer("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),

  limit: yup
    .number()
    .transform(emptyToUndefined)
    .typeError("Limit must be a number")
    .integer("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),

  search: yup.string().trim().max(255, "Search is too long").optional(),

  status: yup
    .string()
    .transform(emptyToUndefined)
    .oneOf(POST_STATUSES, "Invalid post status")
    .optional(),

  visibility: yup
    .string()
    .transform(emptyToUndefined)
    .oneOf(POST_VISIBILITIES, "Invalid visibility")
    .optional(),

  categoryId: optionalUuid("category ID"),
  authorId: optionalUuid("author ID"),
  tagId: optionalUuid("tag ID"),

  createdFrom: optionalDate("createdFrom date"),
  createdTo: optionalDate("createdTo date"),
  publishedFrom: optionalDate("publishedFrom date"),
  publishedTo: optionalDate("publishedTo date"),

  sortBy: yup
    .string()
    .transform(emptyToUndefined)
    .oneOf(SORT_FIELDS, "Invalid sort field")
    .optional(),

  sortOrder: yup
    .string()
    .transform(emptyToUndefined)
    .lowercase()
    .oneOf(["asc", "desc"], "Sort order must be asc or desc")
    .optional(),
});

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

      const issues = error.inner.length ? error.inner : [error];

      for (const item of issues) {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
      }

      throw new AppError(
        "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        errors,
      );
    }

    throw error;
  }
}

// ============================================
// EXPORTED VALIDATORS
// ============================================

export function validateCreatePostInput(data) {
  return validateInput(createPostSchema, data);
}

export function validateUpdatePostInput(data) {
  return validateInput(updatePostSchema, data);
}

export function validatePostId(id) {
  return validateInput(uuidSchema, id);
}

export function validateListPostsQuery(query) {
  return validateInput(listPostsQuerySchema, query);
}