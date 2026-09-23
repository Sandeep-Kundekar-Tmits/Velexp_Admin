// COD-pending reconciliation lookup: find a specific AWB/UTR/manifest number
// regardless of when it was delivered, or browse the current 30-day/service
// centre view narrowed by service centre and/or employee.
// Rendered as a tab inside Auto Reconciliation (see index.jsx).
import { useEffect, useMemo, useRef, useState } from "react"
import { Badge, Button, Card, CardBody, Input, Label, Spinner } from "@/components/ui"
import { FaFileExcel } from "react-icons/fa"
import TableContainer from "../../../components/Table/TableContainer"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { COD_PENDING_REPORT, DOWNLOAD_COD_PENDING_REPORT } from "../../../api"
import { authFetch } from "@/lib/http"

const PAGE_SIZE_OPTIONS = [50, 100, 250, 500]

const fmtCurrency = (v) =>
    v === null || v === undefined ? "—" : `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDateTime = (v) => {
    if (!v) return "—"
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return v
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

const orDash = (v) => (v === null || v === undefined || v === "" ? "—" : v)

const StatBadge = ({ label, value, color = "primary" }) => (
    <div className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-2.5 py-1">
        <span className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</span>
        <Badge color={color}>{value ?? "—"}</Badge>
    </div>
)

const CodPendingReport = () => {
    const { ErrorToaster } = ToasterProvider()

    const [search, setSearch] = useState("")
    const [serviceCenter, setServiceCenter] = useState("")
    const [employee, setEmployee] = useState("")
    const [pageSize, setPageSize] = useState(100)

    const [rows, setRows] = useState([])
    const [summary, setSummary] = useState(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    // The description/filters/stats block collapses once the tab's own
    // scroll box moves away from the top, so more of the table stays in
    // view, and reappears once scrolled back to the top.
    const scrollRef = useRef(null)
    const [headerCollapsed, setHeaderCollapsed] = useState(false)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return undefined
        const onScroll = () => setHeaderCollapsed(el.scrollTop > 8)
        el.addEventListener("scroll", onScroll, { passive: true })
        return () => el.removeEventListener("scroll", onScroll)
    }, [])

    // Filters only -- shared by both the paginated fetch (page/page_size
    // layered on top) and the download, which per its own spec ignores
    // paging and always exports the full matching set.
    const buildFilterPayload = () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
        const payload = { user_id: authUser?.user?.id }
        if (search.trim()) payload.search = search.trim()
        if (serviceCenter.trim()) payload.service_center = serviceCenter.trim()
        if (employee.trim()) payload.employee = employee.trim()
        return payload
    }

    const fetchReport = async (targetPage = 1) => {
        setLoading(true)
        setHasSearched(true)
        try {
            const res = await authFetch(COD_PENDING_REPORT, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...buildFilterPayload(), page: targetPage, page_size: pageSize }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok) {
                ErrorToaster(json?.error || "Failed to load report")
                setRows([])
                setSummary(null)
                setTotalPages(1)
                return
            }
            setRows(Array.isArray(json?.shipments) ? json.shipments : [])
            setSummary(json)
            setPage(json?.page ?? targetPage)
            setTotalPages(json?.total_pages ?? 1)
        } catch (err) {
            console.error("COD pending report fetch error:", err)
            ErrorToaster("Failed to load report")
            setRows([])
            setSummary(null)
            setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }

    const downloadExcel = async () => {
        setIsExporting(true)
        try {
            const res = await authFetch(DOWNLOAD_COD_PENDING_REPORT, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildFilterPayload()),
            })
            if (!res.ok) {
                const errJson = await res.json().catch(() => null)
                throw new Error(errJson?.error || `Server error: ${res.status}`)
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `COD_Pending_Report_${new Date().toISOString().split("T")[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error("COD pending report download error:", err)
            ErrorToaster(err.message || "Download failed")
        } finally {
            setIsExporting(false)
        }
    }

    const columns = useMemo(() => [
        { header: "AWB No", accessorKey: "awbno" },
        { header: "Booked", accessorKey: "booked_date", cell: (c) => fmtDateTime(c.getValue()) },
        { header: "Delivered", accessorKey: "delivered_date", cell: (c) => fmtDateTime(c.getValue()) },
        { header: "Service Center", accessorKey: "service_center" },
        {
            header: "Employee", id: "employee",
            cell: ({ row }) => orDash(row.original.employee_name || row.original.delivered_by),
        },
        { header: "Customer Code", accessorKey: "customer_code" },
        { header: "Customer", accessorKey: "customer_name" },
        { header: "Consignee", accessorKey: "consignee_name" },
        { header: "City", accessorKey: "consignee_city" },
        { header: "State", accessorKey: "consignee_state" },
        { header: "Pincode", accessorKey: "consignee_pincode" },
        { header: "Service Type", accessorKey: "service_type", cell: (c) => orDash(c.getValue()) },
        { header: "Shipment Value", accessorKey: "shipment_value", cell: (c) => fmtCurrency(c.getValue()) },
        { header: "COD Amount", accessorKey: "cod_amount", cell: (c) => fmtCurrency(c.getValue()) },
        {
            header: "COD Collected", accessorKey: "cod_collected",
            cell: (c) => <span className="text-success-500">{fmtCurrency(c.getValue())}</span>,
        },
        {
            header: "COD Pending", accessorKey: "cod_pending",
            cell: (c) => (
                <span className={Number(c.getValue()) > 0 ? "text-danger-500 font-semibold" : "text-ink"}>
                    {fmtCurrency(c.getValue())}
                </span>
            ),
        },
        {
            header: "Status", accessorKey: "chkpnt",
            cell: (c) => <Badge color="secondary" className="uppercase">{orDash(c.getValue())}</Badge>,
        },
        { header: "Status Date", accessorKey: "chkdate", cell: (c) => fmtDateTime(c.getValue()) },
        { header: "Slip No", accessorKey: "slip_no", cell: (c) => orDash(c.getValue()) },
        { header: "Slip Date", accessorKey: "slipdate", cell: (c) => fmtDateTime(c.getValue()) },
        { header: "Remittance UTR", accessorKey: "remittance_utr_no", cell: (c) => orDash(c.getValue()) },
        { header: "Remittance Date", accessorKey: "remittance_utr_date", cell: (c) => fmtDateTime(c.getValue()) },
        { header: "Payment Source", accessorKey: "payment_source", cell: (c) => orDash(c.getValue()) },
        { header: "Manifest No", accessorKey: "manifest_no", cell: (c) => orDash(c.getValue()) },
    ], [])

    const handleKeyDown = (e) => { if (e.key === "Enter") fetchReport(1) }

    return (
        /* The tab's own scroll box -- a plain maxHeight+overflow:auto, not
           dependent on the .page-fit-body flex chain (see TableContainer's
           fillHeight, which needs that chain and this nested tab doesn't
           have it). Scrolling it drives the header collapse below, and its
           sticky table header (isStickyHeader) sticks to *this* box's top. */
        <div ref={scrollRef} className="scroll-slim" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div
                className="transition-[max-height,opacity] duration-300 ease-out"
                style={{ maxHeight: headerCollapsed ? 0 : 600, opacity: headerCollapsed ? 0 : 1, overflow: "hidden" }}
            >
                <p className="mb-3 text-xs text-ink-muted">
                    Look up a specific AWB, UTR or manifest number regardless of when it was delivered, or browse the current pending-COD view narrowed by service centre and/or employee.
                </p>

                <Card className="mb-3">
                    <CardBody className="flex flex-wrap items-end gap-3 py-3">
                        <div className="flex w-full flex-col gap-1.5 sm:w-64">
                            <Label className="mb-0 text-xs font-bold text-ink-muted">AWB / UTR / Manifest No</Label>
                            <Input
                                type="text"
                                placeholder="e.g. VIN0070174, UTR123456789…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className="flex w-full flex-col gap-1.5 sm:w-40">
                            <Label className="mb-0 text-xs font-bold text-ink-muted">Service Center</Label>
                            <Input
                                type="text"
                                placeholder="e.g. DEL01"
                                value={serviceCenter}
                                onChange={(e) => setServiceCenter(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className="flex w-full flex-col gap-1.5 sm:w-48">
                            <Label className="mb-0 text-xs font-bold text-ink-muted">Employee</Label>
                            <Input
                                type="text"
                                placeholder="e.g. Rakesh"
                                value={employee}
                                onChange={(e) => setEmployee(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:w-32">
                            <Label className="mb-0 text-xs font-bold text-ink-muted">Page Size</Label>
                            <select
                                className="form-select form-select-sm"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>{size} / page</option>
                                ))}
                            </select>
                        </div>

                        <Button color="primary" onClick={() => fetchReport(1)} disabled={loading}>
                            {loading ? "Loading..." : "Search"}
                        </Button>
                        <Button
                            color="success"
                            className="ml-auto flex items-center gap-1"
                            onClick={downloadExcel}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <><Spinner size="sm" className="mr-1" /> Exporting...</>
                            ) : (
                                <><FaFileExcel size={14} aria-hidden="true" /> Export Excel</>
                            )}
                        </Button>
                    </CardBody>
                </Card>

                {summary && (
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <StatBadge label="Shipments" value={summary.total_shipments?.toLocaleString()} color="primary" />
                        <StatBadge label="Shipment Value" value={fmtCurrency(summary.total_shipment_value)} color="secondary" />
                        <StatBadge label="COD Amount" value={fmtCurrency(summary.total_cod_amount)} color="info" />
                        <StatBadge label="COD Collected" value={fmtCurrency(summary.total_cod_collected)} color="success" />
                        <StatBadge label="COD Pending" value={fmtCurrency(summary.total_cod_pending)} color="danger" />
                        {summary.scope && <StatBadge label="Scope" value={summary.scope} color="dark" />}
                        {summary.start_date && summary.end_date && (
                            <span className="text-xs text-ink-muted">{summary.start_date} → {summary.end_date}</span>
                        )}
                    </div>
                )}
            </div>

            {!hasSearched ? (
                <p className="text-ink-muted text-xs py-6 text-center">Search or browse to load results</p>
            ) : loading ? (
                <div className="flex justify-center py-10">
                    <Spinner color="primary" />
                </div>
            ) : (
                <>
                    {/* No Card wrapper here -- TableContainer's own .grid-shell
                        already draws a complete bordered panel, and boxing that
                        in a second bordered Card was a panel inside a panel,
                        i.e. the double border around the table. */}
                    <TableContainer
                        columns={columns}
                        data={rows}
                        isGlobalFilter={true}
                        isPagination={false}
                        SearchPlaceholder="Search loaded rows..."
                        tableClass="table-nowrap mb-0"
                        /* Server-paged already (the pager below), so this
                           just needs to show everything fetchReport just
                           loaded rather than TanStack's own default 50-row
                           internal page silently truncating it. */
                        defaultPageSize={pageSize}
                        isStickyHeader={true}
                        stickyTop={0}
                    />

                    {/* Below the table, not above it. Plain, unboxed -- the
                        grid-shell panel above already reads as the table's
                        own frame. */}
                    <div className="mt-2 flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-ink-muted">
                            {`Page ${page} of ${totalPages.toLocaleString()} — ${(summary?.total_shipments ?? 0).toLocaleString()} record(s)`}
                        </span>
                        {totalPages > 1 && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={page <= 1}
                                    onClick={() => fetchReport(page - 1)}
                                >
                                    &laquo; Prev
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={page >= totalPages}
                                    onClick={() => fetchReport(page + 1)}
                                >
                                    Next &raquo;
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default CodPendingReport
