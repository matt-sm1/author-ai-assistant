import Image from "next/image";
import Link from "next/link";
import { marketingPath } from "@/frontend/feature/blog/lib/site-urls";

const MAIN_PAGES = [
  { label: "Home", href: marketingPath("/") },
  { label: "Product", href: marketingPath("/#integrations") },
  { label: "Features", href: marketingPath("/#features") },
  { label: "Pricing", href: marketingPath("/#contact") },
  { label: "Contact", href: marketingPath("/#contact") },
];

const EXPLORE = [
  { label: "Always-On", href: marketingPath("/#always-on") },
  { label: "FAQ", href: marketingPath("/#faq") },
  { label: "Articles", href: "/" },
];

export default function SiteFooter() {
  return (
    <footer className="section mt-auto border-t border-[var(--line)] bg-white text-[var(--theme-copy)]">
      <div className="mx-auto w-full max-w-[1344px] border-x border-[var(--line)] px-5 pt-16 sm:pt-20 md:pt-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-[120px]">
          <div className="w-full lg:w-[580px] lg:shrink-0">
            <a href={marketingPath("/")} aria-label="AuthorBot home">
              <Image
                src="/images/brand/logo.webp"
                alt="Author AI Assistant"
                width={160}
                height={54}
                className="h-8 w-auto object-contain sm:h-10"
              />
            </a>
            <p className="mt-5 max-w-[380px] text-[16px] font-normal leading-[24.8px] tracking-[-0.2px] text-[var(--theme-copy)]">
              Join our newsletter to stay up to date on features and releases.
            </p>
            <form
              className="mt-5 flex w-full max-w-[380.8px] gap-3 pb-6"
              action={marketingPath("/#contact")}
              method="get"
            >
              <label htmlFor="blog-newsletter-email" className="sr-only">
                Email
              </label>
              <input
                id="blog-newsletter-email"
                type="email"
                name="email"
                placeholder="Enter your email"
                className="min-h-[44px] min-w-0 flex-1 rounded-[8px] border-[0.8px] border-[var(--theme-border)] bg-[var(--theme-surface-muted)] px-[11.2px] py-2 text-[14px] text-[var(--theme-copy)] outline-none placeholder:text-[var(--theme-copy)]/60"
              />
              <button
                type="submit"
                className="min-h-[44px] shrink-0 rounded-[8px] bg-[var(--theme-copy)] px-5 py-2 text-[14px] font-medium text-white transition hover:opacity-90"
              >
                Subscribe
              </button>
            </form>
          </div>

          <div className="grid w-full grid-cols-2 gap-10 sm:gap-16 lg:flex-1 lg:justify-between">
            <div>
              <h4 className="text-base font-medium leading-[24.8px] text-[var(--theme-heading)]">
                Main Pages
              </h4>
              <ul className="mt-5 space-y-4">
                {MAIN_PAGES.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-base leading-[24.8px] text-[var(--theme-copy)] transition hover:text-[var(--theme-heading)]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-base font-medium leading-[24.8px] text-[var(--theme-heading)]">
                Explore
              </h4>
              <ul className="mt-5 space-y-4">
                {EXPLORE.map((item) => (
                  <li key={item.label}>
                    {item.href.startsWith("/") && !item.href.startsWith("//") ? (
                      <Link
                        href={item.href}
                        className="text-base leading-[24.8px] text-[var(--theme-copy)] transition hover:text-[var(--theme-heading)]"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-base leading-[24.8px] text-[var(--theme-copy)] transition hover:text-[var(--theme-heading)]"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[var(--line)] py-8 text-xs sm:flex-row sm:items-center">
          <p className="text-[14px] leading-[21.7px]">
            © {new Date().getFullYear()} AuthorBot. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-6">
            <a
              href={marketingPath("/#faq")}
              className="text-[14px] leading-[21.7px] text-[var(--theme-copy)] transition hover:text-[var(--theme-heading)]"
            >
              FAQ
            </a>
            <a
              href={marketingPath("/#contact")}
              className="text-[14px] leading-[21.7px] text-[var(--theme-copy)] transition hover:text-[var(--theme-heading)]"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
