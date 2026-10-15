import { redirect } from "next/navigation";
import { resolveAuthFromCookies } from "@/backend/lib/auth-context";

/**
 * Logged-in users should not see public auth pages.
 */
export default async function AuthGroupLayout({ children }) {
  const auth = await resolveAuthFromCookies();

  if (auth) {
    redirect("/admin");
  }

  return children;
}
