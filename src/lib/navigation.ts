export type NavIcon =
  | "dashboard"
  | "clients"
  | "projects"
  | "documents"
  | "proposals"
  | "quotations"
  | "agreements"
  | "invoices"
  | "payments"
  | "content"
  | "posts"
  | "services"
  | "testimonials"
  | "backups"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: NavIcon;
  /** Secondary items stay reachable but visually de-emphasized. */
  secondary?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
  /** Optional label above secondary items in this group. */
  secondaryLabel?: string;
};

export const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        href: "/",
        label: "Dashboard",
        description: "Overview of Studio readiness and recent activity.",
        icon: "dashboard",
      },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    items: [
      {
        href: "/clients",
        label: "Clients",
        description: "Client records and related work.",
        icon: "clients",
      },
      {
        href: "/projects",
        label: "Projects",
        description: "Engagements, milestones, and delivery tracking.",
        icon: "projects",
      },
    ],
  },
  {
    id: "vault",
    label: "Vault",
    items: [
      {
        href: "/documents",
        label: "Documents",
        description: "Private document vault.",
        icon: "documents",
      },
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    secondaryLabel: "Occasional",
    items: [
      {
        href: "/quotations",
        label: "Quotations",
        description: "Priced offers — the usual first commercial document.",
        icon: "quotations",
      },
      {
        href: "/invoices",
        label: "Invoices",
        description: "Requests for payment after work is agreed.",
        icon: "invoices",
      },
      {
        href: "/payments",
        label: "Payments",
        description: "Record money received against issued invoices.",
        icon: "payments",
      },
      {
        href: "/proposals",
        label: "Proposals",
        description: "Narrative pitches before a firm quote — use when scope needs explaining.",
        icon: "proposals",
        secondary: true,
      },
      {
        href: "/agreements",
        label: "Agreements",
        description: "Signed terms for larger engagements — optional for small fixed jobs.",
        icon: "agreements",
        secondary: true,
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      {
        href: "/content",
        label: "Overview",
        description: "CMS overview and publish workflow.",
        icon: "content",
      },
      {
        href: "/content/projects",
        label: "Portfolio",
        description: "Portfolio project CMS entries.",
        icon: "projects",
      },
      {
        href: "/content/services",
        label: "Services",
        description: "Service CMS entries.",
        icon: "services",
      },
      {
        href: "/content/posts",
        label: "Posts",
        description: "Post CMS entries.",
        icon: "posts",
      },
      {
        href: "/content/testimonials",
        label: "Testimonials",
        description: "Approval-gated testimonials.",
        icon: "testimonials",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        href: "/backups",
        label: "Backups",
        description: "Owner backup runs and recovery drills.",
        icon: "backups",
      },
      {
        href: "/settings",
        label: "Settings",
        description: "Company profile, MFA, templates, and audit.",
        icon: "settings",
      },
    ],
  },
];

/** Flat list for breadcrumbs and legacy callers. */
export const primaryNav: NavItem[] = navGroups.flatMap((group) => group.items);

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.href === "/") {
    return pathname === "/";
  }
  // Exact match for Content overview so nested CMS routes stay distinct.
  if (item.href === "/content") {
    return pathname === "/content";
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export type Breadcrumb = { href?: string; label: string };

export function breadcrumbsForPath(pathname: string): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [{ href: "/", label: "Studio" }];

  if (pathname === "/") {
    crumbs.push({ label: "Dashboard" });
    return crumbs;
  }

  if (pathname.startsWith("/content")) {
    crumbs.push({ href: "/content", label: "Content" });
    if (pathname === "/content") {
      crumbs.push({ label: "Overview" });
      return crumbs;
    }
    const segment = pathname.split("/")[2];
    const labels: Record<string, string> = {
      projects: "Portfolio",
      services: "Services",
      posts: "Posts",
      testimonials: "Testimonials",
    };
    if (segment && labels[segment]) {
      const href = `/content/${segment}`;
      if (pathname === href) {
        crumbs.push({ label: labels[segment] });
      } else {
        crumbs.push({ href, label: labels[segment] });
        if (pathname.includes("/new")) crumbs.push({ label: "New" });
        else crumbs.push({ label: "Edit" });
      }
    }
    return crumbs;
  }

  const match = primaryNav.find(
    (item) =>
      item.href !== "/" &&
      item.href !== "/content" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
  if (match) {
    crumbs.push(
      pathname === match.href
        ? { label: match.label }
        : { href: match.href, label: match.label },
    );
    if (pathname.endsWith("/new")) crumbs.push({ label: "New" });
    else if (pathname.endsWith("/edit")) crumbs.push({ label: "Edit" });
    else if (pathname !== match.href) crumbs.push({ label: "Detail" });
  }

  return crumbs;
}
