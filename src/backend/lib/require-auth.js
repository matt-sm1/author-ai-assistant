import "server-only";

import { redirect } from "next/navigation";
import { resolveAuthFromCookies } from "@/backend/lib/auth-context";

/**
 * SSR gate for admin pages. Uses the same session resolver as API withAuth.
 * @returns {Promise<{ userId: string, role: string, email: string, name: string }>}
 */
export async function requireAuth() {
  const auth = await resolveAuthFromCookies();

  if (!auth) {
    redirect("/");
  }

  return auth;
}
