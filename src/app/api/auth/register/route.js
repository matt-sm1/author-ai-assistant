import { registerController } from "@/backend/controllers/auth.controller";

export async function POST(request) {
  return registerController(request);
}