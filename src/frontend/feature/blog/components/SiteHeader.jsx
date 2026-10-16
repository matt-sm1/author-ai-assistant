"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { marketingPath } from "@/frontend/feature/blog/lib/site-urls";

const links = [
  { label: "Home", href: marketingPath("/") },
  { label: "Product", href: marketingPath("/#integrations") },
  { label: "Features", href: marketingPath("/#features") },
  { label: "Pricing", href: marketingPath("/#contact") },
];

/**
 * Pixel-matched port of marketing Header (ai-author-assistant-website).
 * Blog pages keep a solid bar (no -mb-20 overlay) since there is no hero under the nav.
 */
export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const onChange = (e) => e.matches && setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header
      data-enter="navbar"
      className={`sticky top-0 z-50 h-20 w-full border-b border-[var(--theme-border-subtle)] transition-[background-color,box-shadow] duration-300 ${
        scrolled || menuOpen ? "bg-white shadow-sm" : "bg-white"
      }`}
    >
      <div className="relative mx-auto flex h-20 w-[calc(100%-2rem)] max-w-[1200px] items-center justify-between sm:grid sm:w-[calc(100%-3rem)] sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center justify-self-start">
          <a
            href={marketingPath("/")}
            onClick={closeMenu}
            aria-label="AuthorBot home"
            className="flex items-center"
          >
            <Image
              src="/images/brand/logo.webp"
              alt="Author AI Assistant"
              width={160}
              height={54}
              priority
              className="h-9 w-auto object-contain sm:h-11"
            />
          </a>
        </div>

        <nav
          className="hidden items-center justify-center gap-8 sm:flex"
          aria-label="Main navigation"
        >
          {links.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={closeMenu}
              className="relative rounded-md px-1 py-2 font-sans text-[13px] font-medium text-[var(--theme-heading)] no-underline transition-[color,opacity] duration-200 hover:text-[var(--theme-accent)] md:text-[16px]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-self-end">
          <div className="hidden sm:block">
            <a
              href={marketingPath("/#contact")}
              data-btn
              className="inline-flex h-9 w-[112px] items-center justify-center rounded-lg bg-[linear-gradient(180deg,var(--theme-copy)_0%,var(--theme-heading)_100%)] px-3 py-0 font-sans text-xs font-medium leading-5 text-white no-underline transition-[opacity,transform] duration-200 ease-out hover:scale-[1.02] hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-copy)] active:scale-[0.98] md:h-10 md:w-[128px] md:text-[13px]"
            >
              Get Started
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="relative grid size-10 place-items-center rounded-full text-[var(--theme-heading)] transition-colors duration-200 hover:bg-[var(--theme-heading)]/5 active:bg-[var(--theme-heading)]/10 sm:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span
                className={`h-0.5 w-5 rounded bg-current transition-transform duration-300 ${
                  menuOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded bg-current transition-opacity duration-200 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded bg-current transition-transform duration-300 ${
                  menuOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        onClick={closeMenu}
        aria-hidden="true"
        className={`fixed inset-x-0 bottom-0 top-20 bg-black/30 transition-opacity duration-300 sm:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        className={`absolute inset-x-0 top-full origin-top border-t border-[var(--theme-heading)]/10 bg-white px-4 pb-5 pt-3 shadow-xl transition-[opacity,transform,visibility] duration-300 ease-out sm:hidden ${
          menuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <ul className="flex flex-col">
          {links.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-lg px-3 py-3.5 text-base font-medium text-[var(--theme-heading)] no-underline transition-colors hover:bg-[var(--theme-accent)]/5 active:bg-[var(--theme-accent)]/5"
              >
                {label}
                <span
                  aria-hidden="true"
                  className="text-[var(--theme-heading)]/30"
                >
                  ›
                </span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href={marketingPath("/#contact")}
          data-btn
          onClick={closeMenu}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[linear-gradient(180deg,var(--theme-copy)_0%,var(--theme-heading)_100%)] px-5 py-2.5 font-sans text-sm font-medium leading-5 text-white no-underline transition-[opacity,transform] duration-200 ease-out hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]"
        >
          Get Started
        </a>
      </nav>
    </header>
  );
}
