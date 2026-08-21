import Link from "next/link";

import { pageHref } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pages,
  total,
  hrefBase,
  noun = "people",
}: {
  page: number;
  pages: number;
  total: number;
  hrefBase: string;
  noun?: string;
}) {
  if (total === 0) {
    return null;
  }

  const previous = page > 1 ? pageHref(hrefBase, page - 1) : null;
  const next = page < pages ? pageHref(hrefBase, page + 1) : null;
  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(pages, windowStart + 4);
  const numbers = Array.from({ length: windowEnd - windowStart + 1 }, (_, index) => windowStart + index);

  return (
    <nav className="dashboard-pagination" aria-label="Pagination">
      <p>
        {total} {noun}
        {pages > 1 ? ` · Page ${page} of ${pages}` : ""}
      </p>
      {pages > 1 ? (
        <div className="dashboard-pagination-links">
          {previous ? (
            <Link href={previous} className="macos-btn macos-btn-secondary">
              Previous
            </Link>
          ) : (
            <span className="macos-btn macos-btn-secondary is-disabled">Previous</span>
          )}
          {numbers.map((number) => (
            <Link
              key={number}
              href={pageHref(hrefBase, number)}
              className={cn("dashboard-page-link", number === page && "is-active")}
            >
              {number}
            </Link>
          ))}
          {next ? (
            <Link href={next} className="macos-btn macos-btn-secondary">
              Next
            </Link>
          ) : (
            <span className="macos-btn macos-btn-secondary is-disabled">Next</span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
