import { Button } from "@/components/ui";

// Page numbers to show: first, last, and a window around the current page,
// with "…" standing in for the skipped runs.
const pageWindow = (current, total) => {
    const pages = new Set([1, total]);
    for (let n = current - 2; n <= current + 2; n++) if (n > 1 && n < total) pages.add(n);
    const sorted = [...pages].sort((x, y) => x - y);
    const out = [];
    sorted.forEach((n, i) => {
        if (i && n - sorted[i - 1] > 1) out.push("…");
        out.push(n);
    });
    return out;
};

/**
 * Pager for server-paginated reports. Render it below the grid and pass the
 * grid every row of the current page, so the grid's own pager (and its
 * rows-per-page dropdown) stays off.
 */
const ServerPager = ({ currentPage, totalPages, totalCount, onPageChange }) => {
    if (!(totalPages > 1)) return null;
    return (
        <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2">
            <span className="text-xs text-ink-muted">
                Page <strong className="text-ink">{currentPage}</strong> of <strong className="text-ink">{totalPages}</strong>
                &nbsp;·&nbsp;{Number(totalCount || 0).toLocaleString()} total records
            </span>
            <div className="flex flex-wrap items-center gap-1">
                <Button size="sm" color="secondary" disabled={currentPage <= 1} onClick={() => onPageChange(1)}>« First</Button>
                <Button size="sm" color="secondary" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>‹ Prev</Button>
                {pageWindow(currentPage, totalPages).map((n, i) =>
                    n === "…" ? (
                        <span key={`gap-${i}`} className="px-1 text-ink-muted">…</span>
                    ) : (
                        <Button
                            key={n}
                            size="sm"
                            color={n === currentPage ? "primary" : "secondary"}
                            onClick={() => n !== currentPage && onPageChange(n)}
                        >
                            {n}
                        </Button>
                    )
                )}
                <Button size="sm" color="secondary" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>Next ›</Button>
                <Button size="sm" color="secondary" disabled={currentPage >= totalPages} onClick={() => onPageChange(totalPages)}>Last »</Button>
            </div>
        </div>
    );
};

export default ServerPager;
