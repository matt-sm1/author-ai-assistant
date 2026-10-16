import { getPublicSiteUrl } from "@/frontend/feature/blog/lib/site-urls";

export default function robots() {
  const base = getPublicSiteUrl() || "https://author-ai-assistant.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/register"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
