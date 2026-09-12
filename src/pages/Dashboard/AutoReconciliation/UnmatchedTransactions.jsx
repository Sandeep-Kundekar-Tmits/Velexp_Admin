// Outstanding bank-statement credits awaiting reconciliation, consolidated across all uploads.
// Ported from the Ops app (Pages/Operations/UnmatchedTransactions.jsx) — same two endpoints,
// same filters/columns, rebuilt on this app's reactstrap + TableContainer conventions.
// Rendered as a tab inside Auto Reconciliation (see index.jsx), not a standalone page.
import { useCallback, useEffect, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { Badge, Button, Card, CardBody, Col, Row, Spinner } from "reactstrap"
import { ExternalLink } from "lucide-react"
import TableContainer from "../../../components/Table/TableContainer"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { GET_BANK_STATEMENT_ENTRIES, DOWNLOAD_BANK_STATEMENT_ENTRIES } from "../../../api"

const STATUS_OPTIONS = [
    { value: "unmatched", label: "Unmatched" },
    { value: "flagged", label: "Flagged" },
    { value: "auto_approved", label: "Auto Approved" },
    { value: "manually_approved", label: "Manually Approved" },
    { value: "manually_disputed", label: "Manually Disputed" },
    { value: "skipped", label: "Skipped (Duplicate)" },
    { value: "all", label: "All Statuses" },
]

const DAYS_OPTIONS = [
    { value: "", label: "Till Date (All Time)" },
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "90", label: "Last 90 Days" },
]

const PAGE_SIZE_OPTIONS = [50, 100, 250, 500]

const MATCH_STATUS_COLOR = {
    unmatched: "secondary",
    flagged: "warning",
    auto_approved: "success",
    manually_approved: "success",
    manually_disputed: "danger",
    skipped: "dark",
}

const PAYMENT_TYPE_COLOR = {
    COD: "info",
    POP: "primary",
    NONE: "secondary",
}

const StatusBadge = ({ value, colorMap }) => (
    <Badge color={colorMap[value] || "secondary"} className="text-uppercase">
        {String(value || "-").replace(/_/g, " ")}
    </Badge>
)

const formatDateTime = (value) => {
    if (!value) return "-"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") return "-"
    return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const UnmatchedTransactions = () => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const [statusFilter, setStatusFilter] = useState("unmatched")
    const [days, setDays] = useState("")
    const [pageSize, setPageSize] = useState(50)
    const [page, setPage] = useState(1)

    const [entries, setEntries] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    // No auth on this flow (head office operates without JWTs) — plain fetch, no credentials.
    const fetchEntries = useCallback(async (targetPage) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                status: statusFilter,
                page: String(targetPage),
                page_size: String(pageSize),
            })
            if (days) params.set("days", days)

            const res = await fetch(`${GET_BANK_STATEMENT_ENTRIES}?${params.toString()}`)
            if (!res.ok) throw new Error(`Server error: ${res.status}`)
            const json = await res.json()

            setEntries(json.results || [])
            setTotalCount(json.count || 0)
        } catch (err) {
            console.error("Unmatched transactions fetch error:", err)
            ErrorToaster("Failed to load unmatched transactions")
            setEntries([])
            setTotalCount(0)
        } finally {
            setLoading(false)
        }
    }, [statusFilter, days, pageSize])

    // Reset to page 1 whenever a filter changes
    useEffect(() => { setPage(1) }, [statusFilter, days, pageSize])
    useEffect(() => { fetchEntries(page) }, [fetchEntries, page])

    const downloadExcel = async () => {
        setIsExporting(true)
        try {
            const body = { status: statusFilter }
            if (days) body.days = Number(days)

            const res = await fetch(DOWNLOAD_BANK_STATEMENT_ENTRIES, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            if (!res.ok) throw new Error(`Server error: ${res.status}`)
            const json = await res.json()
            const rows = json.results || []

            if (rows.length === 0) {
                ErrorToaster("No data available to download")
                return
            }

            const excelData = rows.map((r, index) => ({
                "SL No": index + 1,
                "Entry ID": r.id,
                "Upload ID": r.upload_id,
                "Serial No": r.serial_no,
                "Transaction ID": r.transaction_id,
                "Value Date": r.value_date,
                "Posted Date": r.txn_posted_date,
                "Description": r.description,
                "Amount": r.amount,
                "Balance": r.balance,
                "Match Status": r.match_status,
                "Payment Type": r.payment_type,
                "Matched Payment ID": r.matched_payment_id,
                "Extracted UTR": r.extracted_utr,
                "System UTR": r.system_utr,
                "UTR Matched": r.utr_matched ? "Yes" : "No",
                "Flag Reason": r.flag_reason,
                "Manual Remark": r.manual_remark,
                "Reviewed By": r.reviewed_by,
                "Reviewed At": r.reviewed_at,
            }))

            const ws = XLSX.utils.json_to_sheet(excelData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Unmatched Transactions")
            XLSX.writeFile(
                wb,
                `Unmatched_Transactions_${statusFilter}_${new Date().toISOString().split("T")[0]}.xlsx`
            )
            SucceesToaster("Excel downloaded successfully")
        } catch (err) {
            console.error("Excel download error:", err)
            ErrorToaster("Failed to download Excel")
        } finally {
            setIsExporting(false)
        }
    }

    const columns = useMemo(() => [
        { header: "ID", accessorKey: "id" },
        { header: "Upload", accessorKey: "upload_id" },
        { header: "Value Date", accessorKey: "value_date" },
        { header: "Posted On", accessorKey: "txn_posted_date", cell: (c) => formatDateTime(c.getValue()) },
        { header: "Description", accessorKey: "description" },
        { header: "Amount", accessorKey: "amount", cell: (c) => formatAmount(c.getValue()) },
        { header: "Balance", accessorKey: "balance", cell: (c) => formatAmount(c.getValue()) },
        {
            header: "Match Status", accessorKey: "match_status",
            cell: (c) => <StatusBadge value={c.getValue()} colorMap={MATCH_STATUS_COLOR} />,
        },
        {
            header: "Payment Type", accessorKey: "payment_type",
            cell: (c) => <StatusBadge value={c.getValue()} colorMap={PAYMENT_TYPE_COLOR} />,
        },
        { header: "Matched Payment ID", accessorKey: "matched_payment_id", cell: (c) => c.getValue() ?? "-" },
        {
            header: "Deposit Slip", accessorKey: "deposit_slip_photo",
            cell: (c) => c.getValue() ? (
                <a
                    href={c.getValue()}
                    target="_blank"
                    rel="noreferrer"
                    className="d-inline-flex align-items-center gap-1 text-primary"
                >
                    View <ExternalLink size={12} />
                </a>
            ) : "-",
        },
        { header: "Extracted UTR", accessorKey: "extracted_utr", cell: (c) => c.getValue() ?? "-" },
        { header: "System UTR", accessorKey: "system_utr", cell: (c) => c.getValue() ?? "-" },
        {
            header: "UTR Matched", accessorKey: "utr_matched",
            cell: (c) => <Badge color={c.getValue() ? "success" : "danger"}>{c.getValue() ? "Yes" : "No"}</Badge>,
        },
        { header: "Flag Reason", accessorKey: "flag_reason", cell: (c) => c.getValue() ?? "-" },
        { header: "Manual Remark", accessorKey: "manual_remark", cell: (c) => c.getValue() ?? "-" },
        { header: "Reviewed By", accessorKey: "reviewed_by", cell: (c) => c.getValue() ?? "-" },
        { header: "Reviewed At", accessorKey: "reviewed_at", cell: (c) => formatDateTime(c.getValue()) },
    ], [])

    const totalPages = Math.ceil(totalCount / pageSize) || 1
    const startRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
    const endRow = Math.min(page * pageSize, totalCount)

    return (
        <>
            <p className="text-muted small mb-3">
                Outstanding bank-statement credits awaiting reconciliation, consolidated across all uploads.
            </p>

            <div>
                <Card className="shadow-sm border-0 mb-3">
                    <CardBody className="py-3">
                        <Row className="align-items-end g-3">
                            <Col md={3}>
                                <label className="fw-bold small form-label">Status</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </Col>
                            <Col md={3}>
                                <label className="fw-bold small form-label">Date Range</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                >
                                    {DAYS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </Col>
                            <Col md={2}>
                                <label className="fw-bold small form-label">Page Size</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                >
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <option key={size} value={size}>{size} / page</option>
                                    ))}
                                </select>
                            </Col>
                            <Col md={4} className="d-flex justify-content-end">
                                <Button color="success" onClick={downloadExcel} disabled={isExporting}>
                                    {isExporting ? (
                                        <><Spinner size="sm" className="me-1" /> Exporting...</>
                                    ) : (
                                        <><i className="bx bx-download me-1"></i> Export Excel</>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Card className="shadow-sm border-0">
                    <CardBody className="p-0">
                        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
                            <span className="fw-bold small text-muted">
                                {loading
                                    ? "Loading…"
                                    : `Showing ${startRow}-${endRow} of ${totalCount.toLocaleString()} records — page ${page} of ${totalPages}`}
                            </span>
                            <div className="d-flex gap-2">
                                <Button size="sm" color="outline-secondary" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>
                                    &laquo; Prev
                                </Button>
                                <Button size="sm" color="outline-secondary" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                    Next &raquo;
                                </Button>
                            </div>
                        </div>
                        {loading ? (
                            <div className="d-flex justify-content-center py-5">
                                <Spinner color="primary" />
                            </div>
                        ) : (
                            <TableContainer
                                columns={columns}
                                data={entries}
                                isGlobalFilter={true}
                                isPagination={false}
                                SearchPlaceholder="Search loaded rows..."
                                tableClass="table-bordered table-nowrap mb-0"
                            />
                        )}
                    </CardBody>
                </Card>
            </div>
        </>
    )
}

export default UnmatchedTransactions
