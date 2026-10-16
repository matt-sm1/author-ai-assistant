/** Soft SWR for authenticated JSON list responses (private to the browser). */
export const LIST_CACHE_CONTROL =
  "private, max-age=0, stale-while-revalidate=30";

/** CDN-friendly SWR for published public blog reads. */
export const PUBLIC_CACHE_CONTROL =
  "public, s-maxage=60, stale-while-revalidate=300";

export function jsonWithListCache(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", LIST_CACHE_CONTROL);
  return Response.json(body, { ...init, headers });
}

export function jsonWithPublicCache(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", PUBLIC_CACHE_CONTROL);
  return Response.json(body, { ...init, headers });
}
