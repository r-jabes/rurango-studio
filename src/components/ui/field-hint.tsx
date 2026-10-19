import { cn } from "@/lib/cn";

type FieldHintProps = {
  children: React.ReactNode;
  className?: string;
};

/** Short guidance under a form label — what belongs in the field. */
export function FieldHint({ children, className }: FieldHintProps) {
  return (
    <p
      className={cn(
        "mt-1 text-xs leading-relaxed text-foreground-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
