export const CMS_ENTRY_TYPES = [
  "portfolio_project",
  "service",
  "post",
  "testimonial",
] as const;

export type CmsEntryType = (typeof CMS_ENTRY_TYPES)[number];

export const CMS_ENTRY_STATUSES = [
  "draft",
  "in_review",
  "published",
  "archived",
] as const;

export type CmsEntryStatus = (typeof CMS_ENTRY_STATUSES)[number];

export const cmsTypeLabels: Record<CmsEntryType, string> = {
  portfolio_project: "Portfolio project",
  service: "Service",
  post: "Post",
  testimonial: "Testimonial",
};

export const cmsTypeRoutes: Record<CmsEntryType, string> = {
  portfolio_project: "/content/projects",
  service: "/content/services",
  post: "/content/posts",
  testimonial: "/content/testimonials",
};

export const cmsTypeFromRoute: Record<string, CmsEntryType> = {
  projects: "portfolio_project",
  services: "service",
  posts: "post",
  testimonials: "testimonial",
};

export function cmsStatusTone(
  status: CmsEntryStatus,
): "neutral" | "accent" | "success" | "warning" | "danger" {
  switch (status) {
    case "draft":
      return "neutral";
    case "in_review":
      return "warning";
    case "published":
      return "success";
    case "archived":
      return "danger";
  }
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
