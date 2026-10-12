
/**
 * Shared Slug Generator
 *
 * Used by:
 * - PostService
 * - CategoryService
 * - TagService
 */

export function generateSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
