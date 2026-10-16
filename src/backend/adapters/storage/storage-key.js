import { randomBytes } from "node:crypto";

/** @type {RegExp} */
export const STORAGE_KEY_PATTERN =
  /^media\/\d{4}\/\d{2}\/[0-9A-HJKMNP-TV-Z]{26}\.[a-z0-9]+$/;

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Crockford Base32 ULID (26 chars). Sortable by time prefix.
 */
export function generateUlid(now = Date.now()) {
  let time = now;
  let timePart = "";
  for (let i = 0; i < 10; i += 1) {
    timePart = CROCKFORD[time % 32] + timePart;
    time = Math.floor(time / 32);
  }

  const rand = randomBytes(16);
  let randPart = "";
  for (let i = 0; i < 16; i += 1) {
    randPart += CROCKFORD[rand[i] % 32];
  }

  return timePart + randPart.slice(0, 16);
}

export function assertSafeStorageKey(storageKey) {
  if (
    typeof storageKey !== "string" ||
    storageKey.includes("\0") ||
    storageKey.includes("..") ||
    storageKey.startsWith("/") ||
    !STORAGE_KEY_PATTERN.test(storageKey)
  ) {
    throw new Error("Invalid storage key");
  }
  return storageKey;
}

/**
 * @param {string} ext lowercase extension without dot
 */
export function buildMediaStorageKey(ext, now = new Date()) {
  const safeExt = String(ext || "bin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);

  if (!safeExt) {
    throw new Error("Invalid media extension");
  }

  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const key = `media/${yyyy}/${mm}/${generateUlid(now.getTime())}.${safeExt}`;
  return assertSafeStorageKey(key);
}

/**
 * Public URL for a storage key.
 * Key `media/YYYY/MM/file.ext` → `{HOSTINGER_PUBLIC_BASE_URL}/media/YYYY/MM/file.ext`
 * which maps to disk `public_html/media/YYYY/MM/file.ext` (PHP strips the leading media/).
 */
export function publicUrlForKey(baseUrl, storageKey) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  assertSafeStorageKey(storageKey);
  return `${base}/${storageKey}`;
}
