
"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/frontend/components/ui/Sheet";

import { cn } from "@/frontend/lib/utils";

export default function DashboardShell({
  children,
  wide = false,
  siteName = "Blog CMS",

}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <Sidebar
          siteName={siteName}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">
            Navigation
          </SheetTitle>

          <Sidebar
            siteName={siteName}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        <Header
          onOpenMenu={() => setOpen(true)}

        />

        <main
          className={cn(
            "mx-auto px-4 py-6 sm:px-6 lg:py-8",
            wide ? "max-w-[1400px]" : "max-w-7xl"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
