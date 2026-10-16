/**
 * Hostinger layout:
 *   media_root = public_html/media
 *   storage key = media/YYYY/MM/file.ext
 *
 * Older PHP wrote key under media_root → public_html/media/media/YYYY/...
 * Public URL was built as /media/YYYY/... (404). Nested URL works:
 *   /media/media/YYYY/...
 *
 * Until Hostinger files are moved to the flat layout, prefer nested URLs
 * in TinyMCE content and new API public URLs.
 */

const FLAT_MEDIA_PATH = /^\/media\/(\d{4}\/\d{2}\/.+)$/;

export function toNestedHostingerMediaUrl(src) {
  if (typeof src !== "string" || !src) return src;
  try {
    const url = new URL(src);
    // /media/2026/... → /media/media/2026/...
    if (
      FLAT_MEDIA_PATH.test(url.pathname) &&
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

/**
 * Rewrite flat Hostinger /media/YYYY/... URLs inside HTML to nested
 * /media/media/YYYY/... so TinyMCE and article bodies can load them.
 */
export function rewriteHostingerMediaUrlsInHtml(html) {
  if (typeof html !== "string" || !html) return html || "";

  return html.replace(
    /\b(src|href)=(["'])(https?:\/\/[^"']+)\2/gi,
    (match, attr, quote, url) => {
      const nested = toNestedHostingerMediaUrl(url);
      if (nested === url) return match;
      return `${attr}=${quote}${nested}${quote}`;
    },
  );
}
