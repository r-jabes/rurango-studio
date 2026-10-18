import { cn } from "@/lib/cn";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-secondary/80",
        className,
      )}
    />
  );
}

export function PageSkeleton({ label = "Loading page" }: { label?: string }) {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-56 max-w-full" />
        <Bone className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Bone className="h-9 w-28" />
        <Bone className="h-9 w-24" />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <Bone className="h-10 w-full rounded-none" />
        <div className="space-y-0 divide-y divide-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-3">
              <Bone className="h-4 w-1/3" />
              <Bone className="h-4 w-1/4" />
              <Bone className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
