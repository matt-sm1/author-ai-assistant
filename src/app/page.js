import { redirect } from "next/navigation";
import LoginForm from "@/frontend/feature/auth/components/LoginForm";
import { resolveAuthFromCookies } from "@/backend/lib/auth-context";

export default async function Home() {
  const auth = await resolveAuthFromCookies();

  if (auth) {
    redirect("/admin");
  }

  return <LoginForm />;
}
