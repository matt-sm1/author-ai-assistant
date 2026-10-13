import { timingSafeEqual } from "node:crypto";

import { createPostService } from "@/backend/factories/post.factory";
import { handleError } from "@/backend/errors/error-handler";

export async function publishScheduledPostsController(request) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || expectedSecret.trim().length === 0) {
    

    return Response.json(
      {
        success: false,
        message: "Cron endpoint is not configured.",
      },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  const expectedBytes = Buffer.from(expectedSecret, "utf8");
  const suppliedBytes = Buffer.from(suppliedSecret, "utf8");

  const isAuthorized =
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes);

  if (!isAuthorized) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  try {
    const publishedPosts =
      await createPostService().publishScheduledPosts();

    return Response.json({
      success: true,
      publishedCount: publishedPosts.length,
    });
  } catch (error) {
    return handleError(error);
  }
}