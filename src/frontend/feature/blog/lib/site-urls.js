const DEFAULT_MARKETING = "https://ai-author-assistant-website.vercel.app";

export function getMarketingSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_MARKETING_SITE_URL?.trim();
  return (raw || DEFAULT_MARKETING).replace(/\/+$/, "");
}

export function getPublicSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "";
}

export function marketingPath(path = "/") {
  const base = getMarketingSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function publicPostUrl(slug) {
  const base = getPublicSiteUrl();
  if (base) return `${base}/${slug}`;
  return `/${slug}`;
}
