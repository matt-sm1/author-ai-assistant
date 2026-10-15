export const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function baseParts() {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts;
}

export function buildAuthCookie(sessionId) {
  return [
    `${COOKIE_NAME}=${sessionId}`,
    ...baseParts(),
    `Max-Age=${MAX_AGE_SECONDS}`,
  ].join("; ");
}

export function buildClearCookie() {
  return [`${COOKIE_NAME}=`, ...baseParts(), "Max-Age=0"].join("; ");
}

export function getSessionIdFromRequest(request) {
  const header = request.headers.get("cookie") ?? "";
  const entry = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return entry ? entry.slice(COOKIE_NAME.length + 1) : null;
}

/** @deprecated Use getSessionIdFromRequest */
export function getTokenFromRequest(request) {
  return getSessionIdFromRequest(request);
}
