import { cn } from "@/lib/cn";

type StatusBannerProps = {
  tone?: "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
  className?: string;
};

const tones = {
  info: "border-border bg-surface text-foreground-secondary",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  danger: "border-red-500/30 bg-red-500/10 text-red-100",
};

export function StatusBanner({
  tone = "info",
  children,
  className,
}: StatusBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
