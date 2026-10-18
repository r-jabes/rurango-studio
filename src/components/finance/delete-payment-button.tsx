"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { deletePaymentAction } from "@/server/finance/actions";

export function DeletePaymentButton({ paymentId }: { paymentId: string }) {
  const { pending, run } = useActionFeedback();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        Remove
      </Button>
      <ConfirmDialog
        open={open}
        title="Remove this payment?"
        description="The payment record will be deleted. Invoice balances will recalculate."
        confirmLabel="Remove payment"
        busy={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          run(() => deletePaymentAction(paymentId), {
            successTitle: "Payment removed",
            onSuccess: () => setOpen(false),
          })
        }
      />
    </>
  );
}
