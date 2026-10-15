import { getHealthStatus } from "@/backend/controllers/health.controller";

export async function GET(request) {
  return getHealthStatus(request);
}
