import { handleError } from "@/backend/errors/error-handler";
import { HTTP_STATUS } from "@/backend/constants/http-status";
import { createStatsService } from "@/backend/services/stats.service";
import { jsonWithListCache } from "@/backend/lib/cache-headers";

export async function getStatsController() {
  try {
    const stats = await createStatsService().getDashboardStats();

    return jsonWithListCache(
      { success: true, data: stats },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    return handleError(error);
  }
}
