import { checkDatabaseConnection } from "@/backend/services/health.service";

export async function getHealthStatus() {
  try {
    const database = await checkDatabaseConnection();

    return Response.json({
      success: true,
      message: "API is healthy",
      database,
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return Response.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}