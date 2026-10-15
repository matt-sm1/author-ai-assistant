import { checkDatabaseConnection } from "@/backend/services/health.service";
import { secretsEqual } from "@/backend/lib/secure-compare";

export async function getHealthStatus(request) {
  const healthSecret = process.env.HEALTH_SECRET?.trim();

  if (healthSecret) {
    const authorization = request?.headers?.get?.("authorization") ?? "";
    const supplied = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";

    if (!secretsEqual(healthSecret, supplied)) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    if (healthSecret) {
      const database = await checkDatabaseConnection();
      return Response.json({
        success: true,
        message: "API is healthy",
        database,
      });
    }

    // Public health: minimal signal only.
    return Response.json({ success: true, ok: true });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
