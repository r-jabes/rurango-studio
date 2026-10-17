export const COMMERCIAL_DOC_TYPES = [
  "proposal",
  "quotation",
  "agreement",
  "invoice",
  "receipt",
  "handover",
] as const;

export type CommercialDocType = (typeof COMMERCIAL_DOC_TYPES)[number];

export const PRIMARY_COMMERCIAL_TYPES = [
  "proposal",
  "quotation",
  "agreement",
  "invoice",
] as const;

export type PrimaryCommercialType = (typeof PRIMARY_COMMERCIAL_TYPES)[number];

export const COMMERCIAL_STATUSES = [
  "draft",
  "issued",
  "accepted",
  "declined",
  "void",
  "superseded",
] as const;

export type CommercialDocStatus = (typeof COMMERCIAL_STATUSES)[number];

export const typeLabels: Record<CommercialDocType, string> = {
  proposal: "Proposal",
  quotation: "Quotation",
  agreement: "Agreement",
  invoice: "Invoice",
  receipt: "Receipt",
  handover: "Handover",
};

export const typePlurals: Record<PrimaryCommercialType, string> = {
  proposal: "Proposals",
  quotation: "Quotations",
  agreement: "Agreements",
  invoice: "Invoices",
};

export const typeRoutes: Record<PrimaryCommercialType, string> = {
  proposal: "/proposals",
  quotation: "/quotations",
  agreement: "/agreements",
  invoice: "/invoices",
};

export const typeDescriptions: Record<PrimaryCommercialType, string> = {
  proposal: "Proposal drafts, issued snapshots, and client relationships.",
  quotation: "Quotations and pricing documents with line-item totals.",
  agreement: "Agreements, issued snapshots, and recorded signed copies.",
  invoice: "Invoices with immutable issued snapshots and PDF export.",
};

export const prefixFieldByType: Record<
  PrimaryCommercialType,
  "proposalPrefix" | "quotationPrefix" | "agreementPrefix" | "invoicePrefix"
> = {
  proposal: "proposalPrefix",
  quotation: "quotationPrefix",
  agreement: "agreementPrefix",
  invoice: "invoicePrefix",
};

export function isPrimaryCommercialType(
  value: string,
): value is PrimaryCommercialType {
  return (PRIMARY_COMMERCIAL_TYPES as readonly string[]).includes(value);
}

export function statusTone(
  status: CommercialDocStatus,
): "neutral" | "accent" | "success" | "warning" | "danger" {
  switch (status) {
    case "draft":
      return "neutral";
    case "issued":
      return "accent";
    case "accepted":
      return "success";
    case "declined":
      return "warning";
    case "void":
    case "superseded":
      return "danger";
    default:
      return "neutral";
  }
}

/** Content edits are only allowed while draft. */
export function isEditableStatus(status: CommercialDocStatus) {
  return status === "draft";
}

export function canIssue(status: CommercialDocStatus) {
  return status === "draft";
}

export function canVoid(status: CommercialDocStatus) {
  return status === "issued" || status === "accepted" || status === "declined";
}

export function canMarkResponse(status: CommercialDocStatus) {
  return status === "issued";
}

export function canRecordSignedCopy(status: CommercialDocStatus) {
  return status === "issued" || status === "accepted";
}
