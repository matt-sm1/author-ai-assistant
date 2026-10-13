import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { JwtAdapter } from "@/backend/adapters/jwt.adapter";

const COOKIE_NAME = "token";

export async function requireAuth() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token) redirect("/");

  try {
    const payload = new JwtAdapter().verify(token);
    if (typeof payload?.sub === "string" && payload.sub) {
      return payload.sub;
    }
  } catch {
    // Missing, expired, or invalid tokens should return to the login page.
  }

  redirect("/");
}
