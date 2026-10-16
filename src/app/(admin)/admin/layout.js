export const metadata = {
  robots: { index: false, follow: false },
};

/** Thin shell for all `/admin/*` routes (CMS + login). */
export default function AdminRootLayout({ children }) {
  return children;
}
