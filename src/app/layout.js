import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/frontend/store/providers";

import "./globals.css";
import { Toaster } from "@/frontend/components/ui/Sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

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
