// Shared helpers for the Billing Automation batch screens.
// Maps batch-level status and per-customer stage_status to reactstrap Badge colors.

export const getBatchStatusColor = (status) => {
    switch (status?.toUpperCase()) {
        case "COMPLETED":
            return "success"
        case "PROCESSING":
            return "info"
        case "CREATED":
            return "warning"
        case "FAILED":
            return "danger"
        default:
            return "secondary"
    }
}

// stage_status values per customer in progress[]:
// PENDING | DONE | ISSUES | EMPTY | SKIPPED | FAILED
export const getStageStatusColor = (status) => {
    switch (status?.toUpperCase()) {
        case "DONE":
            return "success"
        case "ISSUES":
            return "danger"
        case "EMPTY":
            return "secondary"
        case "SKIPPED":
            return "warning"
        case "FAILED":
            return "danger"
        case "PENDING":
            return "info"
        default:
            return "secondary"
    }
}

// Human friendly label for a reason_count key e.g. missing_origin_pincode_master -> Missing Origin Pincode Master
export const humanizeReason = (key = "") =>
    key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())

// Reduce a batch.summary.reason_counts / row.reason_counts object into chip rows
export const reasonChips = (reasonCounts = {}) =>
    Object.entries(reasonCounts || {}).map(([key, count]) => ({
        key,
        label: humanizeReason(key),
        count,
    }))
