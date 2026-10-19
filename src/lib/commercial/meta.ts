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

/**
 * Short list blurbs — how these documents differ in commercial practice.
 * Shared form fields exist because all of them can carry parties, dates,
 * line items, and terms; the *purpose* and which fields matter change by type.
 */
export const typeDescriptions: Record<PrimaryCommercialType, string> = {
  proposal:
    "A narrative offer: problem, approach, and recommended scope. Pricing may be indicative. Used before a firm quote.",
  quotation:
    "A priced offer the client can accept. Line items and totals are central; validity/expiry dates matter.",
  agreement:
    "The terms you and the client commit to after scope is clear. Narrative/body carries the obligations; signed copies are recorded later.",
  invoice:
    "A request for payment against agreed work. Due date and payment terms drive collection; payments are logged separately against the invoice.",
};

/** Guidance shown on create/edit forms for operators. */
export const typeGuidance: Record<
  PrimaryCommercialType,
  {
    summary: string;
    titleHint: string;
    bodyHint: string;
    notesHint: string;
    paymentTermsHint: string;
    issueDateHint: string;
    dueDateHint: string;
    expiryDateHint: string;
    lineItemsHint: string;
    showDueDate: boolean;
    showExpiryDate: boolean;
    emphasizeBody: boolean;
  }
> = {
  proposal: {
    summary:
      "Use a proposal when you are pitching an approach. Focus on scope narrative; line items can be estimates.",
    titleHint: "e.g. Website redesign proposal — Acme Ltd",
    bodyHint:
      "Describe goals, approach, deliverables, timeline assumptions, and what is out of scope.",
    notesHint: "Internal or client-facing caveats (assumptions, dependencies).",
    paymentTermsHint: "Optional at this stage (e.g. 40% to start if accepted).",
    issueDateHint: "Date you send the proposal.",
    dueDateHint: "Rarely used on proposals — prefer expiry for response deadline.",
    expiryDateHint: "Last day the proposal (and any indicative pricing) remains valid.",
    lineItemsHint: "Optional estimate breakdown. Prefer a quotation for a binding price.",
    showDueDate: false,
    showExpiryDate: true,
    emphasizeBody: true,
  },
  quotation: {
    summary:
      "Use a quotation for a firm price the client can accept. Totals and validity matter more than long narrative.",
    titleHint: "e.g. Quotation — custom inventory system (Q2)",
    bodyHint: "Short commercial notes only if needed; put priced work in line items.",
    notesHint: "Conditions (lead time, what changes the price, revision rounds).",
    paymentTermsHint: "e.g. 50% deposit, balance on delivery · Net 14",
    issueDateHint: "Date of the quotation.",
    dueDateHint: "Optional; usually you set expiry instead.",
    expiryDateHint: "Quote validity end date — after this, pricing should be reissued.",
    lineItemsHint: "Each billable line with quantity, unit price, and tax.",
    showDueDate: false,
    showExpiryDate: true,
    emphasizeBody: false,
  },
  agreement: {
    summary:
      "Use an agreement to capture mutual commitments. Body holds terms; issue, then record a signed copy when you have one.",
    titleHint: "e.g. Master services agreement — Acme Ltd",
    bodyHint:
      "Contractual terms: parties’ obligations, IP, confidentiality, payment schedule, termination.",
    notesHint: "Annex references or practical notes (kickoff date, contacts).",
    paymentTermsHint: "As stated in the agreement (milestones, retainers, Net terms).",
    issueDateHint: "Date the agreement is issued for signature.",
    dueDateHint: "Optional — e.g. target signature date.",
    expiryDateHint: "Optional — end of an offer window before countersignature.",
    lineItemsHint: "Optional fee schedule; some agreements keep fees in annexes only.",
    showDueDate: true,
    showExpiryDate: true,
    emphasizeBody: true,
  },
  invoice: {
    summary:
      "Use an invoice to request payment. Record actual receipts under Payments — that is separate from this document.",
    titleHint: "e.g. Invoice — Phase 1 delivery",
    bodyHint: "Optional description of the billed period or deliverables.",
    notesHint: "Bank details, mobile money instructions, or remittance references.",
    paymentTermsHint: "e.g. Net 14 · Due on receipt",
    issueDateHint: "Invoice date (usually today when issuing).",
    dueDateHint: "Payment due date — required for collection tracking.",
    expiryDateHint: "Not typically used on invoices.",
    lineItemsHint: "What you are billing for, with tax where applicable.",
    showDueDate: true,
    showExpiryDate: false,
    emphasizeBody: false,
  },
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
