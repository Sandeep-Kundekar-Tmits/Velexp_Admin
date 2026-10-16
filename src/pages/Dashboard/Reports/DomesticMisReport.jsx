// Domestic MIS Report -- customer typeahead + date range, same shape as the
// reference dashboard at https://velexp.com/v1/dashboard's Domestic MIS
// section. Both endpoints are plain DRF REST (no "get-list"/{status:1}
// envelope), so this calls rawRequest directly rather than the generic
// use*ApiCall hooks, same reasoning as RiderStoreRoutes.jsx/PincodeMaster*.
//
// Response confirmed as { tracking_data: [...], status_counts: {...} }
// (D:\VelexpDashboard\VelexpDashboard's TrackDetaillayout.jsx /
// TrackDetailTableComp.jsx, the reference this screen mirrors). Columns,
// labels, order and the Chargeable Weight/export formatting below match
// that reference's domestic column set exactly rather than being derived
// from whatever keys happen to come back.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AsyncSelect from "react-select/async"
import { Button, Label, Spinner } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../../helpers/CustomStyle"
import DateRangeInput from "../../../components/Common/DateRangeInput"
import TableContainer from "../../../components/Table/TableContainer"
import MainHeaderComp from "../../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../../helpers/ToasterProvider"
import YMD_DateFormate from "../../../helpers/YMD_DateFormate"
import { formatDisplayDate } from "../../../helpers/formatDisplayDate"
import { useExcelExport } from "../../../hooks/useExcelExport"
import { DOMESTIC_MIS_CUSTOMERS, DOMESTIC_MIS_REPORT } from "../../../api"

// Max of the two weight fields, same "chargeable weight" convention the
// reference uses instead of showing weight/vol_weight separately.
const chargeableWeight = (row) => Math.max(Number(row?.weight || 0), Number(row?.vol_weight || 0))

// TableContainer's default global filter runs match-sorter's rankItem (fuzzy
// scoring) per cell. At this screen's real volume -- 10k+ rows x ~25 columns
// -- that's 250k+ fuzzy-match calls on every keystroke, which is exactly what
// was freezing the UI while typing in the search box. A plain, case-
// insensitive substring test does the same practical job (does this cell
// contain what I typed) at a fraction of the cost.
const plainTextFilter = (row, columnId, filterValue) => {
    const value = row.getValue(columnId)
    if (value == null) return false
    return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
}

const humanize = (key) => key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())

// Confirmed response shape: { tracking_data: [...] }. None of the generic
// names this used to guess at (data/results/rows) matched, so the array was
// never found -- the fetch succeeded, rows stayed [], and the table rendered
// with zero records. tracking_data is checked first; the rest are kept as a
// fallback in case a different filter_status ever shapes the response
// differently.
const unwrapRows = (res) => {
    if (Array.isArray(res)) return res
    const candidates = [res?.tracking_data, res?.data, res?.results, res?.rows]
    for (const c of candidates) {
        if (Array.isArray(c)) return c
        if (Array.isArray(c?.results)) return c.results
        if (Array.isArray(c?.data)) return c.data
        if (Array.isArray(c?.rows)) return c.rows
    }
    return []
}

// Confirmed alongside tracking_data: status_counts is an object of bucket ->
// count (e.g. {IN_TRANSIT: 461, PICKUP_PENDING: 674, ..., TOTAL: 1498}). The
// summary strip used to be built by scanning the response for scalar fields,
// which is exactly why it never showed anything here -- status_counts is an
// object, so that scan skipped it outright. known order + tone first, then
// whatever other keys the response actually sent (humanized), so a bucket
// this doesn't already know about still gets a card instead of being dropped.
const STATUS_CARD_META = {
    TOTAL: { label: "Total Shipments", tone: "ink" },
    DELIVERED: { label: "Delivered", tone: "success" },
    IN_TRANSIT: { label: "In Transit", tone: "accent" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", tone: "warning" },
    PICKUP_PENDING: { label: "Pickup Pending", tone: "warning" },
    UNDELIVERED: { label: "Undelivered", tone: "danger" },
    RTS: { label: "RTS", tone: "danger" },
    LOST: { label: "Lost", tone: "danger" },
}
const STATUS_CARD_ORDER = Object.keys(STATUS_CARD_META)

// Confirmed bucket -> raw checkpoint code mapping. The row-level `status`
// field is one of these codes (e.g. "SPU"), not a bucket name, so a status
// card can filter the already-fetched rows directly -- no second request
// needed. TOTAL has no code set; it means "every row" (handled separately
// below rather than listed here).
const STATUS_CODE_MAP = {
    IN_TRANSIT: ["SAO", "LDP", "PUD", "SMR", "ITR", "SOH", "SAM", "SDH", "ITM", "LMT", "SAD"],
    PICKUP_PENDING: ["SPU", "FMPNR", "OFP", "PICKUP_PENDING", "PUI", "FMICA", "FMPNA", "FMPUC", "FMVLC", "FMHOC"],
    OUT_FOR_DELIVERY: ["OFD"],
    UNDELIVERED: ["SPH", "DRC", "ICA", "CRF", "CNS", "RTA", "CAN", "COS", "ERA", "PUP", "DPT", "RTO", "DIS", "OSA", "ODD", "CNA", "SPL", "SDM", "SDO"],
    RTS: ["RTS"],
    DELIVERED: ["SPD"],
}
const normalizeCode = (value) => String(value ?? "").trim().toUpperCase()
const matchesStatusTab = (row, tabKey) => {
    if (tabKey === "TOTAL") return true
    const codes = STATUS_CODE_MAP[tabKey]
    if (!codes) return true // an unknown bucket (not in the mapping) shows everything rather than nothing
    return codes.includes(normalizeCode(row?.status))
}

// resting / active (the currently-applied filter) classes per tone --
// explicit per state rather than one class + a ring modifier, so the active
// card's fill visibly strengthens too, not just its border.
const TONE_CLASSES = {
    ink: {
        base: "border-line bg-[rgb(var(--overlay-rgb)/0.05)] text-ink",
        active: "border-line bg-[rgb(var(--overlay-rgb)/0.12)] text-ink ring-2 ring-line",
    },
    success: {
        base: "border-success-500/30 bg-success-500/10 text-success-500",
        active: "border-success-500 bg-success-500/20 text-success-500 ring-2 ring-success-500",
    },
    accent: {
        base: "border-accent-500/30 bg-accent-500/10 text-accent-500",
        active: "border-accent-500 bg-accent-500/20 text-accent-500 ring-2 ring-accent-500",
    },
    warning: {
        base: "border-warning-500/30 bg-warning-500/10 text-warning-500",
        active: "border-warning-500 bg-warning-500/20 text-warning-500 ring-2 ring-warning-500",
    },
    danger: {
        base: "border-danger-500/30 bg-danger-500/10 text-danger-500",
        active: "border-danger-500 bg-danger-500/20 text-danger-500 ring-2 ring-danger-500",
    },
}

const DomesticMisReport = () => {
    useEffect(() => { document.title = "Customer Dashboard Report" }, [])

    const { ErrorToaster } = ToasterProvider()

    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [selectedRange, setSelectedRange] = useState({ startDate: null, endDate: null })
    const [filterStatus, setFilterStatus] = useState("All")

    const [rows, setRows] = useState([])
    const [statusCounts, setStatusCounts] = useState(null)
    // Which status card is currently narrowing the table view. Purely a
    // client-side display filter over `rows` -- unrelated to filterStatus
    // above, which is the server-side filter_status sent on fetch.
    const [activeStatusTab, setActiveStatusTab] = useState("TOTAL")
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const { exportToExcel, isExporting } = useExcelExport()

    // Default date range: current month to date, same convention as the
    // sibling MIS report screens.
    useEffect(() => {
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        setSelectedRange({ startDate: firstDay, endDate: today })
    }, [])

    const customerSearchTimeout = useRef(null)
    const loadCustomerOptions = useCallback((inputValue, callback) => {
        if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
        customerSearchTimeout.current = setTimeout(async () => {
            const { ok, data } = await rawRequest(`${DOMESTIC_MIS_CUSTOMERS}?search=${encodeURIComponent(inputValue)}`, { method: "GET" })
            const list = ok ? (Array.isArray(data) ? data : data?.results || []) : []
            callback(list.map((c) => ({ value: c.user_id, label: c.customer_name })))
        }, 400)
    }, [])

    const handleFetchReport = async () => {
        if (!selectedCustomer) {
            ErrorToaster("Please select a customer")
            return
        }
        if (!selectedRange.startDate || !selectedRange.endDate) {
            ErrorToaster("Please select both start and end dates")
            return
        }
        const { from_date, to_date } = YMD_DateFormate(selectedRange)

        setLoading(true)
        try {
            const { ok, data } = await rawRequest(DOMESTIC_MIS_REPORT, {
                method: "POST",
                body: {
                    user_id: selectedCustomer.value,
                    start_date: from_date,
                    end_date: to_date,
                    filter_status: filterStatus || "All",
                },
            })
            setHasSearched(true)
            // A fresh fetch starts back on the full (TOTAL) view -- whatever
            // tab was active for the previous result may not mean anything
            // for this one.
            setActiveStatusTab("TOTAL")
            if (ok) {
                setRows(unwrapRows(data))
                setStatusCounts(data?.status_counts || null)
            } else {
                setRows([])
                setStatusCounts(null)
                ErrorToaster(data?.detail || data?.error || data?.message || "Failed to load the report")
            }
        } catch {
            setHasSearched(true)
            setRows([])
            setStatusCounts(null)
            ErrorToaster("Failed to load the report — network error")
        } finally {
            setLoading(false)
        }
    }

    // Instant, client-side -- just narrows which already-fetched rows are
    // shown, via STATUS_CODE_MAP. No request involved.
    const visibleRows = useMemo(
        () => rows.filter((row) => matchesStatusTab(row, activeStatusTab)),
        [rows, activeStatusTab]
    )

    const statusCardList = useMemo(() => {
        if (!statusCounts) return []
        const known = STATUS_CARD_ORDER.filter((key) => key in statusCounts)
        const extra = Object.keys(statusCounts).filter((key) => !STATUS_CARD_ORDER.includes(key))
        return [...known, ...extra].map((key) => ({
            key,
            count: statusCounts[key],
            ...(STATUS_CARD_META[key] || { label: humanize(key), tone: "ink" }),
        }))
    }, [statusCounts])

    const columns = useMemo(() => [
        { header: "Sl. No.", id: "sl_no", enableSorting: false, cell: ({ row }) => row.index + 1 },
        { header: "AWB No.", accessorKey: "awb", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Order No.", accessorKey: "orderno", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Cust Ref No", accessorKey: "ref2", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Pickup Date", accessorKey: "pupdate", enableSorting: true, cell: ({ getValue }) => formatDisplayDate(getValue()) || "-" },
        { header: "ORGSC", accessorKey: "orgsc", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Shipper", accessorKey: "pick_name", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Contact Person", accessorKey: "contact_person", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Consignee", accessorKey: "consignee", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Status", accessorKey: "status", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Status Date", accessorKey: "statdate", enableSorting: true, cell: ({ getValue }) => formatDisplayDate(getValue()) || "-" },
        { header: "Pincode", accessorKey: "pincode", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Remarks", accessorKey: "remarks", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Time", accessorKey: "time", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Chargeable Weight", id: "chargeable_weight", enableSorting: true, cell: ({ row }) => chargeableWeight(row.original).toFixed(2) },
        { header: "Destination", accessorKey: "destination", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Service Center", accessorKey: "service_center", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Pieces", accessorKey: "number_of_pieces", enableSorting: true, cell: ({ getValue }) => getValue() ?? "-" },
        { header: "Shipment Value", accessorKey: "shipment_value", enableSorting: true, cell: ({ getValue }) => { const v = getValue(); return v != null ? Number(v).toFixed(2) : "-" } },
        { header: "Payment Mode", accessorKey: "payment_mode", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Service Type", accessorKey: "service_type", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Attempts", accessorKey: "attempts", enableSorting: true, cell: ({ getValue }) => getValue() ?? "-" },
        { header: "POD", accessorKey: "pod", enableSorting: true, cell: ({ getValue }) => (getValue() ? "True" : "False") },
        { header: "OTP Verified", accessorKey: "otp_verified", enableSorting: true, cell: ({ getValue }) => (getValue() ? "True" : "False") },
        { header: "Shipment Flag", accessorKey: "shipment_flag", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
        { header: "Flag Remark", accessorKey: "flag_remark", enableSorting: true, cell: ({ getValue }) => getValue() || "-" },
    ], [])

    // Mirrors the on-screen columns 1:1, except Chargeable Weight/Shipment
    // Value export as real numbers rather than the .toFixed() display
    // strings -- so SUM()/other formulas in Excel work on the column
    // instead of treating it as text, same reasoning as the reference.
    const buildExportRow = useCallback((row, index) => ({
        "Sl. No.": index + 1,
        "AWB No.": row.awb || "-",
        "Order No.": row.orderno || "-",
        "Cust Ref No": row.ref2 || "-",
        "Pickup Date": formatDisplayDate(row.pupdate) || "-",
        "ORGSC": row.orgsc || "-",
        "Shipper": row.pick_name || "-",
        "Contact Person": row.contact_person || "-",
        "Consignee": row.consignee || "-",
        "Status": row.status || "-",
        "Status Date": formatDisplayDate(row.statdate) || "-",
        "Pincode": row.pincode || "-",
        "Remarks": row.remarks || "-",
        "Time": row.time || "-",
        "Chargeable Weight": chargeableWeight(row),
        "Destination": row.destination || "-",
        "Service Center": row.service_center || "-",
        "Pieces": row.number_of_pieces ?? "-",
        "Shipment Value": Number(row.shipment_value || 0),
        "Payment Mode": row.payment_mode || "-",
        "Service Type": row.service_type || "-",
        "Attempts": row.attempts ?? "-",
        "POD": row.pod ? "True" : "False",
        "OTP Verified": row.otp_verified ? "True" : "False",
        "Shipment Flag": row.shipment_flag || "-",
        "Flag Remark": row.flag_remark || "-",
    }), [])

    const handleDownloadExcel = () => exportToExcel(visibleRows, "Domestic_MIS_Report", buildExportRow)

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Customer Dashboard Report"
                subTitle={hasSearched ? `Showing ${visibleRows.length} of ${rows.length} record(s)` : "Select a customer and date range to run the report."}
            />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- customer + date range + status, same single-row-that-wraps convention as the other report screens. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-72">
                        <Label className="form-label m-0 font-bold text-ink-muted">Customer</Label>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={loadCustomerOptions}
                            value={selectedCustomer}
                            onChange={setSelectedCustomer}
                            placeholder="Search customer by name"
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            isClearable
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-72">
                        <Label className="form-label m-0 font-bold text-ink-muted">Select Date Range</Label>
                        <DateRangeInput
                            value={selectedRange}
                            onChange={setSelectedRange}
                            isBorder={true}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="form-label m-0 font-bold text-ink-muted">Filter Status</Label>
                        <input
                            type="text"
                            className="form-control"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            placeholder="All"
                        />
                    </div>

                    <Button
                        color="primary"
                        onClick={handleFetchReport}
                        disabled={loading || !selectedCustomer || !selectedRange.startDate || !selectedRange.endDate}
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Loading...
                            </>
                        ) : (
                            "Fetch Report"
                        )}
                    </Button>
                </div>

                {/* Summary -- status_counts as clickable tabs over the
                    already-fetched rows (STATUS_CODE_MAP matches each row's
                    raw checkpoint code, e.g. "SPU", to the bucket it
                    belongs to). Instant and client-side, not a new request. */}
                {statusCardList.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-4 lg:grid-cols-8">
                        {statusCardList.map((stat) => {
                            const isActive = activeStatusTab === stat.key
                            const tone = TONE_CLASSES[stat.tone] || TONE_CLASSES.ink
                            return (
                                <button
                                    key={stat.key}
                                    type="button"
                                    onClick={() => setActiveStatusTab(stat.key)}
                                    title={`Show ${stat.label}`}
                                    className={`flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors ${isActive ? tone.active : tone.base}`}
                                >
                                    <span className="text-[10.5px] uppercase tracking-wider opacity-80">{stat.label}</span>
                                    <span className="text-[18px] font-semibold leading-tight">{Number(stat.count ?? 0).toLocaleString("en-IN")}</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Table */}
                <div className="page-fit-body mt-4">
                    {loading ? (
                        <Loader fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={visibleRows}
                            isGlobalFilter={true}
                            globalFilterFn={plainTextFilter}
                            isPagination={true}
                            isCustomPageSize={false}
                            defaultPageSize={100}
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            SearchPlaceholder="Search within results..."
                            isDownloadExcle={true}
                            onDownloadExcle={handleDownloadExcel}
                            ExcleLoading={isExporting}
                            tableClass="table-nowrap"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="68vh"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default DomesticMisReport
