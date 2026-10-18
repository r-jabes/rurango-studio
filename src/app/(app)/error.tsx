"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
        Error
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        This page couldn’t load
      </h1>
      <p className="text-sm text-foreground-secondary">
        Something went wrong while rendering this view. Try again. If it keeps
        failing, check the latest deploy or contact the platform owner.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-foreground-muted">
          Ref {error.digest}
        </p>
      ) : null}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
