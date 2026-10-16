import { marketingPath } from "@/frontend/feature/blog/lib/site-urls";

const MAIN_PAGES = [
  { label: "Home", href: marketingPath("/") },
  { label: "Product", href: marketingPath("/product") },
  { label: "Features", href: marketingPath("/features") },
  { label: "Pricing", href: marketingPath("/pricing") },
  { label: "Contact", href: marketingPath("/contact") },
];

const EXPLORE = [
  { label: "Always-On", href: marketingPath("/#always-on") },
  { label: "FAQ", href: marketingPath("/#faq") },
  { label: "Articles", href: "/" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/5 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="text-lg font-semibold text-white">Author AI Assistant</p>
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            Join our newsletter to stay up to date on features and releases.
          </p>
          <a
            href={marketingPath("/contact")}
            className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90"
          >
            Subscribe
          </a>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
            Main Pages
          </h2>
          <ul className="space-y-2 text-sm">
            {MAIN_PAGES.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
            Explore
          </h2>
          <ul className="space-y-2 text-sm">
            {EXPLORE.map((item) => (
              <li key={item.label}>
                <a href={item.href} className="hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} AuthorBot. All rights reserved.
      </div>
    </footer>
  );
}
