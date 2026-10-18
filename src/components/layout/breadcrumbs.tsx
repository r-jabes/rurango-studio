"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbsForPath } from "@/lib/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = breadcrumbsForPath(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-muted">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <span aria-hidden className="text-foreground-muted/60">
                  /
                </span>
              ) : null}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-sm"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={last ? "font-medium text-foreground-secondary" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
