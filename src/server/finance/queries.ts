import { and, count, desc, eq, inArray, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  commercialDocuments,
  deploymentRecords,
  handoverAcceptances,
  payments,
  qaChecklists,
} from "@/db/schema";
import { computeInvoiceBalance } from "@/lib/finance/balances";
import {
  DEFAULT_PAGE_SIZE,
  pageOffset,
  parsePage,
} from "@/lib/pagination";

export async function sumPaymentsForInvoice(invoiceId: string) {
  const [row] = await db
    .select({ value: sum(payments.amountMinor) })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));
  return Number(row?.value ?? 0);
}

export async function listPayments(input?: {
  page?: string;
}) {
  const page = parsePage(input?.page);
  const offset = pageOffset(page);

  const [rows, totalRow] = await Promise.all([
    db.query.payments.findMany({
      with: {
        invoice: {
          columns: {
            id: true,
            number: true,
            title: true,
            totalMinor: true,
            currency: true,
            status: true,
            clientId: true,
          },
          with: {
            client: { columns: { id: true, name: true } },
          },
        },
        recorder: { columns: { id: true, name: true } },
      },
      orderBy: [desc(payments.paidOn), desc(payments.createdAt)],
      limit: DEFAULT_PAGE_SIZE,
      offset,
    }),
    db.select({ value: count() }).from(payments),
  ]);

  return {
    rows,
    total: totalRow[0]?.value ?? 0,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export async function listPayableInvoices() {
  return db.query.commercialDocuments.findMany({
    where: and(
      eq(commercialDocuments.type, "invoice"),
      inArray(commercialDocuments.status, ["issued", "accepted"]),
    ),
    columns: {
      id: true,
      number: true,
      title: true,
      totalMinor: true,
      currency: true,
      status: true,
      clientId: true,
    },
    with: {
      client: { columns: { name: true } },
    },
    orderBy: [desc(commercialDocuments.issueDate), desc(commercialDocuments.updatedAt)],
  });
}

export async function listInvoiceBalances() {
  const invoices = await listPayableInvoices();
  if (!invoices.length) return [];

  const ids = invoices.map((i) => i.id);
  const paidRows = await db
    .select({
      invoiceId: payments.invoiceId,
      paidMinor: sum(payments.amountMinor),
    })
    .from(payments)
    .where(inArray(payments.invoiceId, ids))
    .groupBy(payments.invoiceId);

  const paidMap = new Map(
    paidRows.map((r) => [r.invoiceId, Number(r.paidMinor ?? 0)]),
  );

  return invoices.map((invoice) => {
    const paidMinor = paidMap.get(invoice.id) ?? 0;
    const balance = computeInvoiceBalance({
      totalMinor: invoice.totalMinor,
      paidMinor,
    });
    return {
      ...invoice,
      ...balance,
    };
  });
}

export async function getInvoicePaymentSummary(invoiceId: string) {
  const invoice = await db.query.commercialDocuments.findFirst({
    where: eq(commercialDocuments.id, invoiceId),
  });
  if (!invoice || invoice.type !== "invoice") return null;

  const paymentRows = await db.query.payments.findMany({
    where: eq(payments.invoiceId, invoiceId),
    orderBy: [desc(payments.paidOn), desc(payments.createdAt)],
    with: {
      recorder: { columns: { name: true } },
    },
  });

  const paidMinor = paymentRows.reduce((sumAmt, p) => sumAmt + p.amountMinor, 0);
  return {
    invoice,
    payments: paymentRows,
    ...computeInvoiceBalance({
      totalMinor: invoice.totalMinor,
      paidMinor,
    }),
  };
}

export async function getArSummary() {
  const balances = await listInvoiceBalances();
  const outstandingMinor = balances.reduce(
    (sumAmt, row) => sumAmt + Math.max(0, row.outstandingMinor),
    0,
  );
  const collectedMinor = balances.reduce((sumAmt, row) => sumAmt + row.paidMinor, 0);
  const openCount = balances.filter((b) => b.outstandingMinor > 0).length;
  return {
    outstandingMinor,
    collectedMinor,
    openCount,
    invoiceCount: balances.length,
    currency: balances[0]?.currency ?? "RWF",
  };
}

export async function listDeploymentsForProject(projectId: string) {
  return db.query.deploymentRecords.findMany({
    where: eq(deploymentRecords.projectId, projectId),
    orderBy: [desc(deploymentRecords.deployedAt)],
    with: {
      creator: { columns: { name: true } },
    },
  });
}

export async function listQaForProject(projectId: string) {
  return db.query.qaChecklists.findMany({
    where: eq(qaChecklists.projectId, projectId),
    orderBy: [desc(qaChecklists.createdAt)],
    with: {
      milestone: { columns: { id: true, title: true } },
      items: {
        orderBy: (items, { asc }) => [asc(items.sortOrder), asc(items.createdAt)],
      },
    },
  });
}

export async function listHandoversForProject(projectId: string) {
  return db.query.handoverAcceptances.findMany({
    where: eq(handoverAcceptances.projectId, projectId),
    orderBy: [desc(handoverAcceptances.createdAt)],
    with: {
      creator: { columns: { name: true } },
    },
  });
}
