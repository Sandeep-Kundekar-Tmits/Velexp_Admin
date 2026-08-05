import { useState, useEffect, useMemo } from "react"
import { Badge, Button, Input, Label, Spinner } from "@/components/ui"
import MainHeaderComp from "../../../components/MainHeaderCom"
import TableContainer from "../../../components/Table/TableContainer"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { useExcelExport } from "../../../hooks/useExcelExport"
import { INTERNATIONAL_DIMENSION_CHANGE_LOG } from "../../../api"
import ToasterProvider from "../../../helpers/ToasterProvider"
import Loader from "@/Loaders/Loader";
import DateRangeInput from "../../../components/Common/DateRangeInput"
import YMD_DateFormate from "../../../helpers/YMD_DateFormate"

const formatDate = (dateString) => {
    if (!dateString) return "-"
    try {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    } catch {
        return dateString
    }
}

const formatDateTime = (dateString) => {
    if (!dateString) return "-"
    try {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    } catch {
        return dateString
    }
}

const fmtNum = (value) => {
    const num = Number(value)
    return Number.isFinite(num) ? num.toFixed(2) : "-"
}

const isChanged = (oldValue, newValue) => {
    const oldNum = Number(oldValue)
    const newNum = Number(newValue)
    if (!Number.isFinite(oldNum) || !Number.isFinite(newNum)) return false
    return oldNum !== newNum
}

const formatSourceLabel = (source) => {
    if (!source) return "-"
    return String(source)
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

const getSourceBadgeColor = (source) => {
    const key = String(source || "").toLowerCase()
    if (key.includes("api") || key.includes("tracking")) return "primary"
    if (key.includes("manual")) return "warning"
    if (key.includes("webhook")) return "success"
    return "secondary"
}

const oldValueColumn = (accessorKey) => ({
    header: "Old",
    accessorKey,
    enableSorting: true,
    enableColumnFilter: false,
    cell: ({ getValue }) => <span className="text-ink-muted">{fmtNum(getValue())}</span>
})

const newValueColumn = (oldKey, newKey) => ({
    header: "New",
    accessorKey: newKey,
    enableSorting: true,
    enableColumnFilter: false,
    cell: ({ row }) => {
        const changed = isChanged(row.original[oldKey], row.original[newKey])
        return (
            <span className={changed ? "text-danger-500 font-semibold" : ""}>
                {fmtNum(row.original[newKey])}
                {changed && <i className="mdi mdi-swap-horizontal ml-1" style={{ fontSize: "12px" }}></i>}
            </span>
        )
    }
})

const InternationalDimensionChangeLog = () => {
    useEffect(() => { document.title = "International Dimension Change Log" }, [])

    const [data, setData] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [awbno, setAwbno] = useState("")
    const [selectedRange, setSelectedRange] = useState(() => {
        const start = new Date()
        start.setDate(start.getDate() - 6)
        return { startDate: start, endDate: new Date() }
    })

    const { apifunc: fetchReport, loading } = useGetApiCall()
    const { exportToExcel, isExporting } = useExcelExport()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()

    const handleFetchReport = async () => {
        try {
            const { from_date, to_date } = YMD_DateFormate(selectedRange)
            const params = new URLSearchParams()
            if (awbno.trim()) params.append("awbno", awbno.trim())
            if (from_date) params.append("from_date", from_date)
            if (to_date) params.append("to_date", to_date)

            const queryString = params.toString()
            const url = queryString ? `${INTERNATIONAL_DIMENSION_CHANGE_LOG}?${queryString}` : INTERNATIONAL_DIMENSION_CHANGE_LOG
            const res = await fetchReport(url)

            if (res?.data && Array.isArray(res.data)) {
                setData(res.data)
                setTotalCount(res.total_count ?? res.data.length)
                if (res.data.length === 0) {
                    ErrorToaster("No dimension changes found for the selected filters")
                } else {
                    SucceesToaster(`Loaded ${res.data.length} record(s)`)
                }
            } else {
                setData([])
                setTotalCount(0)
                ErrorToaster("No data found for selected filters")
            }
        } catch {
            ErrorToaster("Error fetching dimension change log")
            setData([])
            setTotalCount(0)
        }
    }

    useEffect(() => {
        handleFetchReport()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleDownloadExcel = () => {
        if (data.length === 0) {
            ErrorToaster("No data to export")
            return
        }

        const meta = {
            "AWB No": awbno.trim() || "All",
            "From Date": formatDate(selectedRange.startDate),
            "To Date": formatDate(selectedRange.endDate),
        }

        exportToExcel(data, "International_Dimension_Change_Log", (item) => ({
            "AWB No": item.awbno,
            "Booking ID": item.booking_id,
            "Old Actual Weight (kg)": fmtNum(item.old_actual_weight),
            "New Actual Weight (kg)": fmtNum(item.new_actual_weight),
            "Old Length (cm)": fmtNum(item.old_vol_weightL),
            "New Length (cm)": fmtNum(item.new_vol_weightL),
            "Old Width (cm)": fmtNum(item.old_vol_weightW),
            "New Width (cm)": fmtNum(item.new_vol_weightW),
            "Old Height (cm)": fmtNum(item.old_vol_weightH),
            "New Height (cm)": fmtNum(item.new_vol_weightH),
            "Source": formatSourceLabel(item.source),
            "Changed At": formatDateTime(item.created_at),
        }), meta)
    }

    const columns = useMemo(() => [
        {
            header: "AWB No",
            columns: [
                {
                    header: "",
                    accessorKey: "awbno",
                    enableSorting: true,
                    enableColumnFilter: false,
                },
            ]
        },
        {
            header: "Booking ID",
            columns: [
                {
                    header: "",
                    accessorKey: "booking_id",
                    enableSorting: true,
                    enableColumnFilter: false,
                },
            ]
        },
        {
            header: "Actual Weight (kg)",
            columns: [
                oldValueColumn("old_actual_weight"),
                newValueColumn("old_actual_weight", "new_actual_weight"),
            ]
        },
        {
            header: "Length (cm)",
            columns: [
                oldValueColumn("old_vol_weightL"),
                newValueColumn("old_vol_weightL", "new_vol_weightL"),
            ]
        },
        {
            header: "Width (cm)",
            columns: [
                oldValueColumn("old_vol_weightW"),
                newValueColumn("old_vol_weightW", "new_vol_weightW"),
            ]
        },
        {
            header: "Height (cm)",
            columns: [
                oldValueColumn("old_vol_weightH"),
                newValueColumn("old_vol_weightH", "new_vol_weightH"),
            ]
        },
        {
            header: "Source",
            accessorKey: "source",
            enableSorting: true,
            enableColumnFilter: false,
            cell: ({ getValue }) => {
                const source = getValue()
                if (!source) return "-"
                return <Badge color={getSourceBadgeColor(source)} pill>{formatSourceLabel(source)}</Badge>
            }
        },
        {
            header: "Changed At",
            accessorKey: "created_at",
            enableSorting: true,
            enableColumnFilter: false,
            cell: ({ getValue }) => formatDateTime(getValue())
        },
    ], [])

    const { startDate, endDate } = selectedRange

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="International Dimension Change Log"
                subTitle={`Total: ${totalCount} change(s) found${startDate && endDate ? ` — ${formatDate(startDate)} to ${formatDate(endDate)}` : ""}`}
            />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- single row that wraps, same as the rest of the report screens. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-52">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            AWB Number (optional)
                        </Label>
                        <Input
                            type="text"
                            placeholder="Enter AWB number"
                            value={awbno}
                            onChange={(e) => setAwbno(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleFetchReport() }}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-72">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Date Range (defaults to last 7 days)
                        </Label>
                        <DateRangeInput
                            value={selectedRange}
                            onChange={setSelectedRange}
                            isBorder={true}
                        />
                    </div>

                    <Button
                        color="primary"
                        onClick={handleFetchReport}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Loading...
                            </>
                        ) : (
                            "Search"
                        )}
                    </Button>
                </div>

                {/* Table */}
                <div className="page-fit-body mt-4">
                    {loading ? (
                        <Loader fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={data}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            defaultPageSize={20}
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            isDownloadExcle={true}
                            onDownloadExcle={handleDownloadExcel}
                            ExcleLoading={isExporting}
                            SearchPlaceholder="Search AWB, Booking ID, Source..."
                            tableClass="table-nowrap"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="72vh"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default InternationalDimensionChangeLog
