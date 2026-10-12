import { AppError } from "@/backend/errors/app-error";
import { handleError } from "@/backend/errors/error-handler";

import { HTTP_STATUS } from "@/backend/constants/http-status";
import { ERROR_CODES } from "@/backend/constants/error-codes";

import { createMediaService } from "@/backend/factories/media.factory";

import { Readable } from "node:stream";

// ============================================
// REQUEST HELPERS
// ============================================

function badRequest(message) {
  return new AppError(
    message,
    HTTP_STATUS.BAD_REQUEST,
    ERROR_CODES.VALIDATION_ERROR,
  );
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new AppError(
      "Invalid JSON body",
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_JSON,
    );
  }
}

// ============================================
// UPLOAD MEDIA
// ============================================


export async function uploadMediaController(request, userId) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const MAX_REQUEST_SIZE = 105 * 1024 * 1024; // 105 MB

    if (
      !contentType.toLowerCase().startsWith("multipart/form-data")
    ) {
      throw badRequest("Multipart form data is required");
    }

    // ============================================
    // CHECK CONTENT LENGTH
    // ============================================

    const contentLength = request.headers.get("content-length");

    if (contentLength !== null) {
      const size = Number(contentLength);

      if (
        !Number.isSafeInteger(size) ||
        size < 0 ||
        size > MAX_REQUEST_SIZE
      ) {
        throw badRequest("Upload request is too large");
      }
    }

    // ============================================
    // READ REQUEST WITH SIZE LIMIT
    // ============================================

    if (!request.body) {
      throw badRequest("Upload request body is missing");
    }

    const chunks = [];
    let totalBytes = 0;

    const stream = Readable.fromWeb(request.body);

    for await (const chunk of stream) {
      totalBytes += chunk.length;

      if (totalBytes > MAX_REQUEST_SIZE) {
        stream.destroy();
        throw badRequest("Upload request is too large");
      }

      chunks.push(chunk);
    }

    // ============================================
    // PARSE MULTIPART DATA
    // ============================================

    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: {
        "content-type": contentType,
      },
      body: Buffer.concat(chunks),
    });

    const formData = await boundedRequest.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw badRequest("Please select a valid image or video");
    }

    // ============================================
    // UPLOAD MEDIA
    // ============================================

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const mediaService = createMediaService();

    const media = await mediaService.uploadMedia(
      fileBuffer,
      file.name
    );

    return Response.json(
      {
        success: true,
        message: "Media uploaded successfully",
        data: media,
      },
      {
        status: HTTP_STATUS.CREATED,
      }
    );
  } catch (error) {
    return handleError(error);
  }
}


// ============================================
// GET ALL MEDIA
// ============================================

export async function getMediaController(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "10");
    const search = (searchParams.get("search") ?? "").trim();
    const resourceType = searchParams.get("resourceType") ?? "";

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw badRequest("Invalid pagination parameters");
    }

    if (!["", "image", "video"].includes(resourceType)) {
      throw badRequest("Invalid media type");
    }

    const mediaService = createMediaService();

    const result = await mediaService.getMedia({
      page,
      limit,
      search,
      resourceType,
    });

    return Response.json(
      {
        success: true,
        data: result.media,
        pagination: result.pagination,
      },
      { status: HTTP_STATUS.OK },
    );
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// GET MEDIA BY ID
// ============================================

export async function getMediaByIdController(request, userId, context) {
  try {
    const { id } = await context.params;

    const mediaService = createMediaService();
    const media = await mediaService.getMediaById(id);

    return Response.json(
      {
        success: true,
        data: media,
      },
      { status: HTTP_STATUS.OK },
    );
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// UPDATE MEDIA METADATA
// ============================================

export async function updateMediaController(request, userId, context) {
  try {
    const { id } = await context.params;
    const body = await parseJsonBody(request);

    const metadata = {};

    for (const field of ["alt_text", "caption", "description"]) {
      if (Object.hasOwn(body ?? {}, field)) {
        if (typeof body[field] !== "string") {
          throw badRequest(`${field} must be a string`);
        }

        metadata[field] = body[field].trim();
      }
    }

    if (Object.keys(metadata).length === 0) {
      throw badRequest("No valid metadata provided");
    }

    const mediaService = createMediaService();
    const media = await mediaService.updateMedia(id, metadata);

    return Response.json(
      {
        success: true,
        message: "Media updated successfully",
        data: media,
      },
      { status: HTTP_STATUS.OK },
    );
  } catch (error) {
    return handleError(error);
  }
}

// ============================================
// DELETE MEDIA
// ============================================

export async function deleteMediaController(request, userId, context) {
  try {
    const { id } = await context.params;

    const mediaService = createMediaService();

    await mediaService.deleteMedia(id);

    return Response.json(
      {
        success: true,
        message: "Media deleted successfully",
      },
      { status: HTTP_STATUS.OK },
    );
  } catch (error) {
    return handleError(error);
  }
}
