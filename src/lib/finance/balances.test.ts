import { describe, expect, it } from "vitest";
import { balanceTone, computeInvoiceBalance } from "@/lib/finance/balances";

describe("computeInvoiceBalance", () => {
  it("classifies unpaid, partial, paid, and overpaid", () => {
    expect(computeInvoiceBalance({ totalMinor: 1000, paidMinor: 0 })).toEqual({
      paidMinor: 0,
      outstandingMinor: 1000,
      status: "unpaid",
    });
    expect(computeInvoiceBalance({ totalMinor: 1000, paidMinor: 400 })).toEqual(
      {
        paidMinor: 400,
        outstandingMinor: 600,
        status: "partial",
      },
    );
    expect(
      computeInvoiceBalance({ totalMinor: 1000, paidMinor: 1000 }),
    ).toEqual({
      paidMinor: 1000,
      outstandingMinor: 0,
      status: "paid",
    });
    expect(
      computeInvoiceBalance({ totalMinor: 1000, paidMinor: 1200 }),
    ).toEqual({
      paidMinor: 1200,
      outstandingMinor: -200,
      status: "overpaid",
    });
  });
});

describe("balanceTone", () => {
  it("maps statuses to UI tones", () => {
    expect(balanceTone("unpaid")).toBe("warning");
    expect(balanceTone("partial")).toBe("accent");
    expect(balanceTone("paid")).toBe("success");
    expect(balanceTone("overpaid")).toBe("danger");
  });
});
