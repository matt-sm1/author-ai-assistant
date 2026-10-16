/**
 * Shared slug generator for client form fields and server uniqueness.
 */

/** Segments that must not collide with app routes under `/[slug]`. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "register",
  "tinymce",
  "blogs",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function isReservedSlug(slug) {
  if (!slug) return false;
  return RESERVED_SLUGS.has(String(slug).toLowerCase());
}

export function generateSlug(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
