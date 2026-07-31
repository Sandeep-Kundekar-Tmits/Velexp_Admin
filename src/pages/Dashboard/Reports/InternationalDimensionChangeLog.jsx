import { useState, useEffect, useMemo } from "react"
import { Button, Input } from "reactstrap"
import MainHeaderComp from "../../../components/MainHeaderCom"
import TableContainer from "../../../components/Table/TableContainer"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
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
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [awbno, setAwbno] = useState("")
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 6)
        return toYMD(d)
    })
    const [endDate, setEndDate] = useState(() => toYMD(new Date()))

    const { apifunc: fetchReport, loading } = useGetApiCall()
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
                setPage(1)
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

    const columns = useMemo(() => [
        {
            header: "AWB No",
            accessorKey: "awbno",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Booking ID",
            accessorKey: "booking_id",
            enableSorting: true,
            enableColumnFilter: false,
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
                return <span className="badge bg-info text-dark">{String(source).replace(/_/g, " ")}</span>
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

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
    const paginatedData = data.slice((page - 1) * pageSize, page * pageSize)

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
                    <>
                        <TableContainer
                            columns={columns}
                            data={paginatedData}
                            isGlobalFilter={true}
                            isPagination={false}
                            SearchPlaceholder="Search AWB, Booking ID, Source..."
                            tableClass="table-bordered table-nowrap"
                        />

                        {/* Pagination */}
                        {data.length > 0 && (
                            <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 px-3 py-2 bg-light rounded border">
                                <div className="d-flex align-items-center gap-2 mb-2 mb-sm-0">
                                    <span className="text-muted small">
                                        Showing <strong>{data.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(page * pageSize, data.length)}</strong> of <strong>{totalCount}</strong> entries
                                    </span>
                                    {data.length > 10 && (
                                        <div className="d-flex align-items-center gap-1 ms-3">
                                            <label className="text-muted small mb-0">Per page:</label>
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: "70px", cursor: "pointer" }}
                                                value={pageSize}
                                                onChange={(e) => {
                                                    const newSize = Number(e.target.value)
                                                    setPageSize(newSize)
                                                    setPage(1)
                                                }}
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {totalPages > 1 && (
                                    <div className="d-flex align-items-center gap-1">
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            outline
                                            disabled={page <= 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            ‹ Prev
                                        </Button>

                                        <div className="d-flex gap-1">
                                            {(() => {
                                                const pages = []
                                                const maxVisible = 5
                                                let start = Math.max(1, page - 2)
                                                let end = Math.min(totalPages, start + maxVisible - 1)
                                                if (end - start + 1 < maxVisible) {
                                                    start = Math.max(1, end - maxVisible + 1)
                                                }
                                                for (let i = start; i <= end; i++) {
                                                    pages.push(
                                                        <Button
                                                            key={i}
                                                            size="sm"
                                                            color={page === i ? "primary" : "secondary"}
                                                            outline={page !== i}
                                                            onClick={() => setPage(i)}
                                                        >
                                                            {i}
                                                        </Button>
                                                    )
                                                }
                                                return pages
                                            })()}
                                        </div>

                                        <Button
                                            size="sm"
                                            color="secondary"
                                            outline
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next ›
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default InternationalDimensionChangeLog
