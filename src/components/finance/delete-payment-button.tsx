"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deletePaymentAction } from "@/server/finance/actions";

export function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Remove this payment record?")) return;
        startTransition(async () => {
          await deletePaymentAction(paymentId);
          router.refresh();
        });
      }}
    >
      Remove
    </Button>
  );
}
