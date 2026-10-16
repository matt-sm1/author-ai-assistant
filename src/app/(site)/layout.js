import { Inter, Host_Grotesk } from "next/font/google";
import SiteHeader from "@/frontend/feature/blog/components/SiteHeader";
import SiteFooter from "@/frontend/feature/blog/components/SiteFooter";
import "@/frontend/feature/blog/styles/site-chrome.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-inter",
});

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-host-grotesk",
});

export default function SiteLayout({ children }) {
  return (
    <div
      className={`site-chrome flex min-h-screen flex-col antialiased ${inter.variable} ${hostGrotesk.variable}`}
    >
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
