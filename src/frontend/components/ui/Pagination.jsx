
"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

import { cn } from "@/frontend/lib/utils";

const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="Pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);

Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
);

PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn(className)} {...props} />
  )
);

PaginationItem.displayName = "PaginationItem";

const PaginationLink = ({
  className,
  isActive,
  disabled = false,
  onClick,
  children,
  ...props
}) => (
  <button
    type="button"
    aria-current={isActive ? "page" : undefined}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
      "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      isActive ? "border bg-background shadow-sm" : "hover:bg-muted",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({ className, children, ...props }) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>{children ?? "Previous"}</span>
  </PaginationLink>
);

PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({ className, children, ...props }) => (
  <PaginationLink
    aria-label="Go to next page"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>{children ?? "Next"}</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);

PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex h-9 w-9 items-center justify-center",
      className
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);

PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
