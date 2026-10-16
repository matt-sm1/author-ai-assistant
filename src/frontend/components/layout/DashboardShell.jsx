"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import Sidebar from "./Sidebar";
import Header from "./Header";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/frontend/components/ui/Sheet";

import { cn } from "@/frontend/lib/utils";
import { adminNavigation } from "@/frontend/lib/constants";
import { baseApi } from "@/frontend/store/api/baseApi";
// Ensure endpoints are injected before idle prefetch
import "@/frontend/feature/media/api/media.api";
import "@/frontend/feature/post/api/posts.api";
import "@/frontend/feature/stats/api/stats.api";
import "@/frontend/feature/category/api/categories.api";
import "@/frontend/feature/tag/api/tags.api";

function runWhenIdle(fn) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => fn(), { timeout: 2000 });
  } else {
    setTimeout(fn, 400);
  }
}

export default function DashboardShell({
  children,
  wide = false,
  siteName = "Blog CMS",
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    for (const item of adminNavigation) {
      router.prefetch(item.href);
    }

    runWhenIdle(() => {
      dispatch(
        baseApi.util.prefetch("getDashboardStats", undefined, { force: false }),
      );
      dispatch(
        baseApi.util.prefetch(
          "getMedia",
          { page: 1, limit: 20, search: "", resourceType: "" },
          { force: false },
        ),
      );
      dispatch(
        baseApi.util.prefetch(
          "getPosts",
          { page: 1, limit: 10 },
          { force: false },
        ),
      );
      dispatch(
        baseApi.util.prefetch(
          "getCategories",
          { page: 1, limit: 20, search: "" },
          { force: false },
        ),
      );
      dispatch(
        baseApi.util.prefetch(
          "getTags",
          { page: 1, limit: 20, search: "" },
          { force: false },
        ),
      );
    });
  }, [dispatch, router]);

  function handleNavigate() {
    startTransition(() => {
      setOpen(false);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <Sidebar siteName={siteName} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar siteName={siteName} onNavigate={handleNavigate} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <Header onOpenMenu={() => setOpen(true)} />

        <main
          className={cn(
            "mx-auto px-4 py-6 sm:px-6 lg:py-8",
            "view-transition-main",
            wide ? "max-w-[1400px]" : "max-w-7xl",
          )}
          style={{ viewTransitionName: "admin-main" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
