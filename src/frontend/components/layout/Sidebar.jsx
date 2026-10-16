
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PenLine } from "lucide-react";

import { adminNavigation } from "@/frontend/lib/constants";
import AdminProfile from "./AdminProfile";
import { cn } from "@/frontend/lib/utils";

export default function Sidebar({
  onNavigate,
  siteName = "Blog CMS",

}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
          <PenLine className="h-4 w-4" />
        </div>

        <div>
          <div className="text-[15px] font-bold leading-none">
            {siteName}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Blog CMS
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        <div className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </div>

        {adminNavigation.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={onNavigate}
              onPointerEnter={() => router.prefetch(item.href)}
              onFocus={() => router.prefetch(item.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-sidebar-foreground hover:bg-muted"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />

              {item.label}

            
            </Link>
          );
        })}
      </nav>

      <AdminProfile onNavigate={onNavigate} />
    </div>
  );
}
