"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "danger" | "info" | "warning";

export type ToastInput = {
  title?: string;
  description: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  danger: "border-red-500/40 bg-red-500/10 text-red-100",
  info: "border-border-strong bg-surface text-foreground",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    const item: ToastItem = {
      id,
      title: input.title,
      description: input.description,
      tone: input.tone ?? "info",
      durationMs: input.durationMs ?? 4200,
    };
    setItems((current) => [...current.slice(-4), item]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (description, title = "Saved") =>
        toast({ description, title, tone: "success" }),
      error: (description, title = "Something went wrong") =>
        toast({ description, title, tone: "danger" }),
      info: (description, title) =>
        toast({ description, title, tone: "info" }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), item.durationMs);
    return () => window.clearTimeout(timer);
  }, [item.id, item.durationMs, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 shadow-lg shadow-black/30 backdrop-blur",
        toneStyles[item.tone],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {item.title ? (
            <p className="text-sm font-medium">{item.title}</p>
          ) : null}
          <p
            className={cn(
              "text-sm text-foreground-secondary",
              item.title ? "mt-0.5" : "font-medium text-inherit",
            )}
          >
            {item.description}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
