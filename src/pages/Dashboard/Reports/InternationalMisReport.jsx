import { useState, useEffect, useMemo } from "react"
import { Badge, Button, Label, Spinner } from "@/components/ui"
import MainHeaderComp from "../../../components/MainHeaderCom"
import TableContainer from "../../../components/Table/TableContainer"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { INTERNATIONAL_SHIPMENTS_REPORT } from "../../../api"
import ToasterProvider from "../../../helpers/ToasterProvider"
import Loader from "@/Loaders/Loader";
import axios from 'axios'
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

const InternationalMisReport = () => {
    useEffect(() => { document.title = "International MIS Report" }, [])

    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser"))?.user?.id, [])
    const [data, setData] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [downloading, setDownloading] = useState(false)
    const [selectedRange, setSelectedRange] = useState({ startDate: null, endDate: null })

    const { apifunc: fetchReport, loading } = useGetApiCall()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()

    // Default date range: current month to date
    useEffect(() => {
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        setSelectedRange({ startDate: firstDay, endDate: today })
    }, [])

    const getDateRangeDifference = () => {
        if (!selectedRange.startDate || !selectedRange.endDate) return 0
        const diffTime = Math.abs(selectedRange.endDate - selectedRange.startDate)
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const handleDateRangeChange = ({ startDate, endDate }) => {
        if (!startDate || !endDate) {
            setSelectedRange({ startDate, endDate })
            return
        }

        const diffTime = Math.abs(endDate - startDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // If difference exceeds 31 days, auto-limit end date to start date + 31 days
        if (diffDays > 31) {
            const maxEndDate = new Date(startDate)
            maxEndDate.setDate(maxEndDate.getDate() + 31)
            setSelectedRange({ startDate, endDate: maxEndDate })
            SucceesToaster("End date automatically limited to 31 days from start date")
            return
        }

        setSelectedRange({ startDate, endDate })
    }

    const handleFetchReport = async () => {
        if (!selectedRange.startDate || !selectedRange.endDate) {
            ErrorToaster("Please select both start and end dates")
            return
        }
        const { from_date, to_date } = YMD_DateFormate(selectedRange)

        try {
            const params = `user_id=${userId}&start_date=${from_date}&end_date=${to_date}&format=json`
            const res = await fetchReport(`${INTERNATIONAL_SHIPMENTS_REPORT}?${params}`)

            if (res?.data && Array.isArray(res.data)) {
                setData(res.data)
                setTotalCount(res.total_count || res.data.length)
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

        const { from_date, to_date } = YMD_DateFormate(selectedRange)
        setDownloading(true)
        try {
            const response = await axios.post(
                INTERNATIONAL_SHIPMENTS_REPORT,
                {
                    user_id: userId,
                    start_date: from_date,
                    end_date: to_date,
                    format: "excel"
                },
                { responseType: 'blob' }
            )

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `international-mis-report-${from_date}-to-${to_date}.xlsx`)
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
                return <Badge color={color}>{status}</Badge>
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

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="International MIS Report"
                subTitle={`Total: ${totalCount} shipments`}
                extraFields={
                    <Button
                        className="table-action-btn table-action-btn-solid"
                        onClick={handleDownload}
                        disabled={downloading || data.length === 0}
                    >
                        {downloading ? "Downloading..." : "Download Excel"}
                    </Button>
                }
            />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- single row that wraps, same as the rest of the report screens. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-72">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Date Range
                        </Label>
                        <DateRangeInput
                            value={selectedRange}
                            onChange={handleDateRangeChange}
                            isBorder={true}
                        />
                        {selectedRange.startDate && selectedRange.endDate && (
                            <span className="text-xs text-ink-muted">
                                Selected: {getDateRangeDifference()} days (Max: 31 days)
                            </span>
                        )}
                    </div>

                    <Button
                        color="primary"
                        onClick={handleFetchReport}
                        disabled={loading || !selectedRange.startDate || !selectedRange.endDate}
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
                            SearchPlaceholder="Search AWB, Customer, Origin, Destination..."
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

export default InternationalMisReport
