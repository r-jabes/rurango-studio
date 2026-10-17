export const DEFAULT_PAGE_SIZE = 20;

export function parsePage(value: string | undefined | null) {
  const page = Number(value ?? "1");
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export function pageOffset(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  return (page - 1) * pageSize;
}

export function totalPages(total: number, pageSize = DEFAULT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}
