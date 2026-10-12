const COOKIE_NAME = "token";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // JWT ki 7d expiry ke barabar

function baseParts() {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts;
}

export function buildAuthCookie(token) {
  return [`${COOKIE_NAME}=${token}`, ...baseParts(), `Max-Age=${MAX_AGE_SECONDS}`].join("; ");
}

export function buildClearCookie() {
  return [`${COOKIE_NAME}=`, ...baseParts(), "Max-Age=0"].join("; ");
}

export function getTokenFromRequest(request) {
  const header = request.headers.get("cookie") ?? "";
  const entry = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return entry ? entry.slice(COOKIE_NAME.length + 1) : null;
}