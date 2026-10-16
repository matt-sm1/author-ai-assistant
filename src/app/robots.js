/** Block all crawlers — site is not for public search indexing. */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
  };
}
