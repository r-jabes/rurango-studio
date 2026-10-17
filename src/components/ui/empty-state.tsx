import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center",
        className,
      )}
    >
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground-secondary">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
