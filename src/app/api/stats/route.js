import { getStatsController } from "@/backend/controllers/stats.controller";
import { withAuth } from "@/backend/middleware/auth.middleware";

export const GET = withAuth(getStatsController);
