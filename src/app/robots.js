import { getPublicSiteUrl } from "@/frontend/feature/blog/lib/site-urls";

/** Allow public blog indexing; keep CMS out of search. */
export default function robots() {
  const site = getPublicSiteUrl() || "https://authoraiassistant.com/blogs";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
