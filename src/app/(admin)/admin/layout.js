
import DashboardShell from "@/frontend/components/layout/DashboardShell";

export default function Layout({ children }) {
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
