import { Inter } from "next/font/google";
import SiteHeader from "@/frontend/feature/blog/components/SiteHeader";
import SiteFooter from "@/frontend/feature/blog/components/SiteFooter";
import "@/frontend/feature/blog/styles/site-chrome.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-site-inter",
});

export default function SiteLayout({ children }) {
  return (
    <div
      className={`site-chrome flex min-h-screen flex-col ${inter.variable}`}
      style={{ fontFamily: "var(--font-site-inter), var(--font-site)" }}
    >
      <SiteHeader active="articles" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
