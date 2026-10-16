import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/frontend/store/providers";

import "./globals.css";
import { Toaster } from "@/frontend/components/ui/Sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata = {
  title: {
    default: "AuthorBot Articles",
    template: "%s",
  },
  description:
    "Insights for modern authors — AI, reader engagement, and book marketing.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={jakarta.variable}>
         <Providers>
          {children}
        </Providers>

        <Toaster position="top-right" />
      </body>
    </html>
  );
}
