import DashboardView from "@/frontend/components/dashboard/DashboardView";

export const metadata = {
  title: "Dashboard — Blog CMS",
  description: "Overview of posts and analytics for your blog.",
};

export default function DashboardPage() {
  return <DashboardView />;
}