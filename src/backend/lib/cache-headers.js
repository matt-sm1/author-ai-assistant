/** Soft SWR for authenticated JSON list responses (private to the browser). */
export const LIST_CACHE_CONTROL =
  "private, max-age=0, stale-while-revalidate=30";

export function jsonWithListCache(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", LIST_CACHE_CONTROL);
  return Response.json(body, { ...init, headers });
}
