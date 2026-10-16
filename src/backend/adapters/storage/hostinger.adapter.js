import { AppError } from "@/backend/errors/app-error";
import { ERROR_CODES } from "@/backend/constants/error-codes";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import {
  assertSafeStorageKey,
  publicUrlForKey,
} from "@/backend/adapters/storage/storage-key";
import { issueDeleteToken } from "@/backend/lib/media-ticket";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AppError(
      `${name} is not configured`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.STORAGE_PROVIDER_ERROR,
    );
  }
  return value;
}

function apiBase() {
  return requireEnv("HOSTINGER_MEDIA_API_BASE_URL").replace(/\/+$/, "");
}

function publicBase() {
  return requireEnv("HOSTINGER_PUBLIC_BASE_URL").replace(/\/+$/, "");
}

async function postJson(url, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hostinger adapter: server-side delete / URL helpers only.
 * Browser uploads go directly to Hostinger with HMAC tickets.
 */
export class HostingerAdapter {
  getThumbnailUrl(storageKey, resourceType) {
    try {
      assertSafeStorageKey(storageKey);
      const url = publicUrlForKey(publicBase(), storageKey);
      if (resourceType === "image" || resourceType === "video") {
        return url;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Not used for Hostinger (direct browser upload). Kept to fail loudly.
   */
  async upload() {
    throw new AppError(
      "Hostinger media uses direct browser upload. Call /api/media/upload-session instead.",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  async uploadFromUrl() {
    throw new AppError(
      "uploadFromUrl is not supported for Hostinger storage",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  async delete(storageKey) {
    assertSafeStorageKey(storageKey);
    const timeoutMs = Number(
      process.env.HOSTINGER_UPLOAD_TIMEOUT_MS || 30000,
    );
    const token = issueDeleteToken(storageKey);
    const url = `${apiBase()}/delete.php`;

    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const { ok, status, data } = await postJson(
          url,
          { token },
          timeoutMs,
        );

        if (ok || status === 404 || data?.result === "not found") {
          return { result: data?.result === "not found" ? "not found" : "ok" };
        }

        lastError = new AppError(
          data?.message || "Hostinger delete failed",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.STORAGE_PROVIDER_ERROR,
        );
      } catch (error) {
        lastError = error;
        if (error?.name === "AbortError") {
          lastError = new AppError(
            "Hostinger delete timed out",
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            ERROR_CODES.STORAGE_PROVIDER_ERROR,
          );
        }
      }
    }

    throw lastError;
  }
}
