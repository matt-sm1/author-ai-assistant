import { redirect } from "next/navigation";
import LoginForm from "@/frontend/feature/auth/components/LoginForm";
import { resolveAuthFromCookies } from "@/backend/lib/auth-context";

export const metadata = {
  title: "Login — Blog CMS",
  description: "Sign in to the AuthorBot blog CMS.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const auth = await resolveAuthFromCookies();

  if (auth) {
    redirect("/admin");
  }

  return <LoginForm />;
}
