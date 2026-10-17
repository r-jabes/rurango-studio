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
      className="flex items-center justify-between gap-3 text-sm text-foreground-secondary"
    >
      <p>
        Page {page} of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link className="underline hover:text-foreground" href={href(page - 1)}>
            Previous
          </Link>
        ) : (
          <span className="text-foreground-muted">Previous</span>
        )}
        {page < pages ? (
          <Link className="underline hover:text-foreground" href={href(page + 1)}>
            Next
          </Link>
        ) : (
          <span className="text-foreground-muted">Next</span>
        )}
      </div>
    </nav>
  );
}
