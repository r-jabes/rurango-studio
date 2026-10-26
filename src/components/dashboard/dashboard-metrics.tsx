"use client";

import {
  AmountPrivacyProvider,
  AmountPrivacyToggle,
  PrivateAmount,
} from "@/components/dashboard/amount-privacy";
import { formatMoney } from "@/lib/money";

type DashboardMetricsProps = {
  activeClients: number | null;
  openProjects: number | null;
  ar: {
    outstandingMinor: number;
    collectedMinor: number;
    openCount: number;
    currency: string;
  } | null;
};

export function DashboardMetrics({
  activeClients,
  openProjects,
  ar,
}: DashboardMetricsProps) {
  return (
    <AmountPrivacyProvider>
      <div className="space-y-3">
        <div className="flex justify-end">
          <AmountPrivacyToggle />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wide text-foreground-muted">
              Active clients
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {activeClients ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wide text-foreground-muted">
              Open projects
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {openProjects ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wide text-foreground-muted">
              Accounts receivable
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              <PrivateAmount
                value={
                  ar
                    ? formatMoney(ar.outstandingMinor, ar.currency)
                    : "—"
                }
              />
            </p>
            <p className="mt-1 text-xs text-foreground-secondary">
              {ar?.openCount ?? 0} open
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface/50 p-5">
            <p className="text-xs uppercase tracking-wide text-foreground-muted">
              Collected
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              <PrivateAmount
                value={
                  ar ? formatMoney(ar.collectedMinor, ar.currency) : "—"
                }
              />
            </p>
          </div>
        </div>
      </div>
    </AmountPrivacyProvider>
  );
}
