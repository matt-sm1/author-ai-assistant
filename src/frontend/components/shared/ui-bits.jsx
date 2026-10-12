"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { cn } from "@/frontend/lib/utils";

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ className, children }) {
  return <div className={cn("rounded-2xl border bg-card shadow-soft", className)}>{children}</div>;
}

const statusStyles = {
  published: "bg-success-soft text-success",
  approved: "bg-success-soft text-success",
  active: "bg-success-soft text-success",
  draft: "bg-muted text-muted-foreground",
  inactive: "bg-muted text-muted-foreground",
  scheduled: "bg-info-soft text-info",
  pending: "bg-warning-soft text-warning",
  spam: "bg-destructive/10 text-destructive",
  trash: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ?? "bg-muted"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        />

        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 z-50 grid min-w-0 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          <div className="flex min-w-0 flex-col gap-2 text-center sm:text-left">
            <AlertDialog.Title
              className="min-w-0 break-all text-lg font-semibold"
            >
              {title}
            </AlertDialog.Title>

            <AlertDialog.Description
              className="min-w-0 break-words text-sm text-muted-foreground"
            >
              {description}
            </AlertDialog.Description>
          </div>

          <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel
              className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition hover:bg-accent"
            >
              Cancel
            </AlertDialog.Cancel>

            <AlertDialog.Action
              onClick={onConfirm}
              className="inline-flex h-10 items-center justify-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90"
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function FilterTabs({ value, onChange, options }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "cursor-pointer flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            value === o.value
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="text-xs text-muted-foreground">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}