export const PAGE_LIMITS = {
  categories: 12,
  products: 12,
  popularProducts: 12,
  orders: 10,
} as const;

export type PaginatedPage<T> = {
  items: T[];
  page: number;
  hasMore: boolean;
  total?: number;
};

export function flattenPaginatedPages<T>(pages: PaginatedPage<T>[] | undefined): T[] {
  if (!pages?.length) return [];
  return pages.flatMap((page) => page.items);
}

function resolveHasMore(
  record: Record<string, unknown>,
  items: unknown[],
  page: number,
  limit: number,
  total?: number,
): boolean {
  if (items.length === 0) {
    return false;
  }

  const explicit = record.hasMore ?? record.has_more;
  if (explicit === false || explicit === 'false') {
    return false;
  }
  if (explicit === true || explicit === 'true') {
    return true;
  }
  if (Number.isFinite(total)) {
    return page * limit < (total as number);
  }
  return items.length >= limit;
}

/** Parses `{ data, page, limit, total, hasMore }` from the paginated list API. */
export function parsePaginatedPage<T>(
  response: unknown,
  normalizeItem: (raw: unknown) => T,
  page: number,
  limit: number,
): PaginatedPage<T> {
  if (response == null || typeof response !== 'object' || Array.isArray(response)) {
    return { items: [], page, hasMore: false };
  }

  const record = response as Record<string, unknown>;
  const rawItems = record.data ?? record.items ?? record.results;
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeItem) : [];

  const totalRaw = record.total ?? record.total_count ?? record.totalCount;
  const total = totalRaw != null ? Number(totalRaw) : undefined;
  const pageRaw = record.page != null ? Number(record.page) : page;
  const resolvedPage = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : page;

  return {
    items,
    page: resolvedPage,
    hasMore: resolveHasMore(record, items, resolvedPage, limit, total),
    total: Number.isFinite(total) ? (total as number) : undefined,
  };
}

export function buildPagedUrl(path: string, page: number, limit: number): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}page=${page}&limit=${limit}`;
}
