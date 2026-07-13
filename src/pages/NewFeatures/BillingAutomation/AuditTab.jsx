// Tab 2 — Audit: latest batch issues + audit-report history + per-customer check.
import { useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, Spinner } from "reactstrap"
import { MdFileDownload, MdRefresh } from "react-icons/md"
import TableContainer from "../../../components/Table/TableContainer"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { BILLING_AUDIT_REPORTS } from "../../../api"
import { getStageStatusColor, reasonChips } from "./statusBadge"

const AuditTab = ({ batchCtl }) => {
    const batch = batchCtl?.batch
    const { apifunc: fetchReports, loading: reportsLoading } = useGetApiCall()
    const [reports, setReports] = useState([])

    const loadReports = async () => {
        const res = await fetchReports(`${BILLING_AUDIT_REPORTS}?source=BATCH&page=1&page_size=50`)
        if (res?.results) setReports(res.results)
    }

    useEffect(() => {
        loadReports()
    }, [])

    const summaryChips = reasonChips(batch?.summary?.reason_counts)
    const issueRows = (batch?.progress || []).filter((r) => r.stage_status?.toUpperCase() === "ISSUES")

    const handleReportDownload = (id) => {
        window.open(`${BILLING_AUDIT_REPORTS}${id}/download/`, "_blank")
    }

    const issueColumns = useMemo(() => [
        { header: "Customer", accessorKey: "customer_name" },
        {
            header: "Status",
            accessorKey: "stage_status",
            cell: (c) => <Badge color={getStageStatusColor(c.getValue())} className="p-2">{c.getValue()?.toUpperCase()}</Badge>,
        },
        { header: "Blocked", accessorKey: "blocked", cell: (c) => c.getValue() ?? 0 },
        {
            header: "Reasons",
            id: "reasons",
            cell: (cell) => {
                const chips = reasonChips(cell.row.original.reason_counts)
                return (
                    <div className="d-flex flex-wrap gap-1">
                        {chips.length
                            ? chips.map((c) => <Badge key={c.key} color="light" className="text-dark border">{c.label}: {c.count}</Badge>)
                            : <span className="text-muted">—</span>}
                    </div>
                )
            },
        },
    ], [])

    const reportColumns = useMemo(() => [
        {
            header: "Batch ID",
            accessorKey: "billing_batch_id",
            cell: (c) => <span className="fw-semibold">#{c.getValue() ?? "—"}</span>,
        },
        {
            header: "Date & Time",
            accessorKey: "created_at",
            id: "created_date",
            cell: (c) => {
                const v = c.getValue()
                if (!v) return "—"
                return (
                    <div>
                        <div>{v.slice(0, 10).split("-").reverse().join("-")}</div>
                        <div className="text-muted small">{v.slice(11, 16)}</div>
                    </div>
                )
            },
        },
        {
            header: "Period Start",
            accessorKey: "billing_period_start",
            cell: (c) => c.getValue() ? c.getValue().slice(0, 10).split("-").reverse().join("-") : "—",
        },
        {
            header: "Period End",
            accessorKey: "billing_period_end",
            cell: (c) => c.getValue() ? c.getValue().slice(0, 10).split("-").reverse().join("-") : "—",
        },
        { header: "Audited", accessorKey: "total_audited", cell: (c) => c.getValue() ?? 0 },
        { header: "Blocked", accessorKey: "blocked_shipments", cell: (c) => c.getValue() ?? 0 },
        {
            header: "Action",
            id: "action",
            cell: (cell) => {
                const row = cell.row.original
                return (
                    <Button
                        color="success"
                        size="sm"
                        title="Download report"
                        disabled={!row.has_file}
                        onClick={() => handleReportDownload(row.id)}
                    >
                        <MdFileDownload size={16} />
                    </Button>
                )
            },
        },
    ], [])

    return (
        <div>
            {/* Latest batch issue headline */}
            <Card className="shadow-sm border-0 mb-4">
                <CardBody>
                    <h5 className="fw-bold mb-3">Latest Sync &amp; Audit Issues</h5>
                    {batch ? (
                        <>
                            {summaryChips.length > 0 ? (
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    {summaryChips.map((c) => (
                                        <Badge key={c.key} color="danger" className="p-2">{c.label}: {c.count}</Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No blocking issues in the latest batch.</p>
                            )}
                            {issueRows.length > 0 && (
                                <TableContainer
                                    columns={issueColumns}
                                    data={issueRows}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    SearchPlaceholder="Search customer..."
                                    pagination="pagination pagination-rounded justify-content-end mb-2"
                                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                                    tableClass="table-hover mb-0"
                                />
                            )}
                        </>
                    ) : (
                        <p className="text-muted mb-0">Run a Sync &amp; Audit batch to see issues here.</p>
                    )}
                </CardBody>
            </Card>

            {/* Audit report history */}
            <Card className="shadow-sm border-0">
                <CardBody className="p-0">
                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Audit Report History</h5>
                        <Button color="secondary" size="sm" onClick={loadReports} disabled={reportsLoading}>
                            {reportsLoading ? <Spinner size="sm" /> : <><MdRefresh size={16} /> Refresh</>}
                        </Button>
                    </div>
                    <TableContainer
                        columns={reportColumns}
                        data={reports}
                        isGlobalFilter={true}
                        isPagination={true}
                        SearchPlaceholder="Search reports..."
                        pagination="pagination pagination-rounded justify-content-end mb-2"
                        paginationWrapper="dataTables_paginate paging_simple_numbers"
                        tableClass="table-hover mb-0"
                    />
                </CardBody>
            </Card>
        </div>
    )
}

export default AuditTab
