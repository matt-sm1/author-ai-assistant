function hostingerRemotePatterns() {
  const patterns = [
    {
      protocol: "https",
      hostname: "**.hostingersite.com",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "**.hostinger.site",
      pathname: "/**",
    },
  ];

  const base = process.env.HOSTINGER_PUBLIC_BASE_URL?.trim();
  if (base) {
    try {
      const { hostname, protocol } = new URL(base);
      if (hostname && protocol.startsWith("http")) {
        patterns.unshift({
          protocol: protocol.replace(":", ""),
          hostname,
          pathname: "/**",
        });
      }
    } catch {
      /* ignore invalid env */
    }
  }

  return patterns;
}

/** Served at authoraiassistant.com/blogs via marketing-site rewrite. */
const BASE_PATH = "/blogs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: BASE_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  images: {
    // MediaImage uses native <img> for remotes; keep allowlist for any residual next/image usage.
    remotePatterns: hostingerRemotePatterns(),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
