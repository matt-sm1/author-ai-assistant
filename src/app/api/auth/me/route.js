import { meController } from "@/backend/controllers/auth.controller";
import { withAuth } from "@/backend/middleware/auth.middleware";

const authenticatedMeController = withAuth(meController);

export async function GET(request) {
  return authenticatedMeController(request);
}
