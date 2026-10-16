import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function getSigningSecret() {
  const secret = process.env.HOSTINGER_MEDIA_SIGNING_SECRET?.trim();
  if (!secret) {
    throw new Error("HOSTINGER_MEDIA_SIGNING_SECRET is not configured");
  }
  return secret;
}

function canonicalPayload(fields) {
  const keys = Object.keys(fields).sort();
  return keys.map((k) => `${k}=${fields[k]}`).join("\n");
}

function sign(fields) {
  const secret = getSigningSecret();
  return createHmac("sha256", secret)
    .update(canonicalPayload(fields))
    .digest("hex");
}

function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Issue a short-lived upload ticket for Hostinger direct upload.
 */
export function issueUploadTicket({
  mediaId,
  storageKey,
  maxBytes,
  mime,
  resourceType,
  ttlSec,
}) {
  const ttl =
    ttlSec ??
    Number(process.env.HOSTINGER_UPLOAD_TICKET_TTL_SEC || 900);
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttl);
  const nonce = randomBytes(16).toString("hex");

  const fields = {
    mediaId: String(mediaId),
    storageKey: String(storageKey),
    maxBytes: String(maxBytes),
    mime: String(mime),
    resourceType: String(resourceType),
    exp: String(exp),
    nonce,
  };

  return {
    ...fields,
    sig: sign(fields),
  };
}

/**
 * Verify a ticket object (from query/JSON). Returns normalized fields.
 */
export function verifyUploadTicket(ticket) {
  if (!ticket || typeof ticket !== "object") {
    throw new Error("Invalid upload ticket");
  }

  const fields = {
    mediaId: String(ticket.mediaId ?? ""),
    storageKey: String(ticket.storageKey ?? ""),
    maxBytes: String(ticket.maxBytes ?? ""),
    mime: String(ticket.mime ?? ""),
    resourceType: String(ticket.resourceType ?? ""),
    exp: String(ticket.exp ?? ""),
    nonce: String(ticket.nonce ?? ""),
  };

  const expected = sign(fields);
  if (!safeEqualHex(expected, String(ticket.sig ?? ""))) {
    throw new Error("Invalid upload ticket signature");
  }

  const exp = Number(fields.exp);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Upload ticket expired");
  }

  const maxBytes = Number(fields.maxBytes);
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("Invalid ticket maxBytes");
  }

  if (!["image", "video"].includes(fields.resourceType)) {
    throw new Error("Invalid ticket resourceType");
  }

  return {
    mediaId: fields.mediaId,
    storageKey: fields.storageKey,
    maxBytes,
    mime: fields.mime,
    resourceType: fields.resourceType,
    exp,
    nonce: fields.nonce,
  };
}

/**
 * Hostinger issues this after a successful complete/upload.
 */
export function issueUploadReceipt({
  mediaId,
  storageKey,
  bytes,
  sha256,
  width = null,
  height = null,
  format,
  resourceType,
  ttlSec = 900,
}) {
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSec);
  const fields = {
    mediaId: String(mediaId),
    storageKey: String(storageKey),
    bytes: String(bytes),
    sha256: String(sha256).toLowerCase(),
    width: width == null ? "" : String(width),
    height: height == null ? "" : String(height),
    format: String(format || ""),
    resourceType: String(resourceType),
    exp: String(exp),
  };

  return {
    ...fields,
    sig: sign(fields),
  };
}

export function verifyUploadReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") {
    throw new Error("Invalid upload receipt");
  }

  const fields = {
    mediaId: String(receipt.mediaId ?? ""),
    storageKey: String(receipt.storageKey ?? ""),
    bytes: String(receipt.bytes ?? ""),
    sha256: String(receipt.sha256 ?? "").toLowerCase(),
    width: String(receipt.width ?? ""),
    height: String(receipt.height ?? ""),
    format: String(receipt.format ?? ""),
    resourceType: String(receipt.resourceType ?? ""),
    exp: String(receipt.exp ?? ""),
  };

  const expected = sign(fields);
  if (!safeEqualHex(expected, String(receipt.sig ?? ""))) {
    throw new Error("Invalid upload receipt signature");
  }

  const exp = Number(fields.exp);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Upload receipt expired");
  }

  const bytes = Number(fields.bytes);
  if (!Number.isSafeInteger(bytes) || bytes <= 0) {
    throw new Error("Invalid receipt bytes");
  }

  if (!/^[a-f0-9]{64}$/.test(fields.sha256)) {
    throw new Error("Invalid receipt checksum");
  }

  return {
    mediaId: fields.mediaId,
    storageKey: fields.storageKey,
    bytes,
    sha256: fields.sha256,
    width: fields.width === "" ? null : Number(fields.width),
    height: fields.height === "" ? null : Number(fields.height),
    format: fields.format,
    resourceType: fields.resourceType,
    exp,
  };
}

/** Server-to-server delete authorization for Hostinger. */
export function issueDeleteToken(storageKey, ttlSec = 300) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const fields = {
    storageKey: String(storageKey),
    exp: String(exp),
    op: "delete",
  };
  return { ...fields, sig: sign(fields) };
}

export function verifyDeleteToken(token) {
  const fields = {
    storageKey: String(token?.storageKey ?? ""),
    exp: String(token?.exp ?? ""),
    op: "delete",
  };
  const expected = sign(fields);
  if (!safeEqualHex(expected, String(token?.sig ?? ""))) {
    throw new Error("Invalid delete token");
  }
  const exp = Number(fields.exp);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Delete token expired");
  }
  return { storageKey: fields.storageKey, exp };
}
