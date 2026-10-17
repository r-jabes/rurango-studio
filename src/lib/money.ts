import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type LineMoneyInput = {
  quantity: string;
  unitAmountMinor: number;
  taxRateBps?: number;
};

export type LineMoneyResult = {
  lineNetMinor: number;
  lineTaxMinor: number;
  lineTotalMinor: number;
};

export type TotalsResult = {
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  lines: LineMoneyResult[];
};

/** Parse a decimal quantity string; rejects NaN / infinite / negative. */
export function parseQuantity(value: string): Decimal {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Quantity is required.");
  const d = new Decimal(trimmed);
  if (!d.isFinite() || d.lte(0)) {
    throw new Error("Quantity must be a positive number.");
  }
  return d;
}

export function calculateLine(input: LineMoneyInput): LineMoneyResult {
  const qty = parseQuantity(input.quantity);
  const unit = new Decimal(input.unitAmountMinor);
  if (!unit.isFinite() || unit.lt(0) || !unit.isInteger()) {
    throw new Error("Unit amount must be a non-negative integer (minor units).");
  }
  const taxBps = new Decimal(input.taxRateBps ?? 0);
  if (!taxBps.isFinite() || taxBps.lt(0) || !taxBps.isInteger()) {
    throw new Error("Tax rate must be a non-negative integer in basis points.");
  }

  const lineNetMinor = qty.times(unit).toDecimalPlaces(0).toNumber();
  const lineTaxMinor = new Decimal(lineNetMinor)
    .times(taxBps)
    .dividedBy(10_000)
    .toDecimalPlaces(0)
    .toNumber();

  return {
    lineNetMinor,
    lineTaxMinor,
    lineTotalMinor: lineNetMinor + lineTaxMinor,
  };
}

export function calculateTotals(lines: LineMoneyInput[]): TotalsResult {
  const computed = lines.map(calculateLine);
  const subtotalMinor = computed.reduce((sum, l) => sum + l.lineNetMinor, 0);
  const taxMinor = computed.reduce((sum, l) => sum + l.lineTaxMinor, 0);
  return {
    subtotalMinor,
    taxMinor,
    totalMinor: subtotalMinor + taxMinor,
    lines: computed,
  };
}

/** Convert a major-unit decimal string (e.g. "1500.50") to minor units. */
export function majorToMinor(major: string, fractionDigits = 2): number {
  const d = new Decimal(major.trim() || "0");
  if (!d.isFinite() || d.lt(0)) {
    throw new Error("Amount must be a non-negative number.");
  }
  return d
    .times(new Decimal(10).pow(fractionDigits))
    .toDecimalPlaces(0)
    .toNumber();
}

export function minorToMajorString(
  minor: number,
  fractionDigits = 2,
): string {
  return new Decimal(minor)
    .dividedBy(new Decimal(10).pow(fractionDigits))
    .toFixed(fractionDigits);
}

export function formatMoney(
  minor: number,
  currency: string,
  locale = "en-RW",
  fractionDigits = 2,
): string {
  const major = Number(minorToMajorString(minor, fractionDigits));
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(major);
  } catch {
    return `${currency} ${minorToMajorString(minor, fractionDigits)}`;
  }
}
