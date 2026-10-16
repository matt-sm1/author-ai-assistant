import { cn } from "@/frontend/lib/utils";

function Block({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-muted/80",
        className,
      )}
    />
  );
}

export default function AdminPageSkeleton({ variant = "dashboard" }) {
  if (variant === "media") {
    return (
      <div className="space-y-6">
        <Block className="h-28 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Block key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "posts") {
    return (
      <div className="space-y-4">
        <Block className="h-12 w-64" />
        <Block className="h-14 w-full" />
        <Block className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Block className="h-10 w-56" />
        <Block className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-28 w-full" />
        ))}
      </div>
      <Block className="h-64 w-full" />
    </div>
  );
}
