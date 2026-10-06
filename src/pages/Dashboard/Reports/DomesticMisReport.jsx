// Domestic MIS Report -- customer typeahead + date range, same shape as the
// reference dashboard at https://velexp.com/v1/dashboard's Domestic MIS
// section. Both endpoints are plain DRF REST (no "get-list"/{status:1}
// envelope), so this calls rawRequest directly rather than the generic
// use*ApiCall hooks, same reasoning as RiderStoreRoutes.jsx/PincodeMaster*.
//
// The POST /api/admin-panel/domestic-mis/ response shape wasn't given to us
// (only the request was documented) -- the table columns and summary strip
// below are therefore built DYNAMICALLY from whatever keys the response
// actually returns, rather than a fixed column list that could silently
// hide fields. Once a real response is seen, these can be swapped for an
// explicit column list (see InternationalMisReport.jsx for that pattern).
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AsyncSelect from "react-select/async"
import { Badge, Button, Label, Spinner } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../../helpers/CustomStyle"
import DateRangeInput from "../../../components/Common/DateRangeInput"
import TableContainer from "../../../components/Table/TableContainer"
import MainHeaderComp from "../../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../../helpers/ToasterProvider"
import YMD_DateFormate from "../../../helpers/YMD_DateFormate"
import { isIsoDateLike, formatDisplayDate } from "../../../helpers/formatDisplayDate"
import { DOMESTIC_MIS_CUSTOMERS, DOMESTIC_MIS_REPORT } from "../../../api"

const humanize = (key) => key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())

const unwrapRows = (res) => {
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.results)) return res.results
    if (Array.isArray(res?.rows)) return res.rows
    return []
}

// Any top-level scalar field the response sends alongside the row array
// (e.g. total_count, total_amount) is shown as a summary stat -- generic,
// since the exact field names weren't documented either.
const extractSummary = (res) => {
    if (!res || Array.isArray(res) || typeof res !== "object") return []
    return Object.entries(res)
        .filter(([, v]) => v !== null && typeof v !== "object")
        .map(([key, value]) => ({ key, label: humanize(key), value }))
}

const formatCell = (value) => {
    if (value === null || value === undefined || value === "") return "-"
    if (isIsoDateLike(value)) return formatDisplayDate(value)
    if (typeof value === "number") return value.toLocaleString("en-IN")
    return String(value)
}

const DomesticMisReport = () => {
    useEffect(() => { document.title = "Customer Dashboard Report" }, [])

    const { ErrorToaster } = ToasterProvider()

    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [selectedRange, setSelectedRange] = useState({ startDate: null, endDate: null })
    const [filterStatus, setFilterStatus] = useState("All")

    const [rows, setRows] = useState([])
    const [summary, setSummary] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

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
            if (ok) {
                setRows(unwrapRows(data))
                setSummary(extractSummary(data))
            } else {
                setRows([])
                setSummary([])
                ErrorToaster(data?.detail || data?.error || data?.message || "Failed to load the report")
            }
        } catch {
            setHasSearched(true)
            setRows([])
            setSummary([])
            ErrorToaster("Failed to load the report — network error")
        } finally {
            setLoading(false)
        }
    }

    const columns = useMemo(() => {
        if (!rows.length) return []
        return Object.keys(rows[0]).map((key) => ({
            header: humanize(key),
            accessorKey: key,
            enableSorting: true,
            cell: ({ getValue }) => formatCell(getValue()),
        }))
    }, [rows])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Customer Dashboard Report"
                subTitle={hasSearched ? `Total: ${rows.length} record(s)` : "Select a customer and date range to run the report."}
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

                {/* Summary -- generic stat strip built from whatever scalar fields the response sends alongside the rows. */}
                {summary.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-3">
                        {summary.map((stat) => (
                            <div
                                key={stat.key}
                                className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-2.5 py-1"
                            >
                                <span className="text-[11px] uppercase tracking-wider text-ink-muted">{stat.label}</span>
                                <Badge color="primary">{formatCell(stat.value)}</Badge>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table */}
                <div className="page-fit-body mt-4">
                    {loading ? (
                        <Loader fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={rows}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            defaultPageSize={20}
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            SearchPlaceholder="Search within results..."
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
