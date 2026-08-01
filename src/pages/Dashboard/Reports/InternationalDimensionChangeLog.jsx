import { useState, useEffect, useMemo } from "react"
import { Button, Input } from "reactstrap"
import MainHeaderComp from "../../../components/MainHeaderCom"
import TableContainer from "../../../components/Table/TableContainer"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { useExcelExport } from "../../../hooks/useExcelExport"
import { INTERNATIONAL_DIMENSION_CHANGE_LOG } from "../../../api"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { GridLoader } from "react-spinners"
import DateRangePicker from "../../../components/Common/DateRangePicker"

const toYMD = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

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
    cell: ({ getValue }) => <span className="text-muted">{fmtNum(getValue())}</span>
})

const newValueColumn = (oldKey, newKey) => ({
    header: "New",
    accessorKey: newKey,
    enableSorting: true,
    enableColumnFilter: false,
    cell: ({ row }) => {
        const changed = isChanged(row.original[oldKey], row.original[newKey])
        return (
            <span className={changed ? "text-danger fw-semibold" : ""}>
                {fmtNum(row.original[newKey])}
                {changed && <i className="mdi mdi-swap-horizontal ms-1" style={{ fontSize: "12px" }}></i>}
            </span>
        )
    }
})

const InternationalDimensionChangeLog = () => {
    useEffect(() => { document.title = "International Dimension Change Log" }, [])

    const [data, setData] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [awbno, setAwbno] = useState("")
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 6)
        return toYMD(d)
    })
    const [endDate, setEndDate] = useState(() => toYMD(new Date()))

    const { apifunc: fetchReport, loading } = useGetApiCall()
    const { exportToExcel, isExporting } = useExcelExport()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()

    const handleDateRangeChange = (start, end) => {
        setStartDate(start)
        setEndDate(end)
    }

    const handleFetchReport = async () => {
        try {
            const params = new URLSearchParams()
            if (awbno.trim()) params.append("awbno", awbno.trim())
            if (startDate) params.append("from_date", startDate)
            if (endDate) params.append("to_date", endDate)

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
            "From Date": formatDate(startDate),
            "To Date": formatDate(endDate),
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
                return <span className={`badge rounded-pill bg-${getSourceBadgeColor(source)}`}>{formatSourceLabel(source)}</span>
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

    return (
        <div className="page-content">
            <MainHeaderComp
                title="International Dimension Change Log"
                subTitle={`Total: ${totalCount} change(s) found${startDate && endDate ? ` — ${formatDate(startDate)} to ${formatDate(endDate)}` : ""}`}
            />

            <div className="container-fluid px-3 py-3">
                {/* Filter Section */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label className="fw-bold form-label">AWB Number (optional)</label>
                                <Input
                                    type="text"
                                    placeholder="Enter AWB number"
                                    value={awbno}
                                    onChange={(e) => setAwbno(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleFetchReport() }}
                                />
                            </div>

                            <div className="col-md-6">
                                <DateRangePicker
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={handleDateRangeChange}
                                    label="Date Range (defaults to last 7 days)"
                                />
                            </div>

                            <div className="col-md-3">
                                <Button
                                    color="primary"
                                    onClick={handleFetchReport}
                                    disabled={loading}
                                    className="w-100"
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Loading...
                                        </>
                                    ) : (
                                        "Search"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className="d-flex justify-content-center py-5">
                        <GridLoader color="#556ee6" />
                    </div>
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
                        tableClass="table-bordered table-nowrap"
                    />
                )}
            </div>
        </div>
    )
}

export default InternationalDimensionChangeLog
