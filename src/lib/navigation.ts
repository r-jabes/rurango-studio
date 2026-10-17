export type NavItem = {
  href: string;
  label: string;
  description: string;
};

export const primaryNav: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Overview of Studio readiness and recent activity.",
  },
  {
    href: "/clients",
    label: "Clients",
    description: "Client records and related work.",
  },
  {
    href: "/projects",
    label: "Projects",
    description: "Engagements, milestones, and delivery tracking.",
  },
  {
    href: "/documents",
    label: "Documents",
    description: "Private document vault.",
  },
  {
    href: "/proposals",
    label: "Proposals",
    description: "Proposal drafts and issued documents.",
  },
  {
    href: "/quotations",
    label: "Quotations",
    description: "Quotations and pricing documents.",
  },
  {
    href: "/agreements",
    label: "Agreements",
    description: "Agreements and signed copies.",
  },
  {
    href: "/invoices",
    label: "Invoices",
    description: "Invoices and outstanding balances.",
  },
  {
    href: "/payments",
    label: "Payments",
    description: "Payments, outstanding balances, and AR summary.",
  },
  {
    href: "/content",
    label: "Content",
    description: "CMS drafts and publish workflow for the portfolio.",
  },
  {
    href: "/backups",
    label: "Backups",
    description: "Owner backup runs and recovery drills.",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Company profile, MFA, templates, and audit.",
  },
];
