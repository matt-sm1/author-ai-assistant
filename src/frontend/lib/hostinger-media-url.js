/**
 * Hostinger layout:
 *   media_root = public_html/media
 *   storage key = media/YYYY/MM/file.ext
 *
 * Older PHP wrote key under media_root → public_html/media/media/YYYY/...
 * Public URL was built as /media/YYYY/... (404). Nested URL works:
 *   /media/media/YYYY/...
 *
 * Prefer the nested form when rewriting; PHP lib.php now strips the leading
 * media/ so new files land at public_html/media/YYYY/... (flat). MediaImage
 * tries flat first, then nested on error.
 */

export function toNestedHostingerMediaUrl(src) {
  if (typeof src !== "string" || !src) return src;
  try {
    const url = new URL(src);
    // /media/2026/... → /media/media/2026/...
    if (
      /^\/media\/\d{4}\/\d{2}\//.test(url.pathname) &&
      !url.pathname.startsWith("/media/media/")
    ) {
      url.pathname = `/media${url.pathname}`;
      return url.toString();
    }
  } catch {
    /* ignore */
  }
  return src;
}

export function isHostingerMediaUrl(src) {
  if (typeof src !== "string" || !src) return false;
  try {
    const url = new URL(src);
    return (
      url.pathname.startsWith("/media/") &&
      (url.hostname.endsWith(".hostingersite.com") ||
        url.hostname.endsWith(".hostinger.site"))
    );
  } catch {
    return false;
  }
}
