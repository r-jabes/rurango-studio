export type PaymentBalanceStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "overpaid";

export function computeInvoiceBalance(input: {
  totalMinor: number;
  paidMinor: number;
}) {
  const outstandingMinor = input.totalMinor - input.paidMinor;
  let status: PaymentBalanceStatus;
  if (input.paidMinor <= 0) status = "unpaid";
  else if (outstandingMinor > 0) status = "partial";
  else if (outstandingMinor === 0) status = "paid";
  else status = "overpaid";

  return {
    paidMinor: input.paidMinor,
    outstandingMinor,
    status,
  };
}

export function balanceTone(
  status: PaymentBalanceStatus,
): "neutral" | "accent" | "success" | "warning" | "danger" {
  switch (status) {
    case "unpaid":
      return "warning";
    case "partial":
      return "accent";
    case "paid":
      return "success";
    case "overpaid":
      return "danger";
  }
}
