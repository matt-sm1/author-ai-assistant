import SiteHeader from "@/frontend/feature/blog/components/SiteHeader";
import SiteFooter from "@/frontend/feature/blog/components/SiteFooter";

export default function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)] text-slate-900">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
