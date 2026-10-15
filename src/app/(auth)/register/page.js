import { redirect } from "next/navigation";

export const metadata = {
  title: "Register — Blog CMS",
  description: "Public registration is disabled.",
};

/** Public self-registration removed; accounts are created by admins. */
export default function RegisterPage() {
  redirect("/");
}
