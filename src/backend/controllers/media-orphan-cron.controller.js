import { createMediaService } from "@/backend/factories/media.factory";
import { handleError } from "@/backend/errors/error-handler";
import { secretsEqual } from "@/backend/lib/secure-compare";

export async function mediaOrphanCleanupController(request) {
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

  if (!secretsEqual(expectedSecret, suppliedSecret)) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  try {
    const result = await createMediaService().sweepExpiredUploads({
      limit: 100,
    });

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(error);
  }
}
