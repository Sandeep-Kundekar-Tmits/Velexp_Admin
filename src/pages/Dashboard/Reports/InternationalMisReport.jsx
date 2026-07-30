import { useState, useEffect, useMemo } from "react"
import { Button } from "reactstrap"
import MainHeaderComp from "../../../components/MainHeaderCom"
import TableContainer from "../../../components/Table/TableContainer"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { INTERNATIONAL_SHIPMENTS_REPORT } from "../../../api"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { GridLoader } from "react-spinners"
import axios from 'axios'
import DateRangePicker from "../../../components/Common/DateRangePicker"

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

const InternationalMisReport = () => {
    useEffect(() => { document.title = "International MIS Report" }, [])

    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser"))?.user?.id, [])
    const [data, setData] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [downloading, setDownloading] = useState(false)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const { apifunc: fetchReport, loading } = useGetApiCall()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()

    // Set default date range (current month)
    useEffect(() => {
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

        const start = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`
        const end = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        setStartDate(start)
        setEndDate(end)
    }, [])

    const getDateRangeDifference = () => {
        if (!startDate || !endDate) return 0
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end - start)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const isDateRangeValid = () => {
        if (!startDate || !endDate) return false
        return getDateRangeDifference() <= 31
    }

    const handleDateRangeChange = (start, end) => {
        if (!start || !end) {
            setStartDate(start)
            setEndDate(end)
            return
        }

        const startDateObj = new Date(start)
        const endDateObj = new Date(end)

        // Calculate the difference
        const diffTime = Math.abs(endDateObj - startDateObj)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // If difference exceeds 31 days, auto-limit end date to start date + 31 days
        if (diffDays > 31) {
            const maxEndDate = new Date(startDateObj)
            maxEndDate.setDate(maxEndDate.getDate() + 31)

            const limitedEnd = `${maxEndDate.getFullYear()}-${String(maxEndDate.getMonth() + 1).padStart(2, '0')}-${String(maxEndDate.getDate()).padStart(2, '0')}`
            setStartDate(start)
            setEndDate(limitedEnd)
            SucceesToaster("End date automatically limited to 31 days from start date")
            return
        }

        setStartDate(start)
        setEndDate(end)
    }

    const handleFetchReport = async () => {
        if (!startDate || !endDate) {
            ErrorToaster("Please select both start and end dates")
            return
        }

        try {
            const params = `user_id=${userId}&start_date=${startDate}&end_date=${endDate}&format=json`
            const res = await fetchReport(`${INTERNATIONAL_SHIPMENTS_REPORT}?${params}`)

            if (res?.data && Array.isArray(res.data)) {
                setData(res.data)
                setTotalCount(res.total_count || res.data.length)
                setPage(1)
                SucceesToaster(`Loaded ${res.data.length} records`)
            } else {
                setData([])
                setTotalCount(0)
                ErrorToaster("No data found for selected dates")
            }
        } catch (error) {
            ErrorToaster("Error fetching report")
            setData([])
            setTotalCount(0)
        }
    }

    const handleDownload = async () => {
        if (data.length === 0) {
            ErrorToaster("Please fetch data first before downloading")
            return
        }

        setDownloading(true)
        try {
            const response = await axios.post(
                INTERNATIONAL_SHIPMENTS_REPORT,
                {
                    user_id: userId,
                    start_date: startDate,
                    end_date: endDate,
                    format: "excel"
                },
                { responseType: 'blob' }
            )

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `international-mis-report-${startDate}-to-${endDate}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            window.URL.revokeObjectURL(url)

            SucceesToaster("File downloaded successfully")
        } catch (error) {
            ErrorToaster("Error downloading file")
            console.error(error)
        } finally {
            setDownloading(false)
        }
    }

    const columns = useMemo(() => [
        {
            header: "AWB No",
            accessorKey: "awbno",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Domestic AWB",
            accessorKey: "dom_awbno",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Reference No",
            accessorKey: "refno",
            enableSorting: false,
            enableColumnFilter: false,
        },
        {
            header: "Shipper",
            accessorKey: "pick_name",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Consignee",
            accessorKey: "drop_name",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Origin",
            accessorKey: "origin_code",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Destination",
            accessorKey: "destination_code",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Pieces",
            accessorKey: "pieces",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Weight (kg)",
            accessorKey: "weight",
            enableSorting: true,
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue()?.toFixed(2) || "0.00"
        },
        {
            header: "Shipment Value",
            accessorKey: "shipment_value",
            enableSorting: true,
            enableColumnFilter: false,
            cell: ({ getValue }) => `₹ ${parseFloat(getValue() || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        },
        {
            header: "CSB Type",
            accessorKey: "csb_type",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Status",
            accessorKey: "status",
            enableSorting: true,
            enableColumnFilter: false,
            cell: ({ getValue }) => {
                const status = getValue()
                const color = status === "Success" ? "success" : status === "Pending" ? "warning" : "danger"
                return <span className={`badge bg-${color}`}>{status}</span>
            }
        },
        {
            header: "Created Date",
            accessorKey: "createddate",
            enableSorting: true,
            enableColumnFilter: false,
            cell: ({ getValue }) => formatDate(getValue())
        },
    ], [])

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
    const paginatedData = data.slice((page - 1) * pageSize, page * pageSize)

    return (
        <div className="page-content">
            <MainHeaderComp
                title="International MIS Report"
                subTitle={`Total: ${totalCount} shipments`}
                extraFields={
                    <Button
                        color="success"
                        onClick={handleDownload}
                        disabled={downloading || data.length === 0}
                    >
                        {downloading ? "Downloading..." : "Download Excel"}
                    </Button>
                }
            />

            <div className="container-fluid px-3 py-3">
                {/* Filter Section */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-7">
                                <DateRangePicker
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={handleDateRangeChange}
                                    label="Select Date Range"
                                />
                                {startDate && endDate && (
                                    <div className="alert alert-info mt-2 mb-0">
                                        <small>
                                            📅 Selected: {getDateRangeDifference()} days (Max: 31 days)
                                        </small>
                                    </div>
                                )}
                            </div>

                            <div className="col-md-5">
                                <Button
                                    color="primary"
                                    onClick={handleFetchReport}
                                    disabled={loading || !startDate || !endDate}
                                    className="w-100"
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Loading...
                                        </>
                                    ) : (
                                        "Fetch Report"
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
                            SearchPlaceholder="Search AWB, Customer, Origin, Destination..."
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

export default InternationalMisReport
