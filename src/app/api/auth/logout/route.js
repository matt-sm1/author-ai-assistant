import { logoutController } from "@/backend/controllers/auth.controller";

export async function POST() {
  return logoutController();
}