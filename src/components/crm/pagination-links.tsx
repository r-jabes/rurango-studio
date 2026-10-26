import Link from "next/link";
import { totalPages } from "@/lib/pagination";

type PaginationLinksProps = {
  pathname: string;
  page: number;
  total: number;
  pageSize: number;
  query?: Record<string, string | undefined>;
};

export function PaginationLinks({
  pathname,
  page,
  total,
  pageSize,
  query = {},
}: PaginationLinksProps) {
  const pages = totalPages(total, pageSize);
  if (pages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function href(target: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(target));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-foreground-secondary"
    >
      <p className="text-xs text-foreground-muted">
        Showing {from}–{to} of {total} · Page {page} of {pages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            className="rounded-md px-2 py-1 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            href={href(page - 1)}
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-md px-2 py-1 text-foreground-muted" aria-disabled>
            Previous
          </span>
        )}
        {page < pages ? (
          <Link
            className="rounded-md px-2 py-1 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            href={href(page + 1)}
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md px-2 py-1 text-foreground-muted" aria-disabled>
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
