import Link from "next/link";
import { marketingPath } from "@/frontend/feature/blog/lib/site-urls";

const NAV = [
  { label: "Home", href: marketingPath("/") },
  { label: "Product", href: marketingPath("/product") },
  { label: "Features", href: marketingPath("/features") },
  { label: "Pricing", href: marketingPath("/pricing") },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg"
        >
          Author AI Assistant
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex"
        >
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
          <span className="text-slate-900" aria-current="page">
            Articles
          </span>
        </nav>

        <a
          href={marketingPath("/contact")}
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Get Started
        </a>
      </div>
    </header>
  );
}
