"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { marketingPath } from "@/frontend/feature/blog/lib/site-urls";

const NAV = [
  { label: "Home", href: marketingPath("/") },
  { label: "Product", href: marketingPath("/#integrations") },
  { label: "Features", href: marketingPath("/#features") },
  { label: "Pricing", href: marketingPath("/#contact") },
];

export default function SiteHeader({ active = "articles" }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-20 w-full border-b border-[var(--theme-border-subtle)] bg-white/90 backdrop-blur-md transition-[background-color,box-shadow] duration-300">
      <div className="relative mx-auto flex h-20 w-[calc(100%-2rem)] max-w-[1200px] items-center justify-between sm:grid sm:w-[calc(100%-3rem)] sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center justify-self-start">
          <a
            aria-label="AuthorBot home"
            className="flex items-center"
            href={marketingPath("/")}
          >
            <Image
              src="/images/brand/logo.webp"
              alt="Author AI Assistant"
              width={160}
              height={54}
              className="h-9 w-auto object-contain sm:h-11"
              priority
            />
          </a>
        </div>

        <nav
          className="hidden items-center justify-center gap-8 sm:flex"
          aria-label="Main navigation"
        >
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="site-chrome__nav-link"
              data-active={
                active === item.label.toLowerCase() ? "true" : undefined
              }
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/"
            className="site-chrome__nav-link"
            data-active={active === "articles" ? "true" : undefined}
            aria-current={active === "articles" ? "page" : undefined}
          >
            Articles
          </Link>
        </nav>

        <div className="flex items-center justify-self-end">
          <div className="hidden sm:block">
            <a
              href={marketingPath("/#contact")}
              className="site-chrome__cta"
              data-btn="true"
            >
              Get Started
            </a>
          </div>

          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-full text-[var(--theme-heading)] transition-colors duration-200 hover:bg-[var(--theme-heading)]/5 sm:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="blog-mobile-navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span
                className={`h-0.5 w-5 rounded bg-current transition-transform duration-300 ${
                  open ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded bg-current transition-transform duration-300 ${
                  open ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        aria-hidden={!open}
        className={`fixed inset-x-0 bottom-0 top-20 bg-black/30 transition-opacity duration-300 sm:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <nav
        id="blog-mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!open}
        className={`absolute inset-x-0 top-full origin-top border-t border-[var(--theme-heading)]/10 bg-white px-4 pb-5 pt-3 shadow-xl transition-[opacity,transform,visibility] duration-300 ease-out sm:hidden ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <ul className="flex flex-col">
          {NAV.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-3.5 text-base font-medium text-[var(--theme-heading)] no-underline transition-colors hover:bg-[var(--theme-accent)]/5"
                onClick={() => setOpen(false)}
              >
                {item.label}
                <span aria-hidden="true" className="text-[var(--theme-heading)]/30">
                  ›
                </span>
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/"
              className="flex items-center justify-between rounded-lg bg-[var(--theme-accent)]/5 px-3 py-3.5 text-base font-medium text-[var(--theme-accent)] no-underline"
              onClick={() => setOpen(false)}
              aria-current="page"
            >
              Articles
              <span aria-hidden="true" className="text-[var(--theme-heading)]/30">
                ›
              </span>
            </Link>
          </li>
        </ul>
        <a
          href={marketingPath("/#contact")}
          className="site-chrome__cta mt-4 h-11 w-full text-base"
          onClick={() => setOpen(false)}
        >
          Get Started
        </a>
      </nav>
    </header>
  );
}
