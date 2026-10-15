import { AppError } from "@/backend/errors/app-error";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

function conflict(message) {
  return new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
}

function badRequest(message, details) {
  return new AppError(
    details ? "Validation failed" : message,
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.VALIDATION_ERROR,
    details
  );
}

/**
 * Block delete when posts still reference the resource.
 */
export function assertCanDeleteReferenced(resourceLabel, postCount) {
  if (postCount > 0) {
    throw conflict(
      `Cannot delete ${resourceLabel} assigned to one or more posts`
    );
  }
}

/**
 * Tag delete: block unless force=true when in use.
 */
export function assertCanDeleteTag(postCount, { force = false } = {}) {
  if (postCount > 0 && !force) {
    throw conflict(
      `Tag is used by ${postCount} post(s). Pass force=true to detach and delete.`
    );
  }
}

/**
 * Normalize and validate publish/schedule rules. Mutates data.status when needed.
 */
export function applyPublishingPolicy(data, { hasContent }) {
  if (
    (data.status === "published" || data.status === "scheduled") &&
    !hasContent(data.content)
  ) {
    throw badRequest("Validation failed", {
      content: "Content is required for published or scheduled posts",
    });
  }

  if (
    data.status === "published" &&
    data.publishedAt &&
    new Date(data.publishedAt).getTime() > Date.now()
  ) {
    data.status = "scheduled";
  }

  if (data.status === "scheduled" && !data.publishedAt) {
    throw badRequest("Scheduled posts require publishedAt");
  }

  if (
    data.status === "scheduled" &&
    new Date(data.publishedAt).getTime() <= Date.now()
  ) {
    throw badRequest("Scheduled publish date must be in the future");
  }
}

/**
 * Featured media: null clears; non-null UUID must exist.
 */
export function assertFeaturedMediaAllowed(featuredMediaId, mediaExists) {
  if (featuredMediaId == null || featuredMediaId === "") {
    return;
  }

  if (!mediaExists) {
    throw badRequest("Validation failed", {
      featuredMediaId: "Featured media does not exist",
    });
  }
}
