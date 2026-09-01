export const DEFAULT_PAGE_SIZE = 25;

export function parsePage(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function paginate<T>(items: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pages,
    pageSize,
  };
}

export function pageHref(base: string, page: number) {
  const url = new URL(base, "https://coachjdc.org");
  if (page <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(page));
  }
  const query = url.searchParams.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}
