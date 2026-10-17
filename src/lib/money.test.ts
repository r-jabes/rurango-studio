import { describe, expect, it } from "vitest";
import {
  calculateLine,
  calculateTotals,
  formatMoney,
  majorToMinor,
  minorToMajorString,
  parseQuantity,
} from "@/lib/money";

describe("parseQuantity", () => {
  it("parses positive decimals", () => {
    expect(parseQuantity("2.5").toString()).toBe("2.5");
  });

  it("rejects empty, zero, and negative", () => {
    expect(() => parseQuantity("")).toThrow(/required/i);
    expect(() => parseQuantity("0")).toThrow(/positive/i);
    expect(() => parseQuantity("-1")).toThrow(/positive/i);
  });
});

describe("calculateLine", () => {
  it("computes net and tax in minor units", () => {
    const line = calculateLine({
      quantity: "2",
      unitAmountMinor: 1500,
      taxRateBps: 1800, // 18%
    });
    expect(line.lineNetMinor).toBe(3000);
    expect(line.lineTaxMinor).toBe(540);
    expect(line.lineTotalMinor).toBe(3540);
  });

  it("rejects non-integer unit amounts", () => {
    expect(() =>
      calculateLine({ quantity: "1", unitAmountMinor: 1.5 }),
    ).toThrow(/integer/i);
  });
});

describe("calculateTotals", () => {
  it("sums lines without floating error", () => {
    const totals = calculateTotals([
      { quantity: "1", unitAmountMinor: 100, taxRateBps: 0 },
      { quantity: "3", unitAmountMinor: 250, taxRateBps: 1000 },
    ]);
    expect(totals.subtotalMinor).toBe(850);
    expect(totals.taxMinor).toBe(75);
    expect(totals.totalMinor).toBe(925);
  });
});

describe("major/minor conversion", () => {
  it("round-trips common amounts", () => {
    expect(majorToMinor("1500.50")).toBe(150050);
    expect(minorToMajorString(150050)).toBe("1500.50");
  });

  it("rejects negative majors", () => {
    expect(() => majorToMinor("-1")).toThrow(/non-negative/i);
  });
});

describe("formatMoney", () => {
  it("formats with currency or falls back", () => {
    const formatted = formatMoney(10000, "RWF", "en-RW", 0);
    expect(formatted).toMatch(/10[,.]?000|RWF/);
  });
});
