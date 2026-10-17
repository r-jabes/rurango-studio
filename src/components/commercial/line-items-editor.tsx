"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateTotals, formatMoney, majorToMinor } from "@/lib/money";

export type LineItemDraft = {
  key: string;
  description: string;
  quantity: string;
  unitAmountMajor: string;
  taxRatePercent: string;
};

type LineItemsEditorProps = {
  currency: string;
  defaultItems?: LineItemDraft[];
  readOnly?: boolean;
};

function newLine(): LineItemDraft {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitAmountMajor: "0",
    taxRatePercent: "0",
  };
}

export function LineItemsEditor({
  currency,
  defaultItems,
  readOnly = false,
}: LineItemsEditorProps) {
  const [items, setItems] = useState<LineItemDraft[]>(
    defaultItems?.length ? defaultItems : [newLine()],
  );

  const totals = useMemo(() => {
    try {
      const prepared = items.map((item) => ({
        quantity: item.quantity || "0",
        unitAmountMinor: majorToMinor(item.unitAmountMajor || "0"),
        taxRateBps: Math.round(Number(item.taxRatePercent || "0") * 100),
      }));
      return calculateTotals(prepared);
    } catch {
      return null;
    }
  }, [items]);

  function update(key: string, patch: Partial<LineItemDraft>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Label>Line items</Label>
          <p className="text-xs text-foreground-secondary">
            Amounts use major units; totals are calculated in minor units with
            half-up rounding.
          </p>
        </div>
        {!readOnly ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setItems((prev) => [...prev, newLine()])}
          >
            Add line
          </Button>
        ) : null}
      </div>

      <input
        type="hidden"
        name="lineItemsJson"
        value={JSON.stringify(
          items.map(
            ({ description, quantity, unitAmountMajor, taxRatePercent }) => ({
              description,
              quantity,
              unitAmountMajor,
              taxRatePercent,
            }),
          ),
        )}
      />

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.key}
            className="grid gap-2 rounded-md border border-border bg-surface p-3 sm:grid-cols-12"
          >
            <div className="sm:col-span-5">
              <Label htmlFor={`desc-${item.key}`}>Description</Label>
              <Input
                id={`desc-${item.key}`}
                value={item.description}
                disabled={readOnly}
                onChange={(e) =>
                  update(item.key, { description: e.target.value })
                }
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={`qty-${item.key}`}>Qty</Label>
              <Input
                id={`qty-${item.key}`}
                value={item.quantity}
                disabled={readOnly}
                onChange={(e) => update(item.key, { quantity: e.target.value })}
                inputMode="decimal"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={`unit-${item.key}`}>Unit ({currency})</Label>
              <Input
                id={`unit-${item.key}`}
                value={item.unitAmountMajor}
                disabled={readOnly}
                onChange={(e) =>
                  update(item.key, { unitAmountMajor: e.target.value })
                }
                inputMode="decimal"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={`tax-${item.key}`}>Tax %</Label>
              <Input
                id={`tax-${item.key}`}
                value={item.taxRatePercent}
                disabled={readOnly}
                onChange={(e) =>
                  update(item.key, { taxRatePercent: e.target.value })
                }
                inputMode="decimal"
              />
            </div>
            <div className="flex items-end sm:col-span-1">
              {!readOnly && items.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove line ${index + 1}`}
                  onClick={() =>
                    setItems((prev) => prev.filter((row) => row.key !== item.key))
                  }
                >
                  ✕
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-6 border-t border-border pt-3 text-sm">
        <div>
          <span className="text-foreground-secondary">Subtotal </span>
          <span className="font-medium">
            {totals ? formatMoney(totals.subtotalMinor, currency) : "—"}
          </span>
        </div>
        <div>
          <span className="text-foreground-secondary">Tax </span>
          <span className="font-medium">
            {totals ? formatMoney(totals.taxMinor, currency) : "—"}
          </span>
        </div>
        <div>
          <span className="text-foreground-secondary">Total </span>
          <span className="font-semibold">
            {totals ? formatMoney(totals.totalMinor, currency) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
