/**
 * Shared slug generator for client form fields and server uniqueness.
 */
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
