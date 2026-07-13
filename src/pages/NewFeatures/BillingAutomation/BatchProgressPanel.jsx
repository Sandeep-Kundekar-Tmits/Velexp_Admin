// Live progress panel shared by all three flows. Renders the progress bar,
// batch status badge, reason-count chips and the per-customer progress[] table.
// The "context" column adapts to the batch_type.
import { useMemo } from "react"
import { Badge, Button, Card, CardBody, Progress, Spinner } from "reactstrap"
import { MdFileDownload, MdStop } from "react-icons/md"
import TableContainer from "../../../components/Table/TableContainer"
import { CORPORATE_BILLING_RUNS } from "../../../api"
import { getBatchStatusColor, getStageStatusColor, reasonChips } from "./statusBadge"

const BatchProgressPanel = ({ batch, isPolling, onStop }) => {
    const batchType = batch?.batch_type

    const handleRunDownload = (runId) => {
        window.open(`${CORPORATE_BILLING_RUNS}${runId}/download/`, "_blank")
    }

    const renderContext = (row) => {
        // GENERATE_WORKING — show run id + download
        if (batchType === "GENERATE_WORKING" && row.billing_run_id) {
            return (
                <div className="d-flex align-items-center gap-2 justify-content-center">
                    <span className="text-muted small">Run #{row.billing_run_id}</span>
                    <Button color="success" size="sm" title="Download working file" onClick={() => handleRunDownload(row.billing_run_id)}>
                        <MdFileDownload size={16} />
                    </Button>
                </div>
            )
        }
        // DIRECT_INVOICE — show invoice number, or SKIPPED message
        if (batchType === "DIRECT_INVOICE") {
            if (row.invoice_id) {
                return <span className="text-success fw-semibold">{row.invoice_number || `Invoice #${row.invoice_id}`}</span>
            }
            return <span className="text-muted small">{row.message || "—"}</span>
        }
        // SYNC_AUDIT (and fallback) — show reason chips or message
        const chips = reasonChips(row.reason_counts)
        if (chips.length) {
            return (
                <div className="d-flex flex-wrap gap-1 justify-content-center">
                    {chips.map((c) => (
                        <Badge key={c.key} color="light" className="text-dark border" title={c.label}>
                            {c.label}: {c.count}
                        </Badge>
                    ))}
                </div>
            )
        }
        return <span className="text-muted small">{row.message || "—"}</span>
    }

    const columns = useMemo(() => [
        { header: "Customer", accessorKey: "customer_name" },
        {
            header: "Status",
            accessorKey: "stage_status",
            cell: (cell) => (
                <Badge color={getStageStatusColor(cell.getValue())} className="p-2">
                    {cell.getValue()?.toUpperCase() || "PENDING"}
                </Badge>
            ),
        },
        { header: "Scanned", accessorKey: "scanned", cell: (c) => c.getValue() ?? 0 },
        { header: "Created", accessorKey: "created", cell: (c) => c.getValue() ?? 0 },
        { header: "Updated", accessorKey: "updated", cell: (c) => c.getValue() ?? 0 },
        { header: "Blocked", accessorKey: "blocked", cell: (c) => c.getValue() ?? 0 },
        {
            header: "Details",
            id: "context",
            cell: (cell) => renderContext(cell.row.original),
        },
    ], [batchType])

    if (!batch) return null

    const total = batch.total_customers || 0
    const processed = batch.processed_customers || 0
    const pct = total > 0 ? Math.round((processed / total) * 100) : 0
    const summaryChips = reasonChips(batch?.summary?.reason_counts)

    return (
        <Card className="shadow-sm border-0 mb-4">
            <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <h5 className="mb-0 fw-bold">Batch #{batch.id}</h5>
                        <Badge color="light" className="text-dark border">{batchType}</Badge>
                        <Badge color={getBatchStatusColor(batch.status)} className="p-2">
                            {batch.status?.toUpperCase()}
                        </Badge>
                        {isPolling && <Spinner size="sm" color="primary" />}
                    </div>
                    {isPolling && (
                        <Button color="danger" size="sm" outline onClick={onStop} className="d-flex align-items-center gap-1">
                            <MdStop size={16} /> Stop polling
                        </Button>
                    )}
                </div>

                <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted small">
                            {batch.billing_period_start || "—"} to {batch.billing_period_end || "—"}
                        </span>
                        <span className="small fw-semibold">{processed} / {total} customers</span>
                    </div>
                    <Progress value={pct} color={getBatchStatusColor(batch.status)} animated={isPolling}>
                        {pct}%
                    </Progress>
                </div>

                {summaryChips.length > 0 && (
                    <div className="mb-3">
                        <h6 className="text-muted mb-2">Issue summary</h6>
                        <div className="d-flex flex-wrap gap-2">
                            {summaryChips.map((c) => (
                                <Badge key={c.key} color="danger" className="p-2" title={c.label}>
                                    {c.label}: {c.count}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <TableContainer
                    columns={columns}
                    data={batch.progress || []}
                    isGlobalFilter={true}
                    isPagination={true}
                    SearchPlaceholder="Search customer..."
                    pagination="pagination pagination-rounded justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-hover mb-0"
                    autoResetPageIndex={false}
                />
            </CardBody>
        </Card>
    )
}

export default BatchProgressPanel
