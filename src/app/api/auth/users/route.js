import { createUserController } from "@/backend/controllers/auth.controller";
import { withRole } from "@/backend/middleware/auth.middleware";

export const POST = withRole("admin")(createUserController);
