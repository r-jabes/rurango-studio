"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult, FieldErrors } from "@/lib/action-result";

/**
 * Shared pending + toast feedback for server actions.
 * Keeps field errors local for form fields; success/error go to toasts.
 */
export function useActionFeedback() {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function run(
    action: () => Promise<ActionResult<unknown>>,
    options?: {
      successTitle?: string;
      onSuccess?: (result: Extract<ActionResult<unknown>, { ok: true }>) => void;
      refresh?: boolean;
    },
  ) {
    setFieldErrors({});
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Done.", options?.successTitle);
      options?.onSuccess?.(result);
      if (options?.refresh !== false) {
        router.refresh();
      }
    });
  }

  return { pending, fieldErrors, setFieldErrors, run, toast, router };
}
