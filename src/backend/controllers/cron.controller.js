import { createPostService } from "@/backend/factories/post.factory";
import { handleError } from "@/backend/errors/error-handler";
import { secretsEqual } from "@/backend/lib/secure-compare";

export async function publishScheduledPostsController(request) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || expectedSecret.trim().length === 0) {
    return Response.json(
      {
        success: false,
        message: "Cron endpoint is not configured.",
      },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!secretsEqual(expectedSecret, suppliedSecret)) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const publishedPosts = await createPostService().publishScheduledPosts();

    return Response.json({
      success: true,
      publishedCount: publishedPosts.length,
      published: publishedPosts.map((post) => ({
        id: post.id,
        slug: post.slug,
        published_at: post.published_at,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
