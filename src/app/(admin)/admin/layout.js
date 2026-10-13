
import DashboardShell from "@/frontend/components/layout/DashboardShell";
import { requireAuth } from "@/backend/lib/require-auth";

export default async function Layout({ children }) {
  await requireAuth();

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
