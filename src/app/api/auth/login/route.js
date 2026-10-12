import { loginController } from "@/backend/controllers/auth.controller";

export async function POST(request) {
  return loginController(request);
}